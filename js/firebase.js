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
export const aguardarAuth     = () => _authReady   // Bug #3: await antes de usar getUser()

export async function inicializarFirebase() {
  if (_auth) return true  // Bug #6: idempotente
  if (!FIREBASE_CONFIGURED) { _authReadyResolve(null); return false }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js")
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")
    const { getFirestore, doc, setDoc, getDoc, deleteDoc } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")

    _auth = getAuth(initializeApp(FIREBASE_CONFIG))
    _db   = getFirestore()
    _firebaseFns = { GoogleAuthProvider, signInWithPopup, signOut, doc, setDoc, getDoc, deleteDoc }

    onAuthStateChanged(_auth, (user) => {
      _user = user
      _authReadyResolve(user)  // resolve na primeira chamada
      if (user) _loginCbs.forEach(fn => fn(user))
      else      _logoutCbs.forEach(fn => fn())
    })
    return true
  } catch(e) { console.error("[Firebase]", e); _authReadyResolve(null); return false }
}

export const loginGoogle = async () => {
  if (!_auth || !_firebaseFns) return
  await _firebaseFns.signInWithPopup(_auth, new _firebaseFns.GoogleAuthProvider())
}
export const logout = async () => { if (_auth && _firebaseFns) await _firebaseFns.signOut(_auth) }

// ─── helpers internos ────────────────────────────────────
const _ok = () => _db && _user && _firebaseFns
const _okPub = () => _db && _firebaseFns
const _colFicha = (modo) => modo === "mestre" ? "fichas_mestre" : "fichas_player"  // Bug #10
const _chaveIndice = (modo) => modo === "mestre" ? "indice_mestre" : "indice_player"
const _chavePastas = (modo) => modo === "mestre" ? "pastas_mestre" : "pastas_player"

// ─── Índice de fichas (metadados leves) ──────────────────
// Bug #9: função renomeada e aceita modo, sem parâmetro ignorado

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
    }))
    await _firebaseFns.setDoc(
      _firebaseFns.doc(_db, "users", _user.uid, "dados", _chaveIndice(modo)),
      { fichas: indice, updatedAt: new Date().toISOString() }
    )
    return true
  } catch(e) { console.error("[Firestore] salvar índice:", e); return false }
}

// ─── Ficha individual ─────────────────────────────────────
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

// Bug #21: deletar doc individual do Firestore
export async function removerFichaFirestore(fichaId, modo = "player") {
  if (!_ok()) return false
  try {
    await _firebaseFns.deleteDoc(
      _firebaseFns.doc(_db, "users", _user.uid, _colFicha(modo), fichaId)
    )
    return true
  } catch(e) { console.error("[Firestore] remover ficha:", e); return false }
}

// ─── Pastas ───────────────────────────────────────────────
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

// ─── Fichas públicas ──────────────────────────────────────
export async function salvarFichaPublicaFirestore(fichaObj) {
  if (!_okPub() || !fichaObj?.id) return false
  try {
    await _firebaseFns.setDoc(
      _firebaseFns.doc(_db, "public_fichas", fichaObj.id),
      { ...fichaObj, _updatedAt: new Date().toISOString() }
    )
    return true
  } catch(e) { console.error("[Firestore] salvar pública:", e); return false }
}

export async function carregarFichaPublicaFirestore(fichaId) {
  if (!_okPub()) return null
  try {
    const snap = await _firebaseFns.getDoc(
      _firebaseFns.doc(_db, "public_fichas", fichaId)
    )
    if (!snap.exists()) return null
    const data = snap.data()
    return data.isPublic ? data : null
  } catch(e) { console.error("[Firestore] carregar pública:", e); return null }
}

export async function removerFichaPublicaFirestore(fichaId) {
  if (!_okPub()) return false
  try {
    await _firebaseFns.deleteDoc(_firebaseFns.doc(_db, "public_fichas", fichaId))
    return true
  } catch(e) { console.error("[Firestore] remover pública:", e); return false }
}

// ─── Legado (não remover — outros arquivos ainda importam) ─

