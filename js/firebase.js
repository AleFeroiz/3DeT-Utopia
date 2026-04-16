// ============================================================
//  firebase.js — Firebase Auth (Google) + Firestore
//  INSTRUÇÕES DE SETUP:
//  1. Crie um projeto em https://console.firebase.google.com
//  2. Ative Authentication > Google
//  3. Ative Firestore Database
//  4. Vá em Project Settings > Seus apps > Web > copie o firebaseConfig
//  5. Substitua o objeto FIREBASE_CONFIG abaixo
//  6. No Firestore, adicione esta regra de segurança:
//     rules_version = '2';
//     service cloud.firestore {
//       match /databases/{database}/documents {
//         match /users/{userId}/{document=**} {
//           allow read, write: if request.auth.uid == userId;
//         }
//       }
//     }
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

// ── Importações dinâmicas do Firebase SDK (CDN) ───────────
let _auth = null
let _db   = null
let _user = null

// Callbacks registrados pela app
const _onLoginCallbacks  = []
const _onLogoutCallbacks = []

export function onLogin(fn)  { _onLoginCallbacks.push(fn)  }
export function onLogout(fn) { _onLogoutCallbacks.push(fn) }

export function getUser() { return _user }
export function estaConfigurado() { return FIREBASE_CONFIGURED }

// ── Inicialização ─────────────────────────────────────────
export async function inicializarFirebase() {
  if (!FIREBASE_CONFIGURED) {
    console.warn("[Firebase] Config não definido — usando localStorage.")
    return false
  }

  try {
    const { initializeApp }          = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js")
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
      = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")
    const { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc }
      = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")

    const app = initializeApp(FIREBASE_CONFIG)
    _auth = getAuth(app)
    _db   = getFirestore(app)

    // Monitora estado de autenticação
    onAuthStateChanged(_auth, async (user) => {
      _user = user
      if (user) {
        _onLoginCallbacks.forEach(fn => fn(user))
      } else {
        _onLogoutCallbacks.forEach(fn => fn())
      }
    })

    // Expõe funções internamente
    _firebaseFns = { GoogleAuthProvider, signInWithPopup, signOut, doc, setDoc, getDoc, collection, getDocs, deleteDoc }

    return true
  } catch (e) {
    console.error("[Firebase] Erro ao inicializar:", e)
    return false
  }
}

let _firebaseFns = null

export async function loginGoogle() {
  if (!_auth || !_firebaseFns) return
  const provider = new _firebaseFns.GoogleAuthProvider()
  await _firebaseFns.signInWithPopup(_auth, provider)
}

export async function logout() {
  if (!_auth || !_firebaseFns) return
  await _firebaseFns.signOut(_auth)
}

// ── Fichas no Firestore ────────────────────────────────────

export async function salvarFichasFirestore(fichas) {
  if (!_db || !_user || !_firebaseFns) return false
  try {
    const { doc, setDoc } = _firebaseFns
    await setDoc(
      doc(_db, "users", _user.uid, "dados", "fichas"),
      { fichas, updatedAt: new Date().toISOString() }
    )
    return true
  } catch (e) {
    console.error("[Firestore] Erro ao salvar:", e)
    return false
  }
}

export async function carregarFichasFirestore() {
  if (!_db || !_user || !_firebaseFns) return null
  try {
    const { doc, getDoc } = _firebaseFns
    const snap = await getDoc(doc(_db, "users", _user.uid, "dados", "fichas"))
    return snap.exists() ? snap.data().fichas : []
  } catch (e) {
    console.error("[Firestore] Erro ao carregar:", e)
    return null
  }
}

// ── Ficha individual por ID ────────────────────────────────

export async function salvarFichaFirestore(fichaObj) {
  if (!_db || !_user || !_firebaseFns || !fichaObj?.id) return false
  try {
    const { doc, setDoc } = _firebaseFns
    await setDoc(
      doc(_db, "users", _user.uid, "fichas", fichaObj.id),
      { ...fichaObj, _updatedAt: new Date().toISOString() }
    )
    return true
  } catch (e) {
    console.error("[Firestore] Erro ao salvar ficha:", e)
    return false
  }
}

export async function carregarFichaFirestore(fichaId) {
  if (!_db || !_user || !_firebaseFns) return null
  try {
    const { doc, getDoc } = _firebaseFns
    const snap = await getDoc(doc(_db, "users", _user.uid, "fichas", fichaId))
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.error("[Firestore] Erro ao carregar ficha:", e)
    return null
  }
}

// ── Pastas por modo ────────────────────────────────────────

export async function salvarPastasFirestore(pastas, chave = "pastas_player") {
  if (!_db || !_user || !_firebaseFns) return false
  try {
    const { doc, setDoc } = _firebaseFns
    await setDoc(
      doc(_db, "users", _user.uid, "dados", chave),
      { pastas, updatedAt: new Date().toISOString() }
    )
    return true
  } catch (e) {
    console.error("[Firestore] Erro ao salvar pastas:", e)
    return false
  }
}

export async function carregarPastasFirestore(chave = "pastas_player") {
  if (!_db || !_user || !_firebaseFns) return null
  try {
    const { doc, getDoc } = _firebaseFns
    const snap = await getDoc(doc(_db, "users", _user.uid, "dados", chave))
    return snap.exists() ? (snap.data().pastas ?? []) : []
  } catch (e) {
    console.error("[Firestore] Erro ao carregar pastas:", e)
    return null
  }
}

// ── Índice de fichas (lista de ids) ───────────────────────
// Salva apenas metadados leves no índice; a ficha completa fica no doc próprio

export async function salvarIndiceFichasFirestore(fichas, chave = "fichas") {
  if (!_db || !_user || !_firebaseFns) return false
  try {
    const { doc, setDoc } = _firebaseFns
    // Salva apenas id, nome, pastaId, nivel para o índice
    const indice = fichas.map(f => ({
      id:        f.id,
      nome:      f.nome,
      pastaId:   f.pastaId ?? null,
      nivel:     f.nivel ?? 1,
    }))
    await setDoc(
      doc(_db, "users", _user.uid, "dados", chave),
      { fichas: indice, updatedAt: new Date().toISOString() }
    )
    return true
  } catch (e) {
    console.error("[Firestore] Erro ao salvar índice:", e)
    return false
  }
}

// ── Fichas públicas (acessíveis sem autenticação) ─────────
// Caminho: public_fichas/{fichaId}
// Firebase Rules devem permitir:
//   read: if resource.data.isPublic == true
//   write: if resource.data.isPublic == true && resource.data.editPublic == true

export async function salvarFichaPublicaFirestore(fichaObj) {
  if (!_db || !_firebaseFns || !fichaObj?.id) return false
  try {
    const { doc, setDoc } = _firebaseFns
    await setDoc(
      doc(_db, "public_fichas", fichaObj.id),
      { ...fichaObj, _updatedAt: new Date().toISOString() }
    )
    return true
  } catch (e) {
    console.error("[Firestore] Erro ao salvar ficha pública:", e)
    return false
  }
}

export async function carregarFichaPublicaFirestore(fichaId) {
  if (!_db || !_firebaseFns) return null
  try {
    const { doc, getDoc } = _firebaseFns
    const snap = await getDoc(doc(_db, "public_fichas", fichaId))
    if (!snap.exists()) return null
    const data = snap.data()
    // Só retorna se a ficha estiver marcada como pública
    return data.isPublic ? data : null
  } catch (e) {
    console.error("[Firestore] Erro ao carregar ficha pública:", e)
    return null
  }
}

export async function removerFichaPublicaFirestore(fichaId) {
  if (!_db || !_firebaseFns) return false
  try {
    const { doc, deleteDoc } = _firebaseFns
    await deleteDoc(doc(_db, "public_fichas", fichaId))
    return true
  } catch (e) {
    console.error("[Firestore] Erro ao remover ficha pública:", e)
    return false
  }
}
