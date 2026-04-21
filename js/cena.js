// ============================================================
//  cena.js — Ferramenta CENA do Mestre  v2
//  Doutrina: não-logado = localStorage; logado = Firebase only
// ============================================================

import { Storage }       from "./storage.js"
import { Ficha }         from "./modelos/Ficha.js"
import { StorageCenas, novaCena } from "./storageCenas.js"
import {
  inicializarFirebase, getUser, onLogin, onLogout,
  estaConfigurado, aguardarAuth,
  carregarIndiceFichasFirestore, carregarFichaFirestore,
  salvarFichaFirestore
} from "./firebase.js"
import {
  inicializarFirebaseCenas, setUserCenas,
  carregarCenasFirestore, salvarCenasFirestore,
} from "./firebaseCenas.js"
import { toastSucesso, toastErro, toastAviso, toastInfo } from "./ui/uiToast.js"

// ── Estado global ─────────────────────────────────────────
let _cenas        = []
let _cenaAtual    = null
let _fichasMestre = []
let _logado       = false

// ── Save indicator ────────────────────────────────────────
function _setSaveStatus(estado) {
  const el = document.getElementById("saveIndicator")
  if (!el) return
  el.className = "save-indicator"
  const icon = el.querySelector(".save-icon")
  const text = el.querySelector(".save-text")
  if (estado === "salvando") {
    el.classList.add("save-saving")
    icon.textContent = "⟳"; text.textContent = "Salvando..."
  } else if (estado === "erro") {
    el.classList.add("save-error")
    icon.textContent = "✗"; text.textContent = "Erro"
  } else {
    el.classList.add("save-idle")
    icon.textContent = "✓"; text.textContent = "Salvo"
  }
}

// ─────────────────────────────────────────────────────────
//  FICHAS DO MESTRE
//  BUG FIX: quando logado, carrega do Firebase (não localStorage)
// ─────────────────────────────────────────────────────────
async function _carregarFichasMestre() {
  if (_logado && estaConfigurado()) {
    const indice = await carregarIndiceFichasFirestore("mestre")
    if (indice && indice.length > 0) {
      const promises = indice.map(meta => carregarFichaFirestore(meta.id, "mestre"))
      const raws = await Promise.all(promises)
      _fichasMestre = raws.filter(Boolean).map(f => Ficha.fromJSON(f))
      return
    }
    _fichasMestre = []
    return
  }
  const raw = Storage.carregarFichas("mestre")
  _fichasMestre = raw.map(f => Ficha.fromJSON(f))
}

function _getFichaById(id) {
  return _fichasMestre.find(f => f.id === id) ?? null
}

async function _salvarFicha(ficha) {
  const idx = _fichasMestre.findIndex(f => f.id === ficha.id)
  if (idx !== -1) _fichasMestre[idx] = ficha

  if (_logado && estaConfigurado()) {
    await salvarFichaFirestore(ficha.toJSON(), "mestre").catch(console.error)
  } else {
    const raw = Storage.carregarFichas("mestre")
    const ri  = raw.findIndex(f => f.id === ficha.id)
    if (ri !== -1) { raw[ri] = ficha.toJSON(); Storage.salvarFichas(raw, "mestre") }
  }
}

// ─────────────────────────────────────────────────────────
//  CENAS — persistência
// ─────────────────────────────────────────────────────────
async function _carregarCenas() {
  if (_logado && estaConfigurado()) {
    const fb = await carregarCenasFirestore()
    if (fb !== null) { _cenas = fb; return }
  }
  _cenas = StorageCenas.carregar()
}

// Após carregar cenas e fichas, remove fichaIds que não existem mais
async function _limparFichasOrfas() {
  const idsValidos = new Set(_fichasMestre.map(f => f.id))
  let houveLimpeza = false
  _cenas = _cenas.map(cena => {
    const antes = cena.fichaIds?.length ?? 0
    const fichaIds = (cena.fichaIds ?? []).filter(id => idsValidos.has(id))
    if (fichaIds.length !== antes) houveLimpeza = true
    return { ...cena, fichaIds }
  })
  if (houveLimpeza) {
    StorageCenas.salvar(_cenas)
    if (_logado && estaConfigurado()) await salvarCenasFirestore(_cenas)
  }
}

async function _salvarCenas() {
  _setSaveStatus("salvando")
  try {
    if (_logado && estaConfigurado()) {
      await salvarCenasFirestore(_cenas)
    } else {
      StorageCenas.salvar(_cenas)
    }
    _setSaveStatus("salvo")
  } catch(e) {
    console.error("[Cena] salvar:", e)
    _setSaveStatus("erro")
    toastErro("Erro ao salvar cena.")
  }
}

async function _salvarCenaAtual() {
  if (!_cenaAtual) return
  _cenaAtual.updatedAt = new Date().toISOString()
  const idx = _cenas.findIndex(c => c.id === _cenaAtual.id)
  if (idx !== -1) _cenas[idx] = _cenaAtual
  else _cenas.push(_cenaAtual)
  await _salvarCenas()
}

// ─────────────────────────────────────────────────────────
//  LISTA DE CENAS
// ─────────────────────────────────────────────────────────
function renderListaCenas() {
  const lista = document.getElementById("listaCenas")
  const vazio = document.getElementById("cenasVazio")
  if (!lista) return
  lista.innerHTML = ""

  if (!_cenas.length) {
    if (vazio) vazio.style.display = "flex"
    return
  }
  if (vazio) vazio.style.display = "none"

  for (const cena of _cenas) {
    const card = document.createElement("div")
    card.className = "cena-card-lista"
    card.innerHTML = `
      <div class="cena-card-info">
        <span class="cena-card-nome">${_esc(cena.nome)}</span>
        <span class="cena-card-meta">${cena.fichaIds?.length ?? 0} ficha(s)</span>
      </div>
      <div class="cena-card-acoes">
        <button class="cena-btn cena-btn-abrir">▶ Abrir</button>
        <button class="cena-btn cena-btn-renomear">✏️</button>
        <button class="cena-btn cena-btn-del">🗑️</button>
      </div>`
    card.querySelector(".cena-btn-abrir").onclick    = () => abrirCena(cena.id)
    card.querySelector(".cena-btn-renomear").onclick = () => renomearCena(cena.id)
    card.querySelector(".cena-btn-del").onclick      = () => deletarCena(cena.id)
    lista.appendChild(card)
  }
}

window.criarNovaCena = async function() {
  const nome = await _modalPrompt("Nome da nova cena:", "Nova Cena")
  if (!nome) return
  const cena = novaCena(nome)
  _cenas.push(cena)
  await _salvarCenas()
  renderListaCenas()
  toastSucesso(`Cena "${cena.nome}" criada!`)
}

async function deletarCena(id) {
  const cena = _cenas.find(c => c.id === id)
  if (!cena) return
  const ok = await _modalConfirm(`Excluir "${cena.nome}"? As fichas NÃO serão apagadas.`)
  if (!ok) return
  _cenas = _cenas.filter(c => c.id !== id)
  await _salvarCenas()
  renderListaCenas()
  toastSucesso("Cena excluída.")
}

async function renomearCena(id) {
  const cena = _cenas.find(c => c.id === id)
  if (!cena) return
  const novo = await _modalPrompt("Novo nome da cena:", cena.nome)
  if (!novo || novo === cena.nome) return
  cena.nome = novo
  await _salvarCenas()
  renderListaCenas()
}

// ─────────────────────────────────────────────────────────
//  ABRIR / FECHAR CENA
// ─────────────────────────────────────────────────────────
async function abrirCena(id) {
  const cena = _cenas.find(c => c.id === id)
  if (!cena) return
  _cenaAtual = cena
  document.getElementById("painelLista").style.display  = "none"
  document.getElementById("painelCena").style.display   = "flex"
  document.getElementById("cenaTopbarNome").textContent = cena.nome
  renderCena()
  renderSidebar()
}

window.fecharCena = function() {
  _cenaAtual = null
  document.getElementById("painelLista").style.display = "block"
  document.getElementById("painelCena").style.display  = "none"
  renderListaCenas()
}

// ─────────────────────────────────────────────────────────
//  RENDER — CENA ABERTA
// ─────────────────────────────────────────────────────────
function renderCena() {
  const area = document.getElementById("cenaFichasArea")
  if (!area || !_cenaAtual) return
  area.innerHTML = ""

  if (!_cenaAtual.fichaIds?.length) {
    area.innerHTML = `
      <div class="cena-empty-state">
        <div class="cena-empty-icon">⚔️</div>
        <div class="cena-empty-text">Arraste fichas do painel lateral para adicionar à cena</div>
      </div>`
  } else {
    for (const fid of _cenaAtual.fichaIds) {
      const ficha = _getFichaById(fid)
      if (!ficha) continue
      area.appendChild(_criarCardFicha(ficha))
    }
  }

  const dropZone = document.createElement("div")
  dropZone.className = "cena-drop-zone"
  dropZone.innerHTML = `<div class="cena-drop-zone-icon">⊕</div><span>Solte fichas aqui</span>`
  _setupDropZone(dropZone)
  area.appendChild(dropZone)
}

// ─────────────────────────────────────────────────────────
//  CARD DE FICHA
// ─────────────────────────────────────────────────────────
function _criarCardFicha(ficha) {
  ficha.calcularStatus()
  if (!ficha._atribCombate) ficha._atribCombate = "poder"

  const cor = ficha.corTema ?? "#3b82f6"

  const card = document.createElement("div")
  card.className = "cena-ficha-card"
  card.dataset.fichaId = ficha.id
  // Injeta a cor tema como variável CSS local do card
  card.style.setProperty("--cor-tema",      cor)
  card.style.setProperty("--cor-tema-dark",  _darkenHex(cor, 0.7))
  card.style.setProperty("--cor-tema-dim",   cor + "22")
  card.style.setProperty("--cor-tema-mid",   cor + "55")
  card.style.borderColor = cor + "55"

  const retratoHtml = ficha.imagemUrl
    ? `<div class="cfc-retrato" style="background-image:url('${ficha.imagemUrl}')"></div>`
    : `<div class="cfc-retrato cfc-retrato-vazio">👤</div>`

  card.innerHTML = `
    <div class="cfc-header">
      ${retratoHtml}
      <div style="flex:1;min-width:0">
        <div class="cfc-nome">${_esc(ficha.nome)}</div>
        <span class="cfc-nivel">Nv.${ficha.nivel} · ${_esc(ficha.racaId || "—")} · ${_esc(ficha.profissaoId || "—")}</span>
      </div>
      <button class="cfc-remover" title="Remover da cena">✕</button>
    </div>

    <div class="cfc-atribs" id="atribs-${ficha.id}">
      ${_htmlAtribCtrl(ficha, "poder",       "P")}
      ${_htmlAtribCtrl(ficha, "habilidade",  "H")}
      ${_htmlAtribCtrl(ficha, "resistencia", "R")}
    </div>

    <div class="cfc-stats" id="stats-${ficha.id}">
      ${_htmlStat(ficha, "pa")}
      ${_htmlStat(ficha, "pm")}
      ${_htmlStat(ficha, "pv")}
    </div>

    <div class="cfc-gaveta" data-gaveta="combate">
      <div class="cfc-gaveta-header">
        <span class="cfc-gaveta-titulo">⚔️ Combate</span>
        <span class="cfc-gaveta-seta">▼</span>
      </div>
      <div class="cfc-gaveta-corpo" id="combate-${ficha.id}">
        ${_htmlCombate(ficha)}
      </div>
    </div>

    <div class="cfc-gavetas">
      ${_htmlGaveta("pericias",    "📋 Perícias",           ficha)}
      ${_htmlGaveta("vantagens",   "✅ Vantagens",          ficha)}
      ${_htmlGaveta("desvantagens","❌ Desvantagens",       ficha)}
      ${_htmlGaveta("tecnicas",    "⚡ Técnicas",           ficha)}
      ${_htmlGaveta("fontes",      "🌊 Fontes de Poder",    ficha)}
      ${_htmlGaveta("isoladas",    "✨ Caract. Isoladas",   ficha)}
    </div>
  `

  card.querySelector(".cfc-remover").onclick = () => _removerFichaDaCena(ficha.id)
  _bindAtribBtns(card, ficha)
  _bindStatBtns(card, ficha)
  _bindGavetas(card, ficha)
  _bindCombateToggle(card, ficha)

  return card
}

// ─────────────────────────────────────────────────────────
//  ATRIBUTOS  ‹ valor ›
// ─────────────────────────────────────────────────────────
function _htmlAtribCtrl(ficha, chave, label) {
  const val = ficha.atributos[chave] ?? 0
  return `
    <div class="cfc-atrib-item">
      <span class="cfc-atrib-label">${label}</span>
      <div class="cfc-atrib-ctrl">
        <button class="cfc-atrib-btn" data-chave="${chave}" data-delta="-1">‹</button>
        <span class="cfc-atrib-val" id="atrib-${ficha.id}-${chave}">${val}</span>
        <button class="cfc-atrib-btn" data-chave="${chave}" data-delta="1">›</button>
      </div>
    </div>`
}

function _bindAtribBtns(card, ficha) {
  card.querySelectorAll(".cfc-atrib-btn").forEach(btn => {
    btn.onclick = async () => {
      const chave = btn.dataset.chave
      const delta = parseInt(btn.dataset.delta)
      ficha.atributos[chave] = Math.max(0, (ficha.atributos[chave] ?? 0) + delta)
      const el = card.querySelector(`#atrib-${ficha.id}-${chave}`)
      if (el) el.textContent = ficha.atributos[chave]
      ficha.calcularStatus()
      _atualizarStatDOM(card, ficha, "pa")
      _atualizarStatDOM(card, ficha, "pm")
      _atualizarStatDOM(card, ficha, "pv")
      _atualizarCombateDOM(card, ficha)
      await _salvarFicha(ficha)
    }
  })
}

// ─────────────────────────────────────────────────────────
//  STATS  «  ‹  ›  »
// ─────────────────────────────────────────────────────────
function _htmlStat(ficha, chave) {
  const s     = ficha.status[chave]
  const atual = s.atual ?? 0
  const max   = s.max   ?? 1
  const over  = atual > max
  const pct   = over ? 100 : Math.max(0, Math.round((atual / (max || 1)) * 100))
  const labels = { pa: "PA", pm: "PM", pv: "PV" }

  return `
    <div class="cfc-stat-row">
      <span class="cfc-stat-label ${chave}">${labels[chave]}</span>
      <div class="cfc-stat-barra-wrap">
        <div class="cfc-stat-barra ${chave}${over ? " over" : ""}" id="barra-${ficha.id}-${chave}" style="width:${pct}%"></div>
      </div>
      <div class="cfc-stat-nums">
        <span class="cfc-stat-atual${over ? " status-over" : ""}" id="stat-atual-${ficha.id}-${chave}">${atual}</span>
        <span class="cfc-stat-sep">/</span>
        <span class="cfc-stat-max" id="stat-max-${ficha.id}-${chave}" title="Clique para editar o máximo">${max}</span>
      </div>
      <div class="cfc-stat-btns">
        <button class="cfc-stat-btn" data-stat="${chave}" data-delta="-5" title="-5">«</button>
        <button class="cfc-stat-btn" data-stat="${chave}" data-delta="-1" title="-1">‹</button>
        <button class="cfc-stat-btn" data-stat="${chave}" data-delta="1"  title="+1">›</button>
        <button class="cfc-stat-btn" data-stat="${chave}" data-delta="5"  title="+5">»</button>
      </div>
    </div>`
}

function _bindStatBtns(card, ficha) {
  card.querySelectorAll(".cfc-stat-btn").forEach(btn => {
    btn.onclick = async () => {
      const chave = btn.dataset.stat
      const delta = parseInt(btn.dataset.delta)
      const s = ficha.status[chave]
      s.atual = Math.max(0, (s.atual ?? 0) + delta)  // sem teto — pode ultrapassar max
      _atualizarStatDOM(card, ficha, chave)
      await _salvarFicha(ficha)
    }
  })

  ;["pa","pm","pv"].forEach(chave => {
    const maxEl = card.querySelector(`#stat-max-${ficha.id}-${chave}`)
    if (!maxEl) return
    maxEl.onclick = () => {
      if (maxEl.dataset.editing) return
      maxEl.dataset.editing = "1"
      const valorAnterior = ficha.status[chave].max ?? 0
      const input = document.createElement("input")
      input.type = "text"
      input.className = "cfc-input-max"
      input.value = valorAnterior
      input.inputMode = "numeric"
      maxEl.textContent = ""
      maxEl.appendChild(input)
      input.focus(); input.select()
      const confirmar = async () => {
        delete maxEl.dataset.editing
        const raw = input.value.replace(",", ".").trim()
        const novoMax = parseInt(raw)
        if (!isNaN(novoMax) && novoMax >= 0) {
          ficha.setMaxManual(chave, novoMax)
          if (ficha.status[chave].atual > novoMax)
            ficha.status[chave].atual = novoMax
        }
        _atualizarStatDOM(card, ficha, chave)
        await _salvarFicha(ficha)
      }
      input.onblur = confirmar
      input.onkeydown = e => {
        if (e.key === "Enter") { e.preventDefault(); input.blur() }
        if (e.key === "Escape") { delete maxEl.dataset.editing; input.value = valorAnterior; input.blur() }
      }
    }
  })
}

function _atualizarStatDOM(card, ficha, chave) {
  const s     = ficha.status[chave]
  const atual = s.atual ?? 0
  const max   = s.max   ?? 1
  const over  = atual > max
  const pct   = over ? 100 : Math.max(0, Math.round((atual / (max || 1)) * 100))

  const elAtual = card.querySelector(`#stat-atual-${ficha.id}-${chave}`)
  const elMax   = card.querySelector(`#stat-max-${ficha.id}-${chave}`)
  const barra   = card.querySelector(`#barra-${ficha.id}-${chave}`)

  if (elAtual) {
    elAtual.textContent = atual
    elAtual.classList.toggle("status-over", over)
  }
  if (elMax && !elMax.querySelector("input")) elMax.textContent = max
  if (barra) {
    barra.style.width = pct + "%"
    barra.classList.toggle("over", over)
  }
}

// ─────────────────────────────────────────────────────────
//  COMBATE
// ─────────────────────────────────────────────────────────
function _htmlCombate(ficha) {
  const atrib    = ficha.atributos[ficha._atribCombate] ?? 0
  const res      = ficha.atributos.resistencia ?? 0
  const hab      = ficha.atributos.habilidade  ?? 0
  const bonusAtk = ficha.bonusAtaqueEquipamentos ?? 0
  const bonusDef = ficha.bonusDefesaEquipamentos ?? 0
  const ex       = ficha.combateExtras ?? {}

  const atkSeguro    = bonusAtk + atrib       + (ex.atkSeguro    ?? 0)
  const atkArriscado = bonusAtk + atrib * 2   + (ex.atkArriscado ?? 0)
  const atkMaluco    = bonusAtk + atrib * 3   + (ex.atkMaluco    ?? 0)
  const defBloqueio  = bonusDef + res * 2     + (ex.defBloqueio  ?? 0)
  const defEsquiva   = bonusDef + hab * 2     + (ex.defEsquiva   ?? 0)
  const defContra    = bonusDef               + (ex.defContra     ?? 0)
  const isPoder      = ficha._atribCombate === "poder"

  return `
    <div class="cfc-combate-toggle">
      <button class="cfc-toggle-btn${isPoder ? " active" : ""}" data-atrib="poder">Poder</button>
      <button class="cfc-toggle-btn${!isPoder ? " active" : ""}" data-atrib="habilidade">Habilidade</button>
    </div>
    <div class="cfc-combate-grid">
      <div class="cfc-combate-grupo">
        <div class="cfc-combate-titulo">Ataque</div>
        <div class="cfc-combate-row"><span>Seguro</span><strong>${atkSeguro}</strong></div>
        <div class="cfc-combate-row"><span>Arriscado</span><strong>${atkArriscado}</strong></div>
        <div class="cfc-combate-row"><span>Maluco</span><strong>${atkMaluco}</strong></div>
      </div>
      <div class="cfc-combate-grupo">
        <div class="cfc-combate-titulo">Defesa</div>
        <div class="cfc-combate-row"><span>Bloqueio</span><strong>${defBloqueio}</strong></div>
        <div class="cfc-combate-row"><span>Esquiva</span><strong>${defEsquiva}</strong></div>
        <div class="cfc-combate-row"><span>Contra</span><strong>${defContra}</strong></div>
      </div>
    </div>`
}

function _bindCombateToggle(card, ficha) {
  const corpo = card.querySelector(`#combate-${ficha.id}`)
  if (!corpo) return
  corpo.addEventListener("click", e => {
    const btn = e.target.closest(".cfc-toggle-btn")
    if (!btn) return
    ficha._atribCombate = btn.dataset.atrib
    _atualizarCombateDOM(card, ficha)
  })
}

function _atualizarCombateDOM(card, ficha) {
  const corpo = card.querySelector(`#combate-${ficha.id}`)
  if (!corpo) return
  corpo.innerHTML = _htmlCombate(ficha)
  _bindCombateToggle(card, ficha)
}

// ─────────────────────────────────────────────────────────
//  GAVETAS
// ─────────────────────────────────────────────────────────
function _htmlGaveta(tipo, titulo, ficha) {
  const count    = _contarGaveta(tipo, ficha)
  const conteudo = _conteudoGaveta(tipo, ficha)
  return `
    <div class="cfc-gaveta" data-gaveta="${tipo}">
      <div class="cfc-gaveta-header">
        <span class="cfc-gaveta-titulo">${titulo}</span>
        <span class="cfc-gaveta-count">${count}</span>
        <span class="cfc-gaveta-seta">▼</span>
      </div>
      <div class="cfc-gaveta-corpo">${conteudo}</div>
    </div>`
}

function _contarGaveta(tipo, ficha) {
  if (tipo === "pericias")     return Object.values(ficha.pericias).filter(Boolean).length
  if (tipo === "vantagens")    return ficha.elementos.filter(e => e.tipo === "vantagem").length
  if (tipo === "desvantagens") return ficha.elementos.filter(e => e.tipo === "desvantagem").length
  if (tipo === "tecnicas")     return ficha.elementos.filter(e => e.tipo === "tecnica").length
  if (tipo === "fontes")       return ficha.elementos.filter(e => e.tipo === "fonte").length
  if (tipo === "isoladas")     return (ficha.caracteristicasIsoladas ?? []).length
  return 0
}

function _conteudoGaveta(tipo, ficha) {
  if (tipo === "pericias")     return _htmlPericias(ficha)
  if (tipo === "vantagens")    return _htmlElementos(ficha, "vantagem")
  if (tipo === "desvantagens") return _htmlElementos(ficha, "desvantagem")
  if (tipo === "tecnicas")     return _htmlElementos(ficha, "tecnica")
  if (tipo === "fontes")       return _htmlFontes(ficha)
  if (tipo === "isoladas")     return _htmlIsoladas(ficha)
  return ""
}

function _htmlPericias(ficha) {
  const ativas = Object.entries(ficha.pericias).filter(([,v]) => v).map(([n]) => n)
  if (!ativas.length) return `<span class="cfc-vazio">Nenhuma perícia</span>`
  return `<div class="cfc-pericias-grid">${ativas.map(nome => {
    const m = ficha.maestrias?.[nome]
    return `<span class="cfc-pericia-tag${m ? " maestria" : ""}">${_esc(nome)}${m ? " ★" : ""}</span>`
  }).join("")}</div>`
}

function _htmlElementos(ficha, tipo) {
  const lista = ficha.elementos.filter(e => e.tipo === tipo)
  if (!lista.length) return `<span class="cfc-vazio">Nenhum</span>`
  return lista.map(e => `
    <div class="cfc-item" data-item-id="${e.id}">
      <div class="cfc-item-header">
        <span class="cfc-item-nome">${_esc(e.nome)}</span>
        <span class="cfc-item-custo">${e.custo >= 0 ? "+" : ""}${e.custo}PT</span>
        <span class="cfc-item-seta">▾</span>
      </div>
      <div class="cfc-item-detalhe">
        <p class="cfc-item-desc">${_esc(e.descricao || "Sem descrição.")}</p>
        ${e.notas ? `<span class="cfc-item-notas">${_esc(e.notas)}</span>` : ""}
      </div>
    </div>`).join("")
}

// ─────────────────────────────────────────────────────────
//  HELPER — Resumo da tabela de uma característica
//  (replicado de uiElementos.js para uso no contexto da cena)
// ─────────────────────────────────────────────────────────
const _LABELS_CARAC = {
  potencia: "Potência", pressao: "Pressão", execucao: "Execução",
  alcance: "Alcance", duracao: "Duração", area: "Área",
  alvos: "Alvos Adicionais", condicoes: "Condições", descontos: "Descontos"
}
const _BASES_PADRAO = {
  execucao: "Padrão", alcance: "Pessoal", duracao: "Instantânea", area: "1 alvo", alvos: "1 alvo"
}

function _htmlResumoCarac(c) {
  const escolhas = c.escolhas ?? {}
  const linhas = []
  const chaves = new Set([...Object.keys(escolhas), ...Object.keys(_BASES_PADRAO)])

  for (const chave of chaves) {
    const lista = escolhas[chave] ?? []
    const itens = lista.filter(i => !i.gratuita)
    if (!itens.length) {
      if (_BASES_PADRAO[chave]) {
        linhas.push(`<div class="cfc-carac-resumo-row">
          <span class="cfc-carac-resumo-label">${_LABELS_CARAC[chave] ?? chave}:</span>
          <span style="opacity:0.4;font-style:italic">${_BASES_PADRAO[chave]}</span>
        </div>`)
      }
      continue
    }
    const contagem = {}
    let total = 0
    for (const item of itens) {
      const k = item.nome ?? `+${item.valor}`
      contagem[k] = (contagem[k] ?? 0) + 1
      if (item.valor !== undefined) total += item.valor * 1
    }
    const valStr = Object.entries(contagem)
      .map(([n, q]) => q > 1 ? `${n} ×${q}` : n).join(", ")
    const totalStr = total > 0
      ? ` <span style="opacity:0.4">= ${total}</span>` : ""
    linhas.push(`<div class="cfc-carac-resumo-row">
      <span class="cfc-carac-resumo-label">${_LABELS_CARAC[chave] ?? chave}:</span>
      <span>${valStr}${totalStr}</span>
    </div>`)
  }

  // Variantes amplificada / reduzida
  const renderV = (v, tipo) => {
    if (!v) return ""
    const amp   = tipo === "amplificada"
    const cor   = amp ? "#f59e0b" : "#60a5fa"
    const icone = amp ? "⬆️" : "⬇️"
    const label = amp ? "Amplificada" : "Reduzida"
    const detalhe = v.label && v.valor
      ? `<span style="font-size:10px;opacity:0.7;margin-left:6px">${v.label}: ${v.valor}</span>` : ""
    return `<div style="border:1px solid ${cor}44;border-radius:5px;padding:4px 7px;
                        margin-top:4px;background:${amp ? "rgba(245,158,11,0.06)" : "rgba(96,165,250,0.06)"}">
      <span style="font-size:11px;font-weight:600;color:${cor}">${icone} ${label} — ${v.custoPM} PM</span>
      ${detalhe}
    </div>`
  }
  const variantes = (renderV(c.amplificada, "amplificada") || "") +
                    (renderV(c.reduzida,    "reduzida")    || "")

  const descricao = c.descricao
    ? `<p class="cfc-item-desc" style="margin-top:6px;border-top:1px solid #1a3050;padding-top:6px">${_esc(c.descricao)}</p>`
    : ""

  return `
    <div class="cfc-carac-resumo">${linhas.join("") || "<span class='cfc-vazio'>Sem tabela</span>"}</div>
    ${variantes ? `<div style="margin-top:4px">${variantes}</div>` : ""}
    ${descricao}`
}

/** Uma característica como item de gaveta expansível */
function _htmlCaracItem(c) {
  const custoPM = c.custoPM != null ? `${c.custoPM} PM` : ""
  const escala  = c.escala  != null ? `E${c.escala}`    : ""
  return `
    <div class="cfc-item cfc-item-carac" data-item-id="${c.id ?? _esc(c.nome)}">
      <div class="cfc-item-header">
        <span class="cfc-item-nome">⚡ ${_esc(c.nome)}</span>
        <span class="cfc-item-custo" style="color:#a78bfa">${escala}</span>
        <span class="cfc-item-custo" style="color:#818cf8;margin-left:2px">${custoPM}</span>
        <span class="cfc-item-seta">▾</span>
      </div>
      <div class="cfc-item-detalhe">
        ${_htmlResumoCarac(c)}
      </div>
    </div>`
}

function _htmlFontes(ficha) {
  const fontes = ficha.elementos.filter(e => e.tipo === "fonte")
  if (!fontes.length) return `<span class="cfc-vazio">Nenhuma fonte</span>`
  return fontes.map(f => {
    // Características da fonte como itens expansíveis
    const caracts = (f.caracteristicas ?? []).map(c => _htmlCaracItem(c)).join("")
    return `
      <div class="cfc-item" data-item-id="${f.id}">
        <div class="cfc-item-header">
          <span class="cfc-item-nome">${_esc(f.nome)}</span>
          <span class="cfc-item-custo" style="color:#a78bfa">${f.pcsGastos ?? 0}/${f.pcs ?? 0}PC</span>
          <span class="cfc-item-seta">▾</span>
        </div>
        <div class="cfc-item-detalhe">
          <p class="cfc-item-desc" style="color:#a78bfa;font-style:italic;margin-bottom:6px">
            ${_esc(f.tema || "Sem tema")} · ${_esc(f.subtipo ?? "geral")}
          </p>
          ${caracts || `<span class="cfc-vazio">Sem características</span>`}
        </div>
      </div>`
  }).join("")
}

function _htmlIsoladas(ficha) {
  const lista = ficha.caracteristicasIsoladas ?? []
  if (!lista.length) return `<span class="cfc-vazio">Nenhuma</span>`
  return lista.map(c => _htmlCaracItem(c)).join("")
}

function _bindGavetas(card, ficha) {
  card.querySelectorAll(".cfc-gaveta-header").forEach(header => {
    header.onclick = () => header.closest(".cfc-gaveta").classList.toggle("aberta")
  })
  card.querySelectorAll(".cfc-item-header").forEach(header => {
    header.onclick = e => {
      e.stopPropagation()
      header.closest(".cfc-item").classList.toggle("aberto")
    }
  })
}

// ─────────────────────────────────────────────────────────
//  SIDEBAR
// ─────────────────────────────────────────────────────────
function renderSidebar() {
  const lista = document.getElementById("sidebarFichas")
  if (!lista) return
  lista.innerHTML = ""

  const nasCena = new Set(_cenaAtual?.fichaIds ?? [])

  if (!_fichasMestre.length) {
    lista.innerHTML = `<span style="font-size:12px;color:#475569;padding:8px;display:block">
      Nenhuma ficha de mestre encontrada.</span>`
    return
  }

  for (const ficha of _fichasMestre) {
    const jaTem = nasCena.has(ficha.id)
    const item  = document.createElement("div")
    item.className       = "cena-sidebar-item" + (jaTem ? " ja-na-cena" : "")
    item.draggable       = !jaTem
    item.dataset.fichaId = ficha.id
    const retratoSide = ficha.imagemUrl
      ? `<div class="cena-sidebar-retrato" style="background-image:url('${ficha.imagemUrl}')"></div>`
      : `<div class="cena-sidebar-retrato cena-sidebar-retrato-vazio">👤</div>`
    item.innerHTML = `
      ${retratoSide}
      <div style="flex:1;min-width:0">
        <span class="cena-sidebar-item-nome">${_esc(ficha.nome)}</span>
        <span class="cena-sidebar-item-meta">Nv.${ficha.nivel}${jaTem ? " · ✓ na cena" : ""}</span>
      </div>`
    if (!jaTem) {
      item.addEventListener("dragstart", e => {
        e.dataTransfer.setData("fichaId", ficha.id)
        item.style.opacity = "0.5"
      })
      item.addEventListener("dragend", () => { item.style.opacity = "" })
    }
    lista.appendChild(item)
  }
}

window.toggleSidebar = function() {
  document.getElementById("cenaSidebar")?.classList.toggle("fechada")
}

// ─────────────────────────────────────────────────────────
//  DROP
// ─────────────────────────────────────────────────────────
function _setupDropZone(el) {
  el.addEventListener("dragover",  e => { e.preventDefault(); el.classList.add("drag-over") })
  el.addEventListener("dragleave", e => { if (!el.contains(e.relatedTarget)) el.classList.remove("drag-over") })
  el.addEventListener("drop", async e => {
    e.preventDefault()
    el.classList.remove("drag-over")
    const fichaId = e.dataTransfer.getData("fichaId")
    if (!fichaId || !_cenaAtual) return
    if (_cenaAtual.fichaIds.includes(fichaId)) return
    _cenaAtual.fichaIds.push(fichaId)
    await _salvarCenaAtual()
    renderCena()
    renderSidebar()
    toastInfo("Ficha adicionada à cena.")
  })
}

async function _removerFichaDaCena(fichaId) {
  if (!_cenaAtual) return
  _cenaAtual.fichaIds = _cenaAtual.fichaIds.filter(id => id !== fichaId)
  await _salvarCenaAtual()
  renderCena()
  renderSidebar()
}

// ─────────────────────────────────────────────────────────
//  MODAL UTILITÁRIOS (evita prompt/confirm nativo do browser)
// ─────────────────────────────────────────────────────────
function _modalPrompt(titulo, valorInicial = "") {
  return new Promise(resolve => {
    let modal = document.getElementById("cenaModalPrompt")
    if (!modal) {
      modal = document.createElement("div")
      modal.id = "cenaModalPrompt"
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.7);
        display:flex;align-items:center;justify-content:center;z-index:9999;`
      modal.innerHTML = `
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:14px;
                    padding:24px 28px;min-width:320px;max-width:90vw;display:flex;flex-direction:column;gap:16px;">
          <p id="cenaModalPromptTitulo" style="color:#f1f5f9;font-size:15px;font-weight:600;margin:0"></p>
          <input id="cenaModalPromptInput" type="text"
            style="background:#1e293b;border:1px solid #2d5a8e;border-radius:8px;
                   color:#f1f5f9;font-size:14px;padding:9px 12px;outline:none;width:100%;box-sizing:border-box"/>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button id="cenaModalPromptCancelar"
              style="padding:7px 16px;border:1px solid #334155;background:#1e293b;
                     color:#94a3b8;border-radius:7px;cursor:pointer;font-size:13px">Cancelar</button>
            <button id="cenaModalPromptOk"
              style="padding:7px 16px;border:none;background:#1d4ed8;
                     color:white;border-radius:7px;cursor:pointer;font-size:13px;font-weight:600">OK</button>
          </div>
        </div>`
      document.body.appendChild(modal)
    }
    const input    = document.getElementById("cenaModalPromptInput")
    const titulo_el = document.getElementById("cenaModalPromptTitulo")
    titulo_el.textContent = titulo
    input.value = valorInicial
    modal.style.display = "flex"
    input.focus(); input.select()

    const limpar = (val) => {
      modal.style.display = "none"
      document.getElementById("cenaModalPromptOk").onclick = null
      document.getElementById("cenaModalPromptCancelar").onclick = null
      modal.onclick = null; input.onkeydown = null
      resolve(val)
    }
    document.getElementById("cenaModalPromptOk").onclick      = () => limpar(input.value.trim() || null)
    document.getElementById("cenaModalPromptCancelar").onclick = () => limpar(null)
    modal.onclick   = e => { if (e.target === modal) limpar(null) }
    input.onkeydown = e => { if (e.key === "Enter") limpar(input.value.trim() || null); if (e.key === "Escape") limpar(null) }
  })
}

function _modalConfirm(mensagem) {
  return new Promise(resolve => {
    let modal = document.getElementById("cenaModalConfirm")
    if (!modal) {
      modal = document.createElement("div")
      modal.id = "cenaModalConfirm"
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.7);
        display:flex;align-items:center;justify-content:center;z-index:9999;`
      modal.innerHTML = `
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:14px;
                    padding:24px 28px;min-width:300px;max-width:90vw;display:flex;flex-direction:column;gap:16px;">
          <p id="cenaModalConfirmMsg" style="color:#e2e8f0;font-size:15px;margin:0;line-height:1.5"></p>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button id="cenaModalConfirmNao"
              style="padding:7px 16px;border:1px solid #334155;background:#1e293b;
                     color:#94a3b8;border-radius:7px;cursor:pointer;font-size:13px">Cancelar</button>
            <button id="cenaModalConfirmSim"
              style="padding:7px 16px;border:none;background:#7f1d1d;
                     color:white;border-radius:7px;cursor:pointer;font-size:13px;font-weight:600">Confirmar</button>
          </div>
        </div>`
      document.body.appendChild(modal)
    }
    document.getElementById("cenaModalConfirmMsg").textContent = mensagem
    modal.style.display = "flex"
    const limpar = (val) => {
      modal.style.display = "none"
      document.getElementById("cenaModalConfirmSim").onclick = null
      document.getElementById("cenaModalConfirmNao").onclick = null
      modal.onclick = null
      resolve(val)
    }
    document.getElementById("cenaModalConfirmSim").onclick = () => limpar(true)
    document.getElementById("cenaModalConfirmNao").onclick = () => limpar(false)
    modal.onclick = e => { if (e.target === modal) limpar(false) }
  })
}

// ─────────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────────
function _esc(str) {
  return String(str ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function _darkenHex(hex, factor) {
  if (!hex || hex.length < 7) return hex
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  const d = (v) => Math.round(v * factor).toString(16).padStart(2, "0")
  return `#${d(r)}${d(g)}${d(b)}`
}

// ─────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Cena é sempre ferramenta do Mestre — aplica tema escuro vinho do modo mestre
  document.body.setAttribute("data-modo", "mestre")

  await inicializarFirebase()
  await aguardarAuth()

  const user = getUser()
  _logado = !!user

  if (_logado && estaConfigurado()) await _bootstrapFirebaseCenas()

  onLogin(async u => {
    _logado = true
    setUserCenas(u)
    await _bootstrapFirebaseCenas()
    await Promise.all([_carregarCenas(), _carregarFichasMestre()])
    await _limparFichasOrfas()
    renderListaCenas()
    if (_cenaAtual) { renderCena(); renderSidebar() }
  })

  onLogout(async () => {
    _logado = false
    setUserCenas(null)
    await Promise.all([_carregarCenas(), _carregarFichasMestre()])
    await _limparFichasOrfas()
    renderListaCenas()
    if (_cenaAtual) { renderCena(); renderSidebar() }
  })

  await Promise.all([_carregarCenas(), _carregarFichasMestre()])
    await _limparFichasOrfas()
  renderListaCenas()

  // Recarrega cenas quando o usuário volta para esta aba
  // (ex: excluiu ficha no index.html em outra aba)
  // Usa window "focus" pois é o evento que dispara ao trocar abas no navegador
  window.addEventListener("focus", async () => {
    await Promise.all([_carregarCenas(), _carregarFichasMestre()])
    await _limparFichasOrfas()
    renderListaCenas()
    if (_cenaAtual) { renderCena(); renderSidebar() }
  })
})

async function _bootstrapFirebaseCenas() {
  if (!estaConfigurado()) return
  try {
    const { getFirestore, doc, setDoc, getDoc } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    const db   = getFirestore()
    const user = getUser()
    if (db && user) inicializarFirebaseCenas(db, user, { doc, setDoc, getDoc })
  } catch(e) { console.warn("[cena.js] Bootstrap Firebase Cenas:", e) }
}