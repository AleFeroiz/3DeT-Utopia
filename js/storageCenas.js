// ============================================================
//  storageCenas.js — Persistência de Cenas (localStorage + Firebase)
//  Mesmo padrão de storage.js: não-logado = localStorage; logado = Firebase only
// ============================================================

const CHAVE_CENAS = "rpg_cenas_mestre"

// ── localStorage ──────────────────────────────────────────

export const StorageCenas = {
  carregar() {
    try { return JSON.parse(localStorage.getItem(CHAVE_CENAS)) ?? [] }
    catch { return [] }
  },

  salvar(cenas) {
    localStorage.setItem(CHAVE_CENAS, JSON.stringify(cenas))
  },

  salvarCena(cena) {
    const cenas = this.carregar()
    const idx   = cenas.findIndex(c => c.id === cena.id)
    if (idx !== -1) cenas[idx] = cena
    else cenas.push(cena)
    this.salvar(cenas)
  },

  removerCena(id) {
    const cenas = this.carregar().filter(c => c.id !== id)
    this.salvar(cenas)
  },
}

// ── Modelo de Cena ────────────────────────────────────────
export function novaCena(nome = "Nova Cena") {
  return {
    id:        crypto.randomUUID(),
    nome,
    fichaIds:  [],           // IDs das fichas do mestre nesta cena
    criadaEm:  new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
