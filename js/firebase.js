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
const _authReady = new Promise(r => { _authReadyResolve = r })

const _loginCbs = [], _logoutCbs = []

export const onLogin  = (fn) => _loginCbs.push(fn)
export const onLogout = (fn) => _logoutCbs.push(fn)
export const getUser          = () => _user
export const getDb            = () => _db
export const getFirebaseFns   = () => _firebaseFns
export const estaConfigurado  = () => FIREBASE_CONFIGURED
export const aguardarAuth     = () => _authReady

export async function inicializarFirebase() {
  if (_auth) return true
  if (!FIREBASE_CONFIGURED) { _authReadyResolve(null); return false }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js")
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")
    const { getFirestore, doc, setDoc, updateDoc, getDoc, deleteDoc, onSnapshot } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")

    // DEPOIS (correto)
    const _app = initializeApp(FIREBASE_CONFIG)
    _auth = getAuth(_app)
    _db   = getFirestore(_app)
    _firebaseFns = { GoogleAuthProvider, signInWithPopup, signOut, doc, setDoc, updateDoc, getDoc, deleteDoc, onSnapshot }

    onAuthStateChanged(_auth, (user) => {
      _user = user
      _authReadyResolve(user)
      if (user) _loginCbs.forEach(fn => fn(user))
      else      _logoutCbs.forEach(fn => fn())
    })
    return true
  } catch(e) { console.error("[Firebase]", e); _authReadyResolve(null); return false }
}

export const loginGoogle = async () => {
  if (!_auth || !_firebaseFns) return
  const provider = new _firebaseFns.GoogleAuthProvider()
  // Fix GitHub Pages COOP: abre o popup manualmente antes do Firebase tentar,
  // isso evita o bloqueio do Cross-Origin-Opener-Policy
  await _firebaseFns.signInWithPopup(_auth, provider)
}
export const logout = async () => { if (_auth && _firebaseFns) await _firebaseFns.signOut(_auth) }

const _ok = () => _db && _user && _firebaseFns
const _okPub = () => _db && _firebaseFns
const _colFicha = (modo) => modo === "mestre" ? "fichas_mestre" : "fichas_player"
const _chaveIndice = (modo) => modo === "mestre" ? "indice_mestre" : "indice_player"
const _chavePastas = (modo) => modo === "mestre" ? "pastas_mestre" : "pastas_player"

export async function carregarIndiceFichasFirestore(modo = "player") {
  if (!_ok()) return null
  try {
    const snap = await _firebaseFns.getDoc(_firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo)))
    return snap.exists() ? (snap.data().fichas ?? []) : []
  } catch(e) { console.error("[Firestore] carregar índice:", e); return null }
}
export async function salvarIndiceFichasFirestore(fichas, modo = "player") {
  if (!_ok()) return false
  try {
    const indice = fichas.map(f => ({ id: f.id, nome: f.nome ?? "Sem Nome", pastaId: f.pastaId ?? null, nivel: f.nivel ?? 1, racaId: f.racaId ?? "", profissaoId: f.profissaoId ?? "", imagemThumb: f.imagemThumb ?? null, corTema: f.corTema ?? "#3b82f6", pontosGastos: f.pontos?.gastos ?? 0, pontosTotal: f.pontos?.total ?? 10 }))
    await _firebaseFns.setDoc(_firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo)), { fichas: indice, updatedAt: new Date().toISOString() })
    return true
  } catch(e) { console.error("[Firestore] salvar índice:", e); return false }
}
export async function salvarFichaFirestore(fichaObj, modo = "player") {
  if (!_ok() || !fichaObj?.id) return false
  try {
    await _firebaseFns.setDoc(_firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaObj.id), { ...fichaObj, _ownerUid: _user.uid, _updatedAt: new Date().toISOString() })

    // Atualiza a entrada desta ficha no índice com os metadados mais recentes
    // (pontos, nome, nível, etc.) sem reescrever o índice inteiro
    const snapIndice = await _firebaseFns.getDoc(_firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo)))
    if (snapIndice.exists()) {
      const indiceAtual = snapIndice.data().fichas ?? []
      const idx = indiceAtual.findIndex(f => f.id === fichaObj.id)
      if (idx !== -1) {
        indiceAtual[idx] = {
          ...indiceAtual[idx],           // preserva pastaId e outros campos do índice
          nome:         fichaObj.nome         ?? "Sem Nome",
          nivel:        fichaObj.nivel         ?? 1,
          racaId:       fichaObj.racaId        ?? "",
          profissaoId:  fichaObj.profissaoId   ?? "",
          // pastaId: NÃO sobrescreve — só existe no índice, nunca no doc individual
          imagemThumb:  fichaObj.imagemThumb   ?? indiceAtual[idx].imagemThumb ?? null,
          corTema:      fichaObj.corTema       ?? "#3b82f6",
          pontosGastos: fichaObj.pontos?.gastos ?? 0,
          pontosTotal:  fichaObj.pontos?.total  ?? 10,
        }
        await _firebaseFns.setDoc(
          _firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo)),
          { fichas: indiceAtual, updatedAt: new Date().toISOString() }
        )
      }
    }

    return true
  } catch(e) { console.error("[Firestore] salvar ficha:", e); return false }
}
export async function carregarFichaFirestore(fichaId, modo = "player") {
  if (!_ok()) return null
  try {
    const snap = await _firebaseFns.getDoc(_firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaId))
    return snap.exists() ? snap.data() : null
  } catch(e) { console.error("[Firestore] carregar ficha:", e); return null }
}
export async function removerFichaFirestore(fichaId, modo = "player") {
  if (!_ok()) return false
  try {
    await _firebaseFns.deleteDoc(_firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaId))
    return true
  } catch(e) { console.error("[Firestore] remover ficha:", e); return false }
}
export async function salvarPastasFirestore(pastas, modo = "player") {
  if (!_ok()) return false
  try {
    await _firebaseFns.setDoc(_firebaseFns.doc(_db, "users", _user.uid, "dados", _chavePastas(modo)), { pastas, updatedAt: new Date().toISOString() })
    return true
  } catch(e) { console.error("[Firestore] salvar pastas:", e); return false }
}
export async function carregarPastasFirestore(modo = "player") {
  if (!_ok()) return null
  try {
    const snap = await _firebaseFns.getDoc(_firebaseFns.doc(_db, "users", _user.uid, "dados", _chavePastas(modo)))
    return snap.exists() ? (snap.data().pastas ?? []) : []
  } catch(e) { console.error("[Firestore] carregar pastas:", e); return null }
}
export async function registrarIndicePublico(fichaId, ownerUid, modo = "player") {
  if (!_okPub() || !fichaId || !ownerUid) return false
  try {
    await _firebaseFns.setDoc(_firebaseFns.doc(_db, "public_index", fichaId), { ownerUid, modo, _updatedAt: new Date().toISOString() })
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
    const idxSnap = await _firebaseFns.getDoc(_firebaseFns.doc(_db, "public_index", fichaId))
    if (!idxSnap.exists()) return null
    const { ownerUid, modo } = idxSnap.data()
    if (!ownerUid) return null
    const col = modo === "mestre" ? "fichas_mestre" : "fichas_player"
    const fichaSnap = await _firebaseFns.getDoc(_firebaseFns.doc(_db, "users", ownerUid, col, fichaId))
    if (!fichaSnap.exists()) return null
    const data = fichaSnap.data()
    return data.isPublic ? { ...data, _ownerUid: ownerUid, _modo: modo } : null
  } catch(e) { console.error("[Firestore] carregar ficha de outro usuário:", e); return null }
}
export async function salvarFichaComoEditor(fichaObj, ownerUid, modo = "player") {
  if (!_okPub() || !fichaObj?.id || !ownerUid) return false
  try {
    const col = modo === "mestre" ? "fichas_mestre" : "fichas_player"
    const { _ownerUid: _o, isPublic, editPublic, ...dadosEditaveis } = fichaObj
    await _firebaseFns.updateDoc(_firebaseFns.doc(_db, "users", ownerUid, col, fichaObj.id), { ...dadosEditaveis, _updatedAt: new Date().toISOString() })
    return true
  } catch(e) { console.error("[Firestore] salvar como editor:", e); return false }
}
export function escutarFicha(fichaId, modo = "player", ownerUid = null, callback) {
  if (!_db || !_firebaseFns?.onSnapshot) return () => {}
  const uid = ownerUid ?? _user?.uid
  if (!uid) return () => {}
  const col = modo === "mestre" ? "fichas_mestre" : "fichas_player"
  const ref = _firebaseFns.doc(_db, "users", uid, col, fichaId)
  return _firebaseFns.onSnapshot(ref, (snap) => { if (snap.exists()) callback(snap.data()) }, (err) => console.warn("[Firestore] escuta interrompida:", err))
}