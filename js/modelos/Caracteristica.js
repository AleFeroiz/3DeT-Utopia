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
    escolhas  = {},
    custo     = 0,
    custoPM   = 2
  } = {}) {
    this.nome      = nome
    this.descricao = descricao
    this.origem    = origem    // para características isoladas
    this.escala    = escala
    this.custoPT   = custoPT   // custo em PT (para isoladas)
    this.escolhas  = escolhas
    this.custo     = custo
    this.custoPM   = Math.max(2, custoPM)
  }

  static fromJSON(obj) {
    return new Caracteristica(obj)
  }
}
