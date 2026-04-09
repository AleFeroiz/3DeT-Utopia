// ============================================================
//  storage.js — Camada de persistência (localStorage)
// ============================================================

const CHAVES = {
  FICHAS:      "rpg_fichas",
  FICHA_ATUAL: "rpg_fichaAtual",
  PASTAS:      "rpg_pastas"
}

export const Storage = {

  // ---------- lista de fichas (index.html) ----------

  carregarFichas() {
    try {
      return JSON.parse(localStorage.getItem(CHAVES.FICHAS)) ?? []
    } catch {
      return []
    }
  },

  salvarFichas(fichas) {
    localStorage.setItem(CHAVES.FICHAS, JSON.stringify(fichas))
  },

  // ---------- ficha em edição (ficha.html) ----------

  getIndiceFichaAtual() {
    const v = localStorage.getItem(CHAVES.FICHA_ATUAL)
    return v !== null ? parseInt(v, 10) : null
  },

  setIndiceFichaAtual(index) {
    localStorage.setItem(CHAVES.FICHA_ATUAL, String(index))
  },

  carregarFichaAtual() {
    const fichas = this.carregarFichas()
    const idx    = this.getIndiceFichaAtual()
    if (idx === null || !fichas[idx]) return null
    return { ficha: fichas[idx], index: idx }
  },

  salvarFichaAtual(fichaObj) {
    const fichas = this.carregarFichas()
    const idx    = this.getIndiceFichaAtual()
    if (idx === null) return
    fichas[idx] = fichaObj
    this.salvarFichas(fichas)
  },

  // ---------- pastas (index.html) ----------

  carregarPastas() {
    try {
      return JSON.parse(localStorage.getItem(CHAVES.PASTAS)) ?? []
    } catch {
      return []
    }
  },

  salvarPastas(pastas) {
    localStorage.setItem(CHAVES.PASTAS, JSON.stringify(pastas))
  }
}
