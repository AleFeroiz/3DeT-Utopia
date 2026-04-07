// ============================================================
//  modelos/Fonte.js — Fonte de Poder (Akuma no Mi, Haki…)
// ============================================================

import { ElementoFicha  } from "./Elemento.js"
import { Caracteristica } from "./Caracteristica.js"

// PC gasto por escala: escala 1 = 1 PC, escala 2 = 2 PCs, etc.
export const PC_POR_ESCALA = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6 }

export class FonteDePoder extends ElementoFicha {
  /**
   * @param {object} opts
   * @param {string}  opts.id
   * @param {string}  opts.nome
   * @param {string}  opts.tema
   * @param {number}  opts.custo         — PT investidos
   * @param {string}  opts.subtipo       — "geral" | "paramecia" | "zoan" | "logia"
   * @param {Array}   opts.caracteristicas
   * @param {object}  opts.passivos      — benefícios automáticos (zoan/logia)
   */
  constructor({
    id,
    nome            = "Nova Fonte",
    tema            = "",
    custo           = 0,
    subtipo         = "geral",
    caracteristicas = [],
    passivos        = {}
  } = {}) {
    super({ id, nome, tipo: "fonte", custo })

    this.tema    = tema
    this.subtipo = subtipo

    // PCs = PT * 2
    this.pcs = Number(custo) * 2

    this.caracteristicas = caracteristicas.map(c =>
      c instanceof Caracteristica ? c : Caracteristica.fromJSON(c)
    )

    // passivos: { elemento, resistencias, imunidades, caracGratuita }
    this.passivos = passivos
  }

  // ── PC ──────────────────────────────────────────────────

  atualizarCusto(novoCusto) {
    this.custo = Number(novoCusto)
    this.pcs   = this.custo * 2
  }

  get pcsGastos() {
    return this.caracteristicas.reduce((acc, c) => {
      if (c.gratuita) return acc
      return acc + (PC_POR_ESCALA[c.escala] ?? c.escala)
    }, 0)
  }

  get pcsDisponiveis() {
    return this.pcs - this.pcsGastos
  }

  podeAdicionarEscala(escala) {
    return this.pcsDisponiveis >= (PC_POR_ESCALA[escala] ?? escala)
  }

  // ── Características ─────────────────────────────────────

  adicionarCaracteristica(c) {
    this.caracteristicas.push(c)
  }

  removerCaracteristica(index) {
    this.caracteristicas.splice(index, 1)
  }

  editarCaracteristica(index, dados) {
    Object.assign(this.caracteristicas[index], dados)
  }

  static fromJSON(obj) {
    return new FonteDePoder(obj)
  }
}
