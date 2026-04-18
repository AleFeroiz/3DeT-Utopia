// ============================================================
//  modelos/Caracteristica.js — Técnica dentro de uma Fonte
// ============================================================

export class Caracteristica {
  /**
   * @param {object} opts
   * @param {string}  opts.nome
   * @param {number}  opts.escala      — 1..6 (define orçamento máximo)
   * @param {object}  opts.escolhas    — { potencia:[], pressao:[], alcance:[], ... }
   * @param {number}  opts.custo       — orçamento gasto (calculado no momento da criação)
   * @param {number}  opts.custoPM     — PM total (calculado)
   */
  constructor({
    nome      = "Nova Característica",
    descricao = "",
    origem    = "",
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
    this.escala      = escala
    this.custoPT     = custoPT
    this.gratuita    = gratuita
    this.escolhas    = escolhas
    this.custo       = custo
    this.custoPM     = Math.max(2, custoPM)
    this.amplificada = amplificada  // { custoPM, detalhes } | null
    this.reduzida    = reduzida     // { custoPM, detalhes } | null
  }

  toJSON() {
    return {
      nome:        this.nome,
      descricao:   this.descricao,
      origem:      this.origem,
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