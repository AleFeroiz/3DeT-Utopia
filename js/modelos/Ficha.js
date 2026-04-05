// ============================================================
//  modelos/Ficha.js — Ficha completa do personagem
// ============================================================

import { ElementoFicha } from "./Elemento.js"
import { FonteDePoder  } from "./Fonte.js"
import { getDadosNivel } from "../dados/niveis.js"

export class Ficha {
  constructor({
    nome        = "Nova Ficha",
    racaId      = "",
    profissaoId = "",
    nivel       = 1,
    maestrias   = {},
    atributos   = { poder: 0, habilidade: 0, resistencia: 0 },
    pericias    = {},
    elementos   = [],
    status      = { pa: { atual: 0, max: 0 }, pm: { atual: 0, max: 0 }, pv: { atual: 0, max: 0 } },
    pontos      = { total: 10, gastos: 0, totalAuto: 10, offsetTotal: 0 }
  } = {}) {
    this.nome        = nome
    this.racaId      = racaId
    this.profissaoId = profissaoId
    this.nivel       = Math.max(1, Math.min(20, nivel))
    this.maestrias   = { ...maestrias }
    this.atributos   = { ...atributos }
    this.pericias    = { ...pericias }
    this.elementos   = elementos.map(e =>
      e.tipo === "fonte" ? FonteDePoder.fromJSON(e) : ElementoFicha.fromJSON(e)
    )
    this.status = {
      pa: { ...status.pa }, pm: { ...status.pm }, pv: { ...status.pv }
    }
    this.pontos = { ...pontos }
    this._sincronizarNivel()
  }

  // ── Nível ─────────────────────────────────────────────────
  _sincronizarNivel() {
    const d = getDadosNivel(this.nivel)
    // total = automático (ptTotal) + offset definido pelo jogador
    const offsetTotal = this.pontos.offsetTotal ?? 0
    this.pontos.totalAuto = d.ptTotal
    this.pontos.total     = d.ptTotal + offsetTotal
    this.escalaMax           = d.escalaMax
    this.maestraLimite       = d.maestriaLimite
    this.profissaoNivelAtual = d.profissaoNivelAtual
  }

  // Chamado quando o jogador edita o total manualmente
  setTotalManual(novoValor) {
    const auto   = this.pontos.totalAuto ?? getDadosNivel(this.nivel).ptTotal
    this.pontos.offsetTotal = novoValor - auto
    this.pontos.total       = novoValor
  }

  setNivel(n) {
    this.nivel = Math.max(1, Math.min(20, n))
    this._sincronizarNivel()
    this.calcularPontos()
  }

  get dadosNivel() { return getDadosNivel(this.nivel) }

  // ── Maestrias ─────────────────────────────────────────────
  get totalMaestrias() {
    return Object.values(this.maestrias).filter(Boolean).length
  }

  podeMaestria(pericia) {
    if (!this.pericias[pericia])         return { ok: false, motivo: "Você precisa ter esta perícia primeiro." }
    if (this.maestrias[pericia])         return { ok: false, motivo: "Já possui maestria nesta perícia." }
    if (this.maestraLimite === 0)        return { ok: false, motivo: "Maestria disponível apenas a partir do nível 3." }
    if (this.totalMaestrias >= this.maestraLimite)
      return { ok: false, motivo: `Limite de maestrias atingido (${this.maestraLimite}).` }
    if (this.pontosRestantes < 2)        return { ok: false, motivo: "Pontos insuficientes (custo: 2 PT)." }
    return { ok: true }
  }

  toggleMaestria(pericia) {
    // Maestria não pode ser removida após aplicada
    if (this.maestrias[pericia]) {
      return { ok: false, motivo: "Maestria não pode ser removida após aplicada." }
    }
    const check = this.podeMaestria(pericia)
    if (!check.ok) return check
    this.maestrias[pericia] = true
    this.calcularPontos()
    return { ok: true }
  }

  // ── Pontos ────────────────────────────────────────────────
  calcularPontos() {
    let gastos = 0
    gastos += (this.atributos.poder       || 0)
    gastos += (this.atributos.habilidade  || 0)
    gastos += (this.atributos.resistencia || 0)
    for (const e of this.elementos) gastos += (e.custo ?? 0)
    for (const v of Object.values(this.pericias)) if (v) gastos += 1
    gastos += this.totalMaestrias * 2
    this.pontos.gastos = gastos
    return gastos
  }

  get pontosRestantes() { return this.pontos.total - this.pontos.gastos }

  // ── Status ────────────────────────────────────────────────
  // Calcula o valor automático bruto de cada status
  _calcAutoStatus() {
    const { poder, habilidade, resistencia } = this.atributos
    return {
      pa: poder       > 0 ? poder           : 1,
      pm: habilidade  > 0 ? habilidade * 10 : 5,
      pv: resistencia > 0 ? resistencia* 10 : 5
    }
  }

  calcularStatus() {
    const auto = this._calcAutoStatus()

    // valorFinal = automático + offset (offset começa em 0)
    for (const chave of ['pa', 'pm', 'pv']) {
      const offset = this.status[chave].offset ?? 0
      this.status[chave].auto   = auto[chave]
      this.status[chave].max    = auto[chave] + offset

      if (!this.status[chave].atual) this.status[chave].atual = this.status[chave].max
    }
  }

  // Chamado quando o jogador edita manualmente o max
  setMaxManual(chave, novoValor) {
    const auto   = this._calcAutoStatus()[chave]
    const offset = novoValor - auto
    this.status[chave].offset = offset
    this.status[chave].auto   = auto
    this.status[chave].max    = novoValor
  }

  // ── Elementos ─────────────────────────────────────────────
  adicionarElemento(e)    { this.elementos.push(e); this.calcularPontos() }
  removerElemento(id)     { this.elementos = this.elementos.filter(e => e.id !== id); this.calcularPontos() }
  encontrarElemento(id)   { return this.elementos.find(e => e.id === id) ?? null }

  togglePericia(nome) {
    const novo = !this.pericias[nome]
    this.pericias[nome] = novo
    if (!novo) delete this.maestrias[nome]
    this.calcularPontos()
  }

  // ── Serialização ──────────────────────────────────────────
  toJSON() {
    return {
      nome: this.nome, racaId: this.racaId, profissaoId: this.profissaoId,
      nivel: this.nivel, maestrias: this.maestrias,
      atributos: this.atributos, pericias: this.pericias,
      elementos: this.elementos, status: this.status, pontos: this.pontos
    }
  }

  static fromJSON(obj) { return new Ficha(obj) }
  static nova()        { return new Ficha({ nome: "Nova Ficha" }) }
}
