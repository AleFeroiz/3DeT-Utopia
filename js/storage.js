// ============================================================
//  storage.js — Camada de persistência (localStorage)
// ============================================================

const CHAVES = {
  FICHAS:      "rpg_fichas",
  FICHA_ATUAL: "rpg_fichaAtual"
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

  // Retorna o objeto bruto da ficha atual (ou null)
  carregarFichaAtual() {
    const fichas = this.carregarFichas()
    const idx    = this.getIndiceFichaAtual()
    if (idx === null || !fichas[idx]) return null
    return { ficha: fichas[idx], index: idx }
  },

  // Grava o estado da ficha atual de volta no array
  salvarFichaAtual(fichaObj) {
    const fichas = this.carregarFichas()
    const idx    = this.getIndiceFichaAtual()
    if (idx === null) return
    fichas[idx] = fichaObj
    this.salvarFichas(fichas)
  }
}
