// ============================================================
//  modelos/Ficha.js — Ficha completa do personagem
// ============================================================

import { ElementoFicha } from "./Elemento.js"
import { FonteDePoder  } from "./Fonte.js"

const TIPOS_SIMPLES = ["vantagem", "desvantagem", "tecnica"]

export class Ficha {
  constructor({
    nome       = "Nova Ficha",
    raca       = "",
    profissao  = "",
    atributos  = { poder: 0, habilidade: 0, resistencia: 0 },
    pericias   = {},
    elementos  = [],
    status     = {
      pa: { atual: 0, max: 0 },
      pm: { atual: 0, max: 0 },
      pv: { atual: 0, max: 0 }
    },
    pontos     = { total: 10, gastos: 0 }
  } = {}) {
    this.nome      = nome
    this.raca      = raca
    this.profissao = profissao

    this.atributos = { ...atributos }
    this.pericias  = { ...pericias }

    // Reidrata elementos corretamente (pode vir como plain objects do JSON)
    this.elementos = elementos.map(e =>
      e.tipo === "fonte"
        ? FonteDePoder.fromJSON(e)
        : ElementoFicha.fromJSON(e)
    )

    this.status = {
      pa: { ...status.pa },
      pm: { ...status.pm },
      pv: { ...status.pv }
    }

    this.pontos = { ...pontos }
  }

  // ---- cálculo de pontos gastos ----

  calcularPontos() {
    let gastos = 0

    gastos += (this.atributos.poder       || 0)
    gastos += (this.atributos.habilidade  || 0)
    gastos += (this.atributos.resistencia || 0)

    for (const e of this.elementos) {
      gastos += (e.custo ?? 0)
    }

    for (const v of Object.values(this.pericias)) {
      if (v) gastos += 1
    }

    this.pontos.gastos = gastos
    return gastos
  }

  get pontosRestantes() {
    return this.pontos.total - this.pontos.gastos
  }

  // ---- cálculo de status (regras do livro) ----

  calcularStatus() {
    const { poder, habilidade, resistencia } = this.atributos

    const paMax = poder       > 0 ? poder              : 1
    const pmMax = habilidade  > 0 ? habilidade  * 10   : 5
    const pvMax = resistencia > 0 ? resistencia * 10   : 5

    // Só atualiza o max; atual só muda se ainda não foi tocado
    this.status.pa.max = paMax
    this.status.pm.max = pmMax
    this.status.pv.max = pvMax

    if (!this.status.pa.atual) this.status.pa.atual = paMax
    if (!this.status.pm.atual) this.status.pm.atual = pmMax
    if (!this.status.pv.atual) this.status.pv.atual = pvMax
  }

  // ---- helpers de elementos ----

  adicionarElemento(elemento) {
    this.elementos.push(elemento)
    this.calcularPontos()
  }

  removerElemento(id) {
    this.elementos = this.elementos.filter(e => e.id !== id)
    this.calcularPontos()
  }

  encontrarElemento(id) {
    return this.elementos.find(e => e.id === id) ?? null
  }

  togglePericia(nome) {
    this.pericias[nome] = !this.pericias[nome]
    this.calcularPontos()
  }

  // ---- serialização ----

  toJSON() {
    return {
      nome:      this.nome,
      raca:      this.raca,
      profissao: this.profissao,
      atributos: this.atributos,
      pericias:  this.pericias,
      elementos: this.elementos,
      status:    this.status,
      pontos:    this.pontos
    }
  }

  static fromJSON(obj) {
    return new Ficha(obj)
  }

  // Cria uma ficha zerada (para o botão "+ Nova Ficha")
  static nova() {
    return new Ficha({ nome: "Nova Ficha" })
  }
}
