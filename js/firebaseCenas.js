// ============================================================
//  firebaseCenas.js — Funções Firestore para Cenas
//  Segue exatamente o mesmo padrão de firebase.js (fichas)
//  Estrutura: users/{uid}/dados/cenas_mestre → { cenas: [...] }
//
//  NÃO inicializa Firebase sozinho — depende de firebase.js ter
//  sido inicializado antes (compartilha _db e _user via getters).
// ============================================================

// Importa helpers de autenticação/instância do firebase.js principal
// Os getters _getDb e _getUser são expostos como funções de conveniência
// para não duplicar a lógica de inicialização do Firebase SDK.

let _db = null, _user = null, _fns = null

/**
 * Deve ser chamado logo após inicializarFirebase() do firebase.js.
 * Recebe as mesmas instâncias já criadas para não duplicar o SDK.
 */
export function inicializarFirebaseCenas(db, user, fns) {
  _db   = db
  _user = user
  _fns  = fns
}

/** Atualiza o user quando o auth muda (onLogin / onLogout) */
export function setUserCenas(user) { _user = user }

const _ok = () => _db && _user && _fns

const _docCenas = () =>
  _fns.doc(_db, "users", _user.uid, "dados", "cenas_mestre")

// ── CRUD de Cenas ─────────────────────────────────────────

/** Carrega todas as cenas do usuário logado. Retorna [] se não existir. */
export async function carregarCenasFirestore() {
  if (!_ok()) return null
  try {
    const snap = await _fns.getDoc(_docCenas())
    return snap.exists() ? (snap.data().cenas ?? []) : []
  } catch(e) { console.error("[Firestore/Cenas] carregar:", e); return null }
}

/** Salva o array completo de cenas. */
export async function salvarCenasFirestore(cenas) {
  if (!_ok()) return false
  try {
    await _fns.setDoc(_docCenas(), {
      cenas,
      updatedAt: new Date().toISOString()
    })
    return true
  } catch(e) { console.error("[Firestore/Cenas] salvar:", e); return false }
}

/** Salva/atualiza uma cena específica dentro do array. */
export async function salvarCenaFirestore(cena, todasCenas) {
  if (!_ok()) return false
  const idx = todasCenas.findIndex(c => c.id === cena.id)
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
