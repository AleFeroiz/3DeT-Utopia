// ============================================================
//  storage.js — Camada de persistência (localStorage)
//  Suporta modo "player" e "mestre" para fichas/pastas
// ============================================================

const CHAVES = {
  FICHAS:       (modo) => modo === "mestre" ? "rpg_fichas_mestre" : "rpg_fichas",
  PASTAS:       (modo) => modo === "mestre" ? "rpg_pastas_mestre" : "rpg_pastas",
  FICHA_ATUAL:  "rpg_fichaAtual",
  MODO_FICHA:   "rpg_fichaAtualModo",  // qual modo originou a ficha aberta
}

export const Storage = {

  // ---------- lista de fichas (index.html) ----------

  carregarFichas(modo = "player") {
    try {
      return JSON.parse(localStorage.getItem(CHAVES.FICHAS(modo))) ?? []
    } catch {
      return []
    }
  },

  salvarFichas(fichas, modo = "player") {
    localStorage.setItem(CHAVES.FICHAS(modo), JSON.stringify(fichas))
  },

  // ---------- ficha em edição (ficha.html) ----------

  getIndiceFichaAtual() {
    const v = localStorage.getItem(CHAVES.FICHA_ATUAL)
    return v !== null ? parseInt(v, 10) : null
  },

  setIndiceFichaAtual(index, modo = "player") {
    localStorage.setItem(CHAVES.FICHA_ATUAL, String(index))
    localStorage.setItem(CHAVES.MODO_FICHA,  modo)
  },

  getModoFichaAtual() {
    return localStorage.getItem(CHAVES.MODO_FICHA) ?? "player"
  },

  carregarFichaAtual() {
    const modo   = this.getModoFichaAtual()
    const fichas = this.carregarFichas(modo)
    const idx    = this.getIndiceFichaAtual()
    if (idx === null || !fichas[idx]) return null
    return { ficha: fichas[idx], index: idx, modo }
  },

  salvarFichaAtual(fichaObj) {
    const modo   = this.getModoFichaAtual()
    const fichas = this.carregarFichas(modo)
    const idx    = this.getIndiceFichaAtual()
    if (idx === null) return
    fichas[idx] = fichaObj
    this.salvarFichas(fichas, modo)
  },

  // ---------- pastas (index.html) ----------

  carregarPastas(modo = "player") {
    try {
      return JSON.parse(localStorage.getItem(CHAVES.PASTAS(modo))) ?? []
    } catch {
      return []
    }
  },

  salvarPastas(pastas, modo = "player") {
    localStorage.setItem(CHAVES.PASTAS(modo), JSON.stringify(pastas))
  }
}
