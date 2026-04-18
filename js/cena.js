// ============================================================
//  cena.js — Ferramenta CENA do Mestre
//  Padrão: não-logado = localStorage; logado = Firebase only
// ============================================================

import { Storage }       from "./storage.js"
import { Ficha }         from "./modelos/Ficha.js"
import { StorageCenas, novaCena } from "./storageCenas.js"
import { LISTA_PERICIAS } from "./dados/banco.js"
import {
  inicializarFirebase, getUser, onLogin, onLogout,
  estaConfigurado, aguardarAuth
} from "./firebase.js"
import {
  inicializarFirebaseCenas, setUserCenas,
  carregarCenasFirestore, salvarCenasFirestore,
  salvarCenaFirestore, removerCenaFirestore
} from "./firebaseCenas.js"
import { toastSucesso, toastErro, toastAviso, toastInfo } from "./ui/uiToast.js"

// ── Estado global ─────────────────────────────────────────
let _cenas     = []
let _cenaAtual = null   // cena aberta no momento
let _fichasMestre = []  // todas as fichas do mestre (para o sidebar)
let _logado    = false

// ── Helpers de save status ────────────────────────────────
function _setSaveStatus(estado) {
  const el = document.getElementById("saveIndicator")
  if (!el) return
  el.className = "save-indicator"
  if (estado === "salvando") {
    el.classList.add("save-saving")
    el.querySelector(".save-icon").textContent = "⟳"
    el.querySelector(".save-text").textContent = "Salvando..."
  } else if (estado === "erro") {
    el.classList.add("save-error")
    el.querySelector(".save-icon").textContent = "✗"
    el.querySelector(".save-text").textContent = "Erro"
  } else {
    el.classList.add("save-idle")
    el.querySelector(".save-icon").textContent = "✓"
    el.querySelector(".save-text").textContent = "Salvo"
  }
}

// ── Persistência ─────────────────────────────────────────
async function _carregarCenas() {
  if (_logado && estaConfigurado()) {
    const fb = await carregarCenasFirestore()
    if (fb !== null) { _cenas = fb; return }
  }
  _cenas = StorageCenas.carregar()
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
  }
}

/** Salva apenas a cena atual de volta ao array e persiste */
async function _salvarCenaAtual() {
  if (!_cenaAtual) return
  const idx = _cenas.findIndex(c => c.id === _cenaAtual.id)
  if (idx !== -1) _cenas[idx] = { ..._cenaAtual, updatedAt: new Date().toISOString() }
  else _cenas.push({ ..._cenaAtual, updatedAt: new Date().toISOString() })
  await _salvarCenas()
}

// ── Fichas do Mestre ──────────────────────────────────────
function _carregarFichasMestre() {
  const raw = Storage.carregarFichas("mestre")
  _fichasMestre = raw.map(f => Ficha.fromJSON(f))
}

function _getFichaById(id) {
  return _fichasMestre.find(f => f.id === id) ?? null
}

/** Persiste uma ficha atualizada de volta ao Storage/Firestore */
async function _salvarFicha(ficha) {
  const raw = Storage.carregarFichas("mestre")
  const idx = raw.findIndex(f => f.id === ficha.id)
  if (idx !== -1) {
    raw[idx] = ficha.toJSON()
    Storage.salvarFichas(raw, "mestre")
    // Sync Firebase se logado (usa a função existente do firebase.js)
    if (_logado && estaConfigurado()) {
      const { salvarFichaFirestore } = await import("./firebase.js")
      await salvarFichaFirestore(ficha.toJSON(), "mestre").catch(console.error)
    }
  }
}

// ─────────────────────────────────────────────────────────
//  RENDERIZAÇÃO — LISTA DE CENAS (tela inicial)
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
        <button class="cena-btn cena-btn-abrir" data-id="${cena.id}">▶ Abrir</button>
        <button class="cena-btn cena-btn-renomear" data-id="${cena.id}">✏️</button>
        <button class="cena-btn cena-btn-del" data-id="${cena.id}">🗑️</button>
      </div>
    `
    card.querySelector(".cena-btn-abrir").onclick    = () => abrirCena(cena.id)
    card.querySelector(".cena-btn-renomear").onclick = () => renomearCena(cena.id)
    card.querySelector(".cena-btn-del").onclick      = () => deletarCena(cena.id)
    lista.appendChild(card)
  }
}

// ─────────────────────────────────────────────────────────
//  AÇÕES — LISTA
// ─────────────────────────────────────────────────────────
window.criarNovaCena = async function() {
  const nome = prompt("Nome da cena:", "Nova Cena")
  if (!nome?.trim()) return
  const cena = novaCena(nome.trim())
  _cenas.push(cena)
  await _salvarCenas()
  renderListaCenas()
  toastSucesso(`Cena "${cena.nome}" criada!`)
}

async function deletarCena(id) {
  const cena = _cenas.find(c => c.id === id)
  if (!cena) return
  if (!confirm(`Excluir a cena "${cena.nome}"? As fichas NÃO serão apagadas.`)) return
  _cenas = _cenas.filter(c => c.id !== id)
  await _salvarCenas()
  renderListaCenas()
  toastSucesso("Cena excluída.")
}

async function renomearCena(id) {
  const cena = _cenas.find(c => c.id === id)
  if (!cena) return
  const novo = prompt("Novo nome:", cena.nome)
  if (!novo?.trim() || novo.trim() === cena.nome) return
  cena.nome = novo.trim()
  await _salvarCenas()
  renderListaCenas()
}

// ─────────────────────────────────────────────────────────
//  ABRIR CENA — troca de tela
// ─────────────────────────────────────────────────────────
function abrirCena(id) {
  const cena = _cenas.find(c => c.id === id)
  if (!cena) return
  _cenaAtual = cena
  // Troca painéis
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

  // Drop zone sempre presente ao final
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
  const card = document.createElement("div")
  card.className = "cena-ficha-card"
  card.dataset.fichaId = ficha.id

  const raca = ficha.racaId ? ficha.racaId : "—"
  const prof = ficha.profissaoId ? ficha.profissaoId : "—"

  card.innerHTML = `
    <!-- HEADER -->
    <div class="cfc-header">
      <div>
        <div class="cfc-nome">${_esc(ficha.nome)}</div>
        <span class="cfc-nivel">Nv.${ficha.nivel} · ${_esc(raca)} · ${_esc(prof)}</span>
      </div>
      <button class="cfc-remover" title="Remover da cena">✕</button>
    </div>

    <!-- ATRIBUTOS -->
    <div class="cfc-atribs">
      ${_htmlAtrib("P", ficha.atributos.poder)}
      ${_htmlAtrib("H", ficha.atributos.habilidade)}
      ${_htmlAtrib("R", ficha.atributos.resistencia)}
    </div>

    <!-- STATS -->
    <div class="cfc-stats" id="stats-${ficha.id}">
      ${_htmlStat(ficha, "pa")}
      ${_htmlStat(ficha, "pm")}
      ${_htmlStat(ficha, "pv")}
    </div>

    <!-- GAVETAS -->
    <div class="cfc-gavetas">
      ${_htmlGaveta("pericias",   "📋 Perícias",            ficha)}
      ${_htmlGaveta("vantagens",  "✅ Vantagens",           ficha)}
      ${_htmlGaveta("desvantagens","❌ Desvantagens",       ficha)}
      ${_htmlGaveta("tecnicas",   "⚡ Técnicas",            ficha)}
      ${_htmlGaveta("fontes",     "🌊 Fontes de Poder",     ficha)}
      ${_htmlGaveta("isoladas",   "✨ Características Isoladas", ficha)}
    </div>
  `

  // Remover da cena
  card.querySelector(".cfc-remover").onclick = () => _removerFichaDaCena(ficha.id)

  // Botões +/- stats
  _bindStatBtns(card, ficha)

  // Gavetas
  _bindGavetas(card, ficha)

  return card
}

function _htmlAtrib(label, val) {
  return `
    <div class="cfc-atrib-item">
      <span class="cfc-atrib-label">${label}</span>
      <span class="cfc-atrib-val">${val ?? 0}</span>
    </div>`
}

function _htmlStat(ficha, chave) {
  const s      = ficha.status[chave]
  const atual  = s.atual  ?? 0
  const max    = s.max    ?? 1
  const pct    = Math.min(100, Math.max(0, Math.round((atual / (max || 1)) * 100)))
  const labels = { pa: "PA", pm: "PM", pv: "PV" }
  return `
    <div class="cfc-stat-row">
      <span class="cfc-stat-label ${chave}">${labels[chave]}</span>
      <div class="cfc-stat-barra-wrap">
        <div class="cfc-stat-barra ${chave}" style="width:${pct}%"></div>
      </div>
      <div class="cfc-stat-nums">
        <span class="cfc-stat-atual" id="stat-atual-${ficha.id}-${chave}">${atual}</span>
        <span class="cfc-stat-sep">/</span>
        <span class="cfc-stat-max"
              id="stat-max-${ficha.id}-${chave}"
              title="Clique para editar o máximo">${max}</span>
      </div>
      <div class="cfc-stat-btns">
        <button class="cfc-stat-btn" data-ficha="${ficha.id}" data-stat="${chave}" data-delta="-1">−</button>
        <button class="cfc-stat-btn" data-ficha="${ficha.id}" data-stat="${chave}" data-delta="1">+</button>
      </div>
    </div>`
}

function _bindStatBtns(card, ficha) {
  // +/- ATUAL
  card.querySelectorAll(".cfc-stat-btn").forEach(btn => {
    btn.onclick = async () => {
      const chave = btn.dataset.stat
      const delta = parseInt(btn.dataset.delta)
      const s = ficha.status[chave]
      s.atual = Math.max(0, Math.min(s.max ?? 999, (s.atual ?? 0) + delta))
      _atualizarStatDOM(card, ficha, chave)
      await _salvarFicha(ficha)
    }
  })

  // Clique no MAX → edição inline
  ;["pa","pm","pv"].forEach(chave => {
    const maxEl = card.querySelector(`#stat-max-${ficha.id}-${chave}`)
    if (!maxEl) return
    maxEl.onclick = () => {
      if (maxEl.querySelector("input")) return // já editando
      const atual = ficha.status[chave].max ?? 0
      const input = document.createElement("input")
      input.type  = "number"
      input.className = "cfc-input-max"
      input.value = atual
      maxEl.textContent = ""
      maxEl.appendChild(input)
      input.focus()
      input.select()
      const confirmar = async () => {
        const novoMax = parseInt(input.value)
        if (!isNaN(novoMax) && novoMax >= 0) {
          ficha.setMaxManual(chave, novoMax)
          // ajusta atual se exceder o novo max
          if (ficha.status[chave].atual > novoMax) ficha.status[chave].atual = novoMax
        }
        _atualizarStatDOM(card, ficha, chave)
        await _salvarFicha(ficha)
      }
      input.onblur  = confirmar
      input.onkeydown = (e) => { if (e.key === "Enter") input.blur() }
    }
  })
}

function _atualizarStatDOM(card, ficha, chave) {
  const s     = ficha.status[chave]
  const atual = s.atual ?? 0
  const max   = s.max   ?? 1
  const pct   = Math.min(100, Math.max(0, Math.round((atual / (max || 1)) * 100)))

  const elAtual = card.querySelector(`#stat-atual-${ficha.id}-${chave}`)
  const elMax   = card.querySelector(`#stat-max-${ficha.id}-${chave}`)
  const barra   = card.querySelector(`.cfc-stats .cfc-stat-barra.${chave}`)

  if (elAtual) elAtual.textContent = atual
  if (elMax)   elMax.textContent   = max
  if (barra)   barra.style.width   = pct + "%"
}

// ─────────────────────────────────────────────────────────
//  GAVETAS
// ─────────────────────────────────────────────────────────
function _htmlGaveta(tipo, titulo, ficha) {
  const conteudo = _conteudoGaveta(tipo, ficha)
  const count    = _contarGaveta(tipo, ficha)
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
  const ativas = Object.entries(ficha.pericias)
    .filter(([, v]) => v)
    .map(([nome]) => nome)

  if (!ativas.length) return `<span class="cfc-vazio">Nenhuma perícia</span>`

  return `<div class="cfc-pericias-grid">
    ${ativas.map(nome => {
      const m = ficha.maestrias?.[nome]
      return `<span class="cfc-pericia-tag${m ? " maestria" : ""}">${_esc(nome)}${m ? " ★" : ""}</span>`
    }).join("")}
  </div>`
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

function _htmlFontes(ficha) {
  const fontes = ficha.elementos.filter(e => e.tipo === "fonte")
  if (!fontes.length) return `<span class="cfc-vazio">Nenhuma fonte</span>`
  return fontes.map(f => {
    const caracts = (f.caracteristicas ?? []).map(c =>
      `<div class="cfc-carac-mini">
        <span class="cfc-carac-mini-nome">⚡ ${_esc(c.nome)} <em style="opacity:0.4;font-size:10px">E${c.escala}</em></span>
        <span class="cfc-carac-mini-pm">${c.custoPM}PM</span>
      </div>`).join("")
    return `
      <div class="cfc-item" data-item-id="${f.id}">
        <div class="cfc-item-header">
          <span class="cfc-item-nome">${_esc(f.nome)}</span>
          <span class="cfc-item-custo" style="color:#a78bfa">${f.pcsGastos ?? 0}/${f.pcs ?? 0}PC</span>
          <span class="cfc-item-seta">▾</span>
        </div>
        <div class="cfc-item-detalhe">
          <p class="cfc-item-desc" style="color:#7c3aed;font-style:italic;margin-bottom:4px">
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
  return lista.map(c => `
    <div class="cfc-item" data-item-id="${c.id}">
      <div class="cfc-item-header">
        <span class="cfc-item-nome">${_esc(c.nome)}</span>
        <span class="cfc-item-custo" style="color:#a78bfa">E${c.escala ?? 1}</span>
        <span class="cfc-item-seta">▾</span>
      </div>
      <div class="cfc-item-detalhe">
        <p class="cfc-item-desc">${_esc(c.descricao || c.nome)}</p>
        ${c.custoPM ? `<span class="cfc-item-notas">${c.custoPM} PM</span>` : ""}
      </div>
    </div>`).join("")
}

function _bindGavetas(card, ficha) {
  // Toggle de gaveta principal
  card.querySelectorAll(".cfc-gaveta-header").forEach(header => {
    header.onclick = () => {
      const gaveta = header.closest(".cfc-gaveta")
      gaveta.classList.toggle("aberta")
    }
  })

  // Toggle de sub-item (gaveta de gaveta)
  card.querySelectorAll(".cfc-item-header").forEach(header => {
    header.onclick = (e) => {
      e.stopPropagation()
      const item = header.closest(".cfc-item")
      item.classList.toggle("aberto")
    }
  })
}

// ─────────────────────────────────────────────────────────
//  SIDEBAR — lista de fichas do mestre para drag & drop
// ─────────────────────────────────────────────────────────
function renderSidebar() {
  const lista = document.getElementById("sidebarFichas")
  if (!lista) return
  lista.innerHTML = ""

  const nasCena = new Set(_cenaAtual?.fichaIds ?? [])

  if (!_fichasMestre.length) {
    lista.innerHTML = `<span style="font-size:12px;color:#334155;padding:8px">Nenhuma ficha de mestre encontrada.</span>`
    return
  }

  for (const ficha of _fichasMestre) {
    const jaTem = nasCena.has(ficha.id)
    const item  = document.createElement("div")
    item.className    = "cena-sidebar-item" + (jaTem ? " ja-na-cena" : "")
    item.draggable    = !jaTem
    item.dataset.fichaId = ficha.id
    item.innerHTML = `
      <span class="cena-sidebar-item-nome">${_esc(ficha.nome)}</span>
      <span class="cena-sidebar-item-meta">Nv.${ficha.nivel}${jaTem ? " · na cena" : ""}</span>
    `
    if (!jaTem) {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("fichaId", ficha.id)
        item.style.opacity = "0.5"
      })
      item.addEventListener("dragend", () => {
        item.style.opacity = ""
      })
    }
    lista.appendChild(item)
  }
}

window.toggleSidebar = function() {
  const sb = document.getElementById("cenaSidebar")
  if (sb) sb.classList.toggle("fechada")
}

// ─────────────────────────────────────────────────────────
//  DROP ZONE
// ─────────────────────────────────────────────────────────
function _setupDropZone(el) {
  el.addEventListener("dragover",  (e) => { e.preventDefault(); el.classList.add("drag-over") })
  el.addEventListener("dragleave", (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove("drag-over") })
  el.addEventListener("drop",      async (e) => {
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
//  UTILS
// ─────────────────────────────────────────────────────────
function _esc(str) {
  if (!str) return ""
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
}

// ─────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await inicializarFirebase()
  await aguardarAuth()

  const user = getUser()
  _logado = !!user

  // Conecta firebase de cenas usando instâncias já existentes
  // Importa internos do firebase.js via side-effect (são módulo singleton)
  if (_logado && estaConfigurado()) {
    // Workaround: importa fns do Firebase já carregadas
    // O padrão do projeto usa variáveis internas — reutilizamos via função dedicada
    // (Ver firebaseCenas.js — inicializarFirebaseCenas recebe db/user/fns)
    // Como o firebase.js não expõe _db diretamente, fazemos lazy init:
    // na primeira chamada de carregarCenasFirestore ele vai falhar se não inicializado.
    // Solução: bootstrap via firebase.js existente importando getFirestoreInternals
    await _bootstrapFirebaseCenas()
  }

  onLogin(async (u) => {
    _logado = true
    setUserCenas(u)
    await _bootstrapFirebaseCenas()
    await _carregarCenas()
    _carregarFichasMestre()
    renderListaCenas()
  })

  onLogout(() => {
    _logado = false
    setUserCenas(null)
    _carregarCenas().then(() => {
      _carregarFichasMestre()
      renderListaCenas()
    })
  })

  _carregarFichasMestre()
  await _carregarCenas()
  renderListaCenas()
})

/**
 * Bootstrap das funções internas do Firebase para o módulo de cenas.
 * O firebase.js expõe as funções de alto nível mas não _db/_fns diretamente.
 * Usamos a mesma estratégia: importamos o SDK já carregado pelo firebase.js
 * através de uma re-importação (módulos são singletons em ES modules).
 */
async function _bootstrapFirebaseCenas() {
  if (!estaConfigurado()) return
  try {
    // Re-importa — o SDK já foi inicializado por firebase.js, então
    // getFirestore() retorna a instância existente (singleton interno do Firebase SDK)
    const { getFirestore, doc, setDoc, getDoc } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    const db   = getFirestore()
    const user = getUser()
    if (db && user) {
      inicializarFirebaseCenas(db, user, { doc, setDoc, getDoc })
    }
  } catch(e) {
    console.warn("[cena.js] Bootstrap Firebase Cenas:", e)
  }
}
