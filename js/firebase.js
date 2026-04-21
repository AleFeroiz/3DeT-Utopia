// ============================================================
//  firebase.js — Firebase Auth + Firestore  v2
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB0SVvvQIrpy4w1cotLkFnl8VUVYoddxdg",
  authDomain: "site-ficha-3det-utopia.firebaseapp.com",
  projectId: "site-ficha-3det-utopia",
  storageBucket: "site-ficha-3det-utopia.firebasestorage.app",
  messagingSenderId: "77965862037",
  appId: "1:77965862037:web:e31028b5264f868bfde79c"
}

const FIREBASE_CONFIGURED = !Object.values(FIREBASE_CONFIG).includes("COLE_AQUI")

let _auth = null, _db = null, _user = null, _firebaseFns = null
let _authReadyResolve
// Bug #3: promise resolve quando onAuthStateChanged disparar pela primeira vez
const _authReady = new Promise(r => { _authReadyResolve = r })

const _loginCbs = [], _logoutCbs = []

export const onLogin  = (fn) => _loginCbs.push(fn)
export const onLogout = (fn) => _logoutCbs.push(fn)
export const getUser          = () => _user
export const estaConfigurado  = () => FIREBASE_CONFIGURED
export const aguardarAuth     = () => _authReady

export async function inicializarFirebase() {
  if (_auth) return true
  if (!FIREBASE_CONFIGURED) { _authReadyResolve(null); return false }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js")
    const { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")
    const { getFirestore, doc, setDoc, updateDoc, getDoc, deleteDoc, onSnapshot } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")

    _auth = getAuth(initializeApp(FIREBASE_CONFIG))
    _db   = getFirestore()
    _firebaseFns = { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, doc, setDoc, updateDoc, getDoc, deleteDoc, onSnapshot }

    // Processa o resultado do redirect ANTES de reagir ao onAuthStateChanged.
    // Quando o usuário volta ao site após o Google redirect, o Firebase dispara
    // onAuthStateChanged(null) primeiro e só depois onAuthStateChanged(user).
    // Se resolvermos _authReady no null, o site renderiza sem login.
    // A solução: aguardar getRedirectResult terminar antes de resolver _authReady.
    let _redirectProcessado = false
    const _redirectPromise = _firebaseFns.getRedirectResult(_auth)
      .then(result => {
        if (result?.user) console.info("[Firebase] redirect login ok:", result.user.email)
      })
      .catch(e => console.warn("[Firebase] getRedirectResult:", e))
      .finally(() => { _redirectProcessado = true })

    let _authResolved = false
    onAuthStateChanged(_auth, async (user) => {
      // Aguarda redirect terminar antes de qualquer coisa
      if (!_redirectProcessado) await _redirectPromise

      _user = user

      // Resolve _authReady apenas uma vez:
      // - se há usuário logado, resolve imediatamente
      // - se não há usuário e redirect já processou, é logout real — resolve
      // Isso evita resolver com null durante o flash do redirect
      if (!_authResolved && (user || _redirectProcessado)) {
        _authResolved = true
        _authReadyResolve(user)
      }

      // Só dispara callbacks após redirect processado para evitar onLogout espúrio
      if (user) {
        _loginCbs.forEach(fn => fn(user))
      } else if (_redirectProcessado) {
        _logoutCbs.forEach(fn => fn())
      }
    })
    return true
  } catch(e) { console.error("[Firebase]", e); _authReadyResolve(null); return false }
}

// Fix GitHub Pages: usa sempre signInWithRedirect.
// signInWithPopup é bloqueado pelo header Cross-Origin-Opener-Policy do GitHub Pages.
export const loginGoogle = async () => {
  if (!_auth || !_firebaseFns) return
  await _firebaseFns.signInWithRedirect(_auth, new _firebaseFns.GoogleAuthProvider())
}
export const logout = async () => { if (_auth && _firebaseFns) await _firebaseFns.signOut(_auth) }

// ─── helpers internos ────────────────────────────────────
const _ok = () => _db && _user && _firebaseFns
const _okPub = () => _db && _firebaseFns
const _colFicha = (modo) => modo === "mestre" ? "fichas_mestre" : "fichas_player"
const _chaveIndice = (modo) => modo === "mestre" ? "indice_mestre" : "indice_player"
const _chavePastas = (modo) => modo === "mestre" ? "pastas_mestre" : "pastas_player"

export async function carregarIndiceFichasFirestore(modo = "player") {
  if (!_ok()) return null
  try {
    const snap = await _firebaseFns.getDoc(
      _firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo))
    )
    return snap.exists() ? (snap.data().fichas ?? []) : []
  } catch(e) { console.error("[Firestore] carregar índice:", e); return null }
}

export async function salvarIndiceFichasFirestore(fichas, modo = "player") {
  if (!_ok()) return false
  try {
    const indice = fichas.map(f => ({
      id: f.id, nome: f.nome ?? "Sem Nome",
      pastaId: f.pastaId ?? null, nivel: f.nivel ?? 1,
      racaId: f.racaId ?? "", profissaoId: f.profissaoId ?? "",
      imagemThumb: f.imagemThumb ?? null,
      corTema:     f.corTema     ?? "#3b82f6",
    }))
    await _firebaseFns.setDoc(
      _firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo)),
      { fichas: indice, updatedAt: new Date().toISOString() }
    )
    return true
  } catch(e) { console.error("[Firestore] salvar índice:", e); return false }
}

export async function salvarFichaFirestore(fichaObj, modo = "player") {
  if (!_ok() || !fichaObj?.id) return false
  try {
    await _firebaseFns.setDoc(
      _firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaObj.id),
      { ...fichaObj, _ownerUid: _user.uid, _updatedAt: new Date().toISOString() }
    )
    return true
  } catch(e) { console.error("[Firestore] salvar ficha:", e); return false }
}

export async function carregarFichaFirestore(fichaId, modo = "player") {
  if (!_ok()) return null
  try {
    const snap = await _firebaseFns.getDoc(
      _firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaId)
    )
    return snap.exists() ? snap.data() : null
  } catch(e) { console.error("[Firestore] carregar ficha:", e); return null }
}

export async function removerFichaFirestore(fichaId, modo = "player") {
  if (!_ok()) return false
  try {
    await _firebaseFns.deleteDoc(
      _firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaId)
    )
    return true
  } catch(e) { console.error("[Firestore] remover ficha:", e); return false }
}

export async function salvarPastasFirestore(pastas, modo = "player") {
  if (!_ok()) return false
  try {
    await _firebaseFns.setDoc(
      _firebaseFns.doc(_db, "users", _user.uid, "dados", _chavePastas(modo)),
      { pastas, updatedAt: new Date().toISOString() }
    )
    return true
  } catch(e) { console.error("[Firestore] salvar pastas:", e); return false }
}

export async function carregarPastasFirestore(modo = "player") {
  if (!_ok()) return null
  try {
    const snap = await _firebaseFns.getDoc(
      _firebaseFns.doc(_db, "users", _user.uid, "dados", _chavePastas(modo))
    )
    return snap.exists() ? (snap.data().pastas ?? []) : []
  } catch(e) { console.error("[Firestore] carregar pastas:", e); return null }
}

export async function registrarIndicePublico(fichaId, ownerUid, modo = "player") {
  if (!_okPub() || !fichaId || !ownerUid) return false
  try {
    await _firebaseFns.setDoc(
      _firebaseFns.doc(_db, "public_index", fichaId),
      { ownerUid, modo, _updatedAt: new Date().toISOString() }
    )
    return true
  } catch(e) { console.error("[Firestore] registrar índice público:", e); return false }
}

export async function removerIndicePublico(fichaId) {
  if (!_okPub() || !fichaId) return false
  try {
    await _firebaseFns.deleteDoc(_firebaseFns.doc(_db, "public_index", fichaId))
    return true
  } catch(e) { console.error("[Firestore] remover índice público:", e); return false }
}

export async function carregarFichaDeOutroUsuario(fichaId) {
  if (!_okPub()) return null
  try {
    const idxSnap = await _firebaseFns.getDoc(
      _firebaseFns.doc(_db, "public_index", fichaId)
    )
    if (!idxSnap.exists()) return null
    const { ownerUid, modo } = idxSnap.data()
    if (!ownerUid) return null
    const col = modo === "mestre" ? "fichas_mestre" : "fichas_player"
    const fichaSnap = await _firebaseFns.getDoc(
      _firebaseFns.doc(_db, "users", ownerUid, col, fichaId)
    )
    if (!fichaSnap.exists()) return null
    const data = fichaSnap.data()
    return data.isPublic ? { ...data, _ownerUid: ownerUid, _modo: modo } : null
  } catch(e) { console.error("[Firestore] carregar ficha de outro usuário:", e); return null }
}

export async function salvarFichaComoEditor(fichaObj, ownerUid, modo = "player") {
  if (!_okPub() || !fichaObj?.id || !ownerUid) return false
  try {
    const col = modo === "mestre" ? "fichas_mestre" : "fichas_player"
    const ref = _firebaseFns.doc(_db, "users", ownerUid, col, fichaObj.id)
    const { _ownerUid: _o, isPublic, editPublic, ...dadosEditaveis } = fichaObj
    await _firebaseFns.updateDoc(ref, {
      ...dadosEditaveis,
      _updatedAt: new Date().toISOString()
    })
    return true
  } catch(e) { console.error("[Firestore] salvar como editor:", e); return false }
}

export function escutarFicha(fichaId, modo = "player", ownerUid = null, callback) {
  if (!_db || !_firebaseFns?.onSnapshot) return () => {}
  const uid = ownerUid ?? _user?.uid
  if (!uid) return () => {}
  const col  = modo === "mestre" ? "fichas_mestre" : "fichas_player"
  const ref  = _firebaseFns.doc(_db, "users", uid, col, fichaId)
  return _firebaseFns.onSnapshot(ref,
    (snap) => { if (snap.exists()) callback(snap.data()) },
    (err)  => console.warn("[Firestore] escuta interrompida:", err)
  )
}