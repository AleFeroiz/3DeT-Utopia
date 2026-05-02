// ============================================================
//  modelos/Caracteristica.js — Técnica dentro de uma Fonte
// ============================================================

export class Caracteristica {
  /**
   * @param {object} opts
   * @param {string}  opts.nome
   * @param {string}  opts.tipo        — "ativa" | "passiva" (padrão: "ativa" — retrocompat.)
   * @param {number}  opts.escala      — 1..6 (define orçamento máximo)
   * @param {object}  opts.escolhas    — { potencia:[], pressao:[], alcance:[], ... }
   * @param {number}  opts.custo       — orçamento gasto (calculado no momento da criação)
   * @param {number}  opts.custoPM     — PM total (calculado); passivas sempre salvam 0
   */
  constructor({
    nome      = "Nova Característica",
    descricao = "",
    origem    = "",
    // ── RETROCOMPATIBILIDADE ──────────────────────────────
    // Fichas antigas não têm o campo "tipo". Ausência = "ativa".
    // NUNCA remover esse fallback — quebraria todas as fichas existentes.
    tipo      = "ativa",
    // ─────────────────────────────────────────────────────
    escala    = 1,
    custoPT   = 0,
    gratuita  = false,
    escolhas  = {},
    custo     = 0,
    custoPM   = 2,
    amplificada = null,
    reduzida    = null
  } = {}) {
    this.nome        = nome
    this.descricao   = descricao
    this.origem      = origem
    // Garante que valores inválidos vindos de dados antigos virem "ativa"
    this.tipo        = tipo === "passiva" ? "passiva" : "ativa"
    this.escala      = escala
    this.custoPT     = custoPT
    this.gratuita    = gratuita
    this.escolhas    = escolhas
    this.custo       = custo
    // Passivas nunca têm custo de PM; ativas respeitam mínimo de 2
    this.custoPM     = this.tipo === "passiva" ? 0 : Math.max(2, custoPM)
    this.amplificada = amplificada  // { custoPM, detalhes } | null  (não se aplica a passivas)
    this.reduzida    = reduzida     // { custoPM, detalhes } | null  (não se aplica a passivas)
  }

  toJSON() {
    return {
      nome:        this.nome,
      descricao:   this.descricao,
      origem:      this.origem,
      tipo:        this.tipo,
      escala:      this.escala,
      custoPT:     this.custoPT,
      gratuita:    this.gratuita,
      escolhas:    this.escolhas,
      custo:       this.custo,
      custoPM:     this.custoPM,
      amplificada: this.amplificada,
      reduzida:    this.reduzida,
    }
  }

  static fromJSON(obj) {
    return new Caracteristica(obj)
  }
}