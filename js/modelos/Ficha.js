// ============================================================
//  modelos/Ficha.js — Ficha completa do personagem
// ============================================================

import { ElementoFicha } from "./Elemento.js"
import { FonteDePoder  } from "./Fonte.js"
import { getDadosNivel } from "../dados/niveis.js"

export class Ficha {
  constructor({
    id          = null,
    nome        = "Nova Ficha",
    racaId      = "",
    racaDados   = null,
    profissaoId = "",
    nivel       = 1,
    maestrias   = {},
    atributos   = { poder: 0, habilidade: 0, resistencia: 0 },
    pericias    = {},
    elementos   = [],
    status      = { pa: { atual: 0, max: 0 }, pm: { atual: 0, max: 0 }, pv: { atual: 0, max: 0 } },
    pontos      = { total: 10, gastos: 0, totalAuto: 10, offsetTotal: 0 },
    caracteristicasIsoladas = [],
    isPublic    = false,
    editPublic  = false,
    maestrasCfg = null,
    anotacoes = {
      objetivo:    "",
      historia:    "",
      personalidade: "",
      notas:       ""
    },
    inventario = { itens: [], offsetPeso: 0 },
    combateExtras = {}
  } = {}) {
    this.id          = id ?? crypto.randomUUID()
    this.nome        = nome
    this.racaId      = racaId
    this.racaDados   = racaDados ?? null
    this.profissaoId = profissaoId
    this.nivel       = Math.max(1, Math.min(20, nivel))
    this.maestrias   = { ...maestrias }
    this.atributos              = { ...atributos }
    this.caracteristicasIsoladas = [...(caracteristicasIsoladas ?? [])]
    this.isPublic    = isPublic   ?? false
    this.editPublic  = editPublic ?? false
    this.maestrasCfg = maestrasCfg ?? null
    this.anotacoes = {
      objetivo:      anotacoes?.objetivo      ?? "",
      historia:      anotacoes?.historia      ?? "",
      personalidade: anotacoes?.personalidade ?? "",
      notas:         anotacoes?.notas         ?? ""
    }
    this.inventario = {
      itens:      [...(inventario?.itens      ?? [])],
      offsetPeso: inventario?.offsetPeso ?? 0
    }
    this.combateExtras = {
      atkSeguro:    combateExtras?.atkSeguro    ?? 0,
      atkArriscado: combateExtras?.atkArriscado ?? 0,
      atkMaluco:    combateExtras?.atkMaluco    ?? 0,
      defBloqueio:  combateExtras?.defBloqueio  ?? 0,
      defEsquiva:   combateExtras?.defEsquiva   ?? 0,
      defContra:    combateExtras?.defContra     ?? 0,
    }
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
    const offsetLimite = this.maestrasCfg?.offsetLimite ?? 0
    this.maestraLimite = d.maestriaLimite + offsetLimite
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
    if (!this.pericias[pericia]) return { ok: false, motivo: "Você precisa ter esta perícia primeiro." }
    return { ok: true }
  }

  toggleMaestria(pericia) {
    if (this.maestrias[pericia]) {
      // Remove maestria — devolve 2 PT
      delete this.maestrias[pericia]
      this.calcularPontos()
      return { ok: true, removeu: true }
    }
    const check = this.podeMaestria(pericia)
    if (!check.ok) return check
    this.maestrias[pericia] = true
    this.calcularPontos()
    return { ok: true, removeu: false }
  }

  // Editar limite de maestrias manualmente (offset)
  setMaestraLimiteManual(novoValor) {
    const autoLimite = this.dadosNivel.maestriaLimite
    if (!this.maestrasCfg) this.maestrasCfg = {}
    this.maestrasCfg.offsetLimite = novoValor - autoLimite
    this.maestraLimite = novoValor
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
    this.pontos.gastosAuto   = gastos
    // gastos final = automático + offset manual
    this.pontos.gastos       = gastos + (this.pontos.offsetGastos ?? 0)
    return this.pontos.gastos
  }

  // Jogador edita manualmente os pontos gastos (offset aditivo)
  setGastosManual(novoValor) {
    const auto = this.pontos.gastosAuto ?? 0
    this.pontos.offsetGastos = novoValor - auto
    this.pontos.gastos       = novoValor
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

  // ── Inventário ────────────────────────────────────────────
  get pesoMaxInventario() {
    return (this.atributos.resistencia ?? 0) * 5 + (this.inventario.offsetPeso ?? 0)
  }

  get pesoAtualInventario() {
    const total = (this.inventario.itens ?? []).reduce((s, item) => s + (Number(item.peso) || 0), 0)
    return Math.max(0, total)
  }

  // Soma bônus de ataque de todos os equipamentos marcados
  get bonusAtaqueEquipamentos() {
    return (this.inventario.itens ?? [])
      .filter(i => i.categoria === 'equipamento' && i.usadoAtaque)
      .reduce((s, i) => s + (Number(i.bonusAtaque) || 0), 0)
  }

  // Soma bônus de defesa de todos os equipamentos marcados
  get bonusDefesaEquipamentos() {
    return (this.inventario.itens ?? [])
      .filter(i => i.categoria === 'equipamento' && i.usadoDefesa)
      .reduce((s, i) => s + (Number(i.bonusDefesa) || 0), 0)
  }

  adicionarItem(item) {
    this.inventario.itens.push({ ...item, id: crypto.randomUUID() })
  }

  removerItem(id) {
    this.inventario.itens = this.inventario.itens.filter(i => i.id !== id)
  }

  editarItem(id, dados) {
    const idx = this.inventario.itens.findIndex(i => i.id === id)
    if (idx !== -1) this.inventario.itens[idx] = { ...this.inventario.itens[idx], ...dados }
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
      id:          this.id,
      nome:        this.nome,
      isPublic:    this.isPublic,
      editPublic:  this.editPublic,
      maestrasCfg: this.maestrasCfg,
      racaId:      this.racaId,
      racaDados:   this.racaDados,
      profissaoId: this.profissaoId,
      nivel:       this.nivel,
      maestrias:   this.maestrias,
      atributos:   this.atributos,
      pericias:    this.pericias,
      // Serializa cada elemento usando seu próprio toJSON() para garantir
      // que FonteDePoder (com caracteristicas, passivos, pcs) seja salvo completo
      elementos:   this.elementos.map(e => e.toJSON ? e.toJSON() : { ...e }),
      status:      this.status,
      pontos:      this.pontos,
      caracteristicasIsoladas: this.caracteristicasIsoladas ?? [],
      anotacoes:   this.anotacoes,
      inventario:  this.inventario,
      combateExtras: this.combateExtras,
    }
  }

  static fromJSON(obj) { return new Ficha(obj) }
  static nova()        { return new Ficha({ nome: "Nova Ficha" }) }
}