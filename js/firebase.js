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

// ⚠️  SUBSTITUA COM SEU PRÓPRIO CONFIG DO FIREBASE
const FIREBASE_CONFIG = {
  apiKey:            "COLE_AQUI",
  authDomain:        "COLE_AQUI",
  projectId:         "COLE_AQUI",
  storageBucket:     "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId:             "COLE_AQUI"
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
