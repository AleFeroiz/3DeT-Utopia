// ============================================================
//  storage.js — Camada de persistência (localStorage)
//  v2: fichas identificadas por UUID, abertura via URL ?id=
//  Mantém compatibilidade com o sistema antigo (por índice)
//  para permitir migração gradual.
// ============================================================

const CHAVES = {
  FICHAS:      (modo) => modo === "mestre" ? "rpg_fichas_mestre"  : "rpg_fichas",
  PASTAS:      (modo) => modo === "mestre" ? "rpg_pastas_mestre"  : "rpg_pastas",
  // (chaves legadas removidas)
}

export const Storage = {

  // ── Lista de fichas ────────────────────────────────────────

  carregarFichas(modo = "player") {
    try { return JSON.parse(localStorage.getItem(CHAVES.FICHAS(modo))) ?? [] }
    catch { return [] }
  },

  salvarFichas(fichas, modo = "player") {
    localStorage.setItem(CHAVES.FICHAS(modo), JSON.stringify(fichas))
  },

  // ── Acesso por ID (novo sistema) ───────────────────────────

  /** Carrega uma ficha pelo seu id UUID, buscando em player e mestre */
  carregarFichaPorId(id) {
    for (const modo of ["player", "mestre"]) {
      const fichas = this.carregarFichas(modo)
      const ficha  = fichas.find(f => f.id === id)
      if (ficha) return { ficha, modo, fichas }
    }
    return null
  },

  /** Salva a ficha de volta ao array do modo correto, identificando pelo id */
  salvarFichaPorId(fichaObj, modo) {
    const fichas = this.carregarFichas(modo)
    const idx    = fichas.findIndex(f => f.id === fichaObj.id)
    if (idx !== -1) {
      fichas[idx] = fichaObj
    } else {
      fichas.push(fichaObj)
    }
    this.salvarFichas(fichas, modo)
  },

  // ── Acesso por índice (legado — para migração) ─────────────






  // ── Migração: garante que todas as fichas têm id UUID ─────

  migrarFichas(modo = "player") {
    const fichas  = this.carregarFichas(modo)
    let changed   = false
    for (const f of fichas) {
      if (!f.id) { f.id = crypto.randomUUID(); changed = true }
    }
    if (changed) this.salvarFichas(fichas, modo)
    return { fichas, changed }
  },

  migrarTudo() {
    const r1 = this.migrarFichas("player")
    const r2 = this.migrarFichas("mestre")
    return { player: r1, mestre: r2 }
  },

  // ── Pastas ─────────────────────────────────────────────────

  carregarPastas(modo = "player") {
    try { return JSON.parse(localStorage.getItem(CHAVES.PASTAS(modo))) ?? [] }
    catch { return [] }
  },

  salvarPastas(pastas, modo = "player") {
    localStorage.setItem(CHAVES.PASTAS(modo), JSON.stringify(pastas))
  },

  // Bug #28: persiste quais pastas estão abertas/fechadas
  carregarPastasAbertas(modo = "player") {
    try {
      const raw = localStorage.getItem(`rpg_pastas_abertas_${modo}`)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  },

  salvarPastasAbertas(ids, modo = "player") {
    localStorage.setItem(`rpg_pastas_abertas_${modo}`, JSON.stringify(ids))
  },
}
