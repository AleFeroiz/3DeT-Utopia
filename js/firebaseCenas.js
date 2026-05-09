// ============================================================
//  firebaseCenas.js — Funções Firestore para Cenas  v3
//
//  NÃO mantém estado próprio de Firebase.
//  Usa getDb() / getUser() / getFirebaseFns() de firebase.js,
//  que são os mesmos objetos já inicializados — elimina
//  completamente o risco de estado desincronizado entre módulos.
// ============================================================

import { getDb, getUser, getFirebaseFns } from "./firebase.js"

// Retorna true apenas quando firebase.js está totalmente inicializado
// e há um usuário autenticado — sem bootstrap extra necessário.
const _ok = () => !!(getDb() && getUser() && getFirebaseFns())

const _docCenas = () => {
  const fns  = getFirebaseFns()
  const db   = getDb()
  const user = getUser()
  return fns.doc(db, "users", user.uid, "dados", "cenas_mestre")
}

// ── CRUD de Cenas ─────────────────────────────────────────

/** Carrega todas as cenas do usuário logado. Retorna [] se não existir, null em caso de erro. */
export async function carregarCenasFirestore() {
  if (!_ok()) {
    console.warn("[Firestore/Cenas] carregarCenasFirestore: não pronto", { db: !!getDb(), user: !!getUser(), fns: !!getFirebaseFns() })
    return null
  }
  try {
    const snap = await getFirebaseFns().getDoc(_docCenas())
    return snap.exists() ? (snap.data().cenas ?? []) : []
  } catch(e) { console.error("[Firestore/Cenas] carregar:", e); return null }
}

/** Salva o array completo de cenas. Retorna true/false. */
export async function salvarCenasFirestore(cenas) {
  if (!_ok()) {
    console.warn("[Firestore/Cenas] salvarCenasFirestore: não pronto", { db: !!getDb(), user: !!getUser(), fns: !!getFirebaseFns() })
    return false
  }
  try {
    await getFirebaseFns().setDoc(_docCenas(), {
      cenas,
      updatedAt: new Date().toISOString()
    })
    return true
  } catch(e) { console.error("[Firestore/Cenas] salvar:", e); return false }
}

/** Salva/atualiza uma cena específica dentro do array. */
export async function salvarCenaFirestore(cena, todasCenas) {
  if (!_ok()) return false
  const idx  = todasCenas.findIndex(c => c.id === cena.id)
  const novas = [...todasCenas]
  if (idx !== -1) novas[idx] = cena
  else novas.push(cena)
  return salvarCenasFirestore(novas)
}

/** Remove uma cena do array e persiste. */
export async function removerCenaFirestore(id, todasCenas) {
  if (!_ok()) return false
  const novas = todasCenas.filter(c => c.id !== id)
  return salvarCenasFirestore(novas)
}