// ─────────────────────────────────────────────
// 🔥 CONFIG DO FIREBASE (SEU PROJETO)
// ─────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB0SVvvQIrpy4w1cotLkFnl8VUVYoddxdg",
  authDomain: "site-ficha-3det-utopia.firebaseapp.com",
  projectId: "site-ficha-3det-utopia",
  storageBucket: "site-ficha-3det-utopia.firebasestorage.app",
  messagingSenderId: "77965862037",
  appId: "1:77965862037:web:e31028b5264f868bfde79c"
}

const FIREBASE_CONFIGURED = !!FIREBASE_CONFIG.apiKey

// ─────────────────────────────────────────────
// 🔌 VARIÁVEIS INTERNAS
// ─────────────────────────────────────────────
let _auth = null
let _db   = null
let _user = null
let _firebaseFns = null

// Callbacks
const _onLoginCallbacks  = []
const _onLogoutCallbacks = []

export function onLogin(fn)  { _onLoginCallbacks.push(fn) }
export function onLogout(fn) { _onLogoutCallbacks.push(fn) }

export function getUser() { return _user }
export function estaConfigurado() { return FIREBASE_CONFIGURED }

// ─────────────────────────────────────────────
// 🚀 INICIALIZAÇÃO
// ─────────────────────────────────────────────
export async function inicializarFirebase() {
  if (!FIREBASE_CONFIGURED) {
    console.warn("[Firebase] Config não definido.")
    return false
  }

  try {
    // Import dinâmico (CDN)
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js")

    const {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      signOut,
      onAuthStateChanged
    } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")

    const {
      getFirestore,
      doc,
      setDoc,
      getDoc
    } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")

    // Inicializa app
    const app = initializeApp(FIREBASE_CONFIG)

    _auth = getAuth(app)
    _db   = getFirestore(app)

    // Observa login/logout
    onAuthStateChanged(_auth, (user) => {
      _user = user

      if (user) {
        console.log("[Firebase] Logado:", user.email)
        _onLoginCallbacks.forEach(fn => fn(user))
      } else {
        console.log("[Firebase] Deslogado")
        _onLogoutCallbacks.forEach(fn => fn())
      }
    })

    // Guarda funções internas
    _firebaseFns = {
      GoogleAuthProvider,
      signInWithPopup,
      signOut,
      doc,
      setDoc,
      getDoc
    }

    return true

  } catch (e) {
    console.error("[Firebase] Erro ao inicializar:", e)
    return false
  }
}

// ─────────────────────────────────────────────
// 🔑 LOGIN / LOGOUT
// ─────────────────────────────────────────────
export async function loginGoogle() {
  if (!_auth || !_firebaseFns) return

  const provider = new _firebaseFns.GoogleAuthProvider()
  await _firebaseFns.signInWithPopup(_auth, provider)
}

export async function logout() {
  if (!_auth || !_firebaseFns) return
  await _firebaseFns.signOut(_auth)
}

// ─────────────────────────────────────────────
// 💾 FIRESTORE (FICHAS)
// ─────────────────────────────────────────────

export async function salvarFichasFirestore(fichas) {
  if (!_db || !_user || !_firebaseFns) return false

  try {
    const { doc, setDoc } = _firebaseFns

    await setDoc(
      doc(_db, "users", _user.uid, "dados", "fichas"),
      {
        fichas,
        updatedAt: new Date().toISOString()
      }
    )

    return true

  } catch (e) {
    console.error("[Firestore] Erro ao salvar:", e)
    return false
  }
}

export async function carregarFichasFirestore() {
  if (!_db || !_user || !_firebaseFns) return []

  try {
    const { doc, getDoc } = _firebaseFns

    const snap = await getDoc(
      doc(_db, "users", _user.uid, "dados", "fichas")
    )

    return snap.exists() ? snap.data().fichas : []

  } catch (e) {
    console.error("[Firestore] Erro ao carregar:", e)
    return []
  }
}