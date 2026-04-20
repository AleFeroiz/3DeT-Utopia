// ============================================================
//  js/index.js  v2 — Player + Mestre
//  Doutrina: não-logado = localStorage; logado = Firebase only
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"
import {
  inicializarFirebase, loginGoogle, logout, getUser,
  onLogin, onLogout, estaConfigurado, aguardarAuth,
  salvarFichaFirestore, salvarIndiceFichasFirestore, salvarPastasFirestore,
  carregarIndiceFichasFirestore, carregarFichaFirestore, carregarPastasFirestore,
  removerFichaFirestore
} from "./firebase.js"
import { toastSucesso, toastInfo, toastErro, toastAviso } from "./ui/uiToast.js"
import { StorageCenas } from "./storageCenas.js"
import { carregarCenasFirestore, salvarCenasFirestore } from "./firebaseCenas.js"
import { gerarViagem, AMBIENTES, RITMOS, PORTES, ESTADOS_VEICULO, RESULTADOS_NAVEGADOR, RESULTADOS_PILOTO } from "./viagem.js"

// ── Overlay de sincronização ──────────────────────────────
function _setSincronizando(ativo) {
  let overlay = document.getElementById("overlaySincronizando")
  if (!overlay) {
    overlay = document.createElement("div")
    overlay.id = "overlaySincronizando"
    overlay.innerHTML = `<div class="sync-box"><span class="sync-spin">⟳</span> Sincronizando...</div>`
    overlay.style.cssText = `
      display:none;position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);
      align-items:center;justify-content:center;
    `
    const style = document.createElement("style")
    style.textContent = `
      .sync-box { background:#1e293b;color:#e2e8f0;padding:20px 36px;border-radius:12px;
        font-size:16px;font-weight:600;display:flex;align-items:center;gap:12px;
        border:1px solid #334155;box-shadow:0 8px 32px rgba(0,0,0,0.4); }
      .sync-spin { font-size:22px;display:inline-block;animation:spin 1s linear infinite; }
      @keyframes spin { to { transform:rotate(360deg); } }
    `
    document.head.appendChild(style)
    document.body.appendChild(overlay)
  }
  overlay.style.display = ativo ? "flex" : "none"
}

// Modal de confirmação customizado (substitui o confirm() nativo feio)
function _confirmar(mensagem) {
  return new Promise(resolve => {
    let modal = document.getElementById("modalConfirm")
    if (!modal) {
      modal = document.createElement("div")
      modal.id = "modalConfirm"
      modal.style.cssText = `
        display:none;position:fixed;inset:0;z-index:10000;
        background:rgba(0,0,0,0.6);backdrop-filter:blur(2px);
        align-items:center;justify-content:center;
      `
      modal.innerHTML = `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:14px;
          padding:28px 32px;max-width:420px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,0.5)">
          <p id="modalConfirmMsg" style="color:#e2e8f0;font-size:15px;margin:0 0 24px;line-height:1.5"></p>
          <div style="display:flex;gap:12px;justify-content:flex-end">
            <button id="modalConfirmNao"
              style="padding:8px 20px;border-radius:8px;border:1px solid #475569;
              background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">
              Cancelar
            </button>
            <button id="modalConfirmSim"
              style="padding:8px 20px;border-radius:8px;border:none;
              background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:600">
              Excluir
            </button>
          </div>
        </div>`
      document.body.appendChild(modal)
    }
    document.getElementById("modalConfirmMsg").textContent = mensagem
    modal.style.display = "flex"
    const limpar = (res) => {
      modal.style.display = "none"
      document.getElementById("modalConfirmSim").onclick = null
      document.getElementById("modalConfirmNao").onclick = null
      resolve(res)
    }
    document.getElementById("modalConfirmSim").onclick = () => limpar(true)
    document.getElementById("modalConfirmNao").onclick = () => limpar(false)
    modal.onclick = (e) => { if (e.target === modal) limpar(false) }
  })
}

// ── Estado ─────────────────────────────────────────────────
const MODOS = {
  player: {
    fichas: [], pastas: [], pastasAbertas: new Set(),
    ids: {
      areaSemPasta: "areaSemPasta", listaPastas: "listaPastas",
      btnNova: "btnNova", btnNovaPasta: "btnNovaPasta",
    },
  },
  mestre: {
    fichas: [], pastas: [], pastasAbertas: new Set(),
    ids: {
      areaSemPasta: "areaSemPastaMestre", listaPastas: "listaPastasMestre",
      btnNova: "btnNovaMestre", btnNovaPasta: "btnNovaPastaMestre",
    },
  },
}

let modoAtivo  = localStorage.getItem("modoIndex") ?? "player"
let _logado    = false   // Bug #1/#7: flag que controla fonte de dados

// ── Fonte de dados ─────────────────────────────────────────
// Bug #1: clara separação. Logado = Firebase. Não logado = localStorage.
function _carregarDoCache(modo) {
  const m = MODOS[modo]
  m.fichas = Storage.carregarFichas(modo)
  m.pastas = Storage.carregarPastas(modo)
  // Bug #28: não abrir todas as pastas automaticamente — preserva estado local
  const abertas = Storage.carregarPastasAbertas(modo)
  m.pastasAbertas = abertas ? new Set(abertas) : new Set()
}

function _limparModo(modo) {
  // Bug #7: ao fazer logout, limpa memória — não exibe dados da nuvem
  MODOS[modo].fichas = []
  MODOS[modo].pastas = []
  MODOS[modo].pastasAbertas = new Set()
}

// ── Persistência ───────────────────────────────────────────
// Bug #8/#17: async + try/catch em todas as chamadas Firebase
// Bug #26: pastas-only salva só pastas; fichas-only salva só fichas
async function _salvarFirebase(modo, opcoes = { fichas: true, pastas: true }) {
  if (!_logado || !estaConfigurado()) return
  const m = MODOS[modo]
  _setSincronizando(true)
  try {
    if (opcoes.fichas) {
      await salvarIndiceFichasFirestore(m.fichas, modo)
    }
    if (opcoes.pastas) {
      await salvarPastasFirestore(m.pastas, modo)
    }
  } catch(e) {
    console.error("[salvar]", e)
    toastErro("Erro ao sincronizar com a nuvem.")
  } finally {
    _setSincronizando(false)
  }
}

// Salvar ficha individual (chamado só quando uma ficha muda de conteúdo)
async function _salvarFichaIndividual(fichaObj, modo) {
  Storage.salvarFichaPorId(fichaObj, modo)
  if (!_logado || !estaConfigurado()) return
  try {
    await salvarFichaFirestore(fichaObj, modo)
  } catch(e) {
    console.error("[salvar ficha]", e)
    toastErro("Erro ao salvar ficha na nuvem.")
  }
}

// Salvar tudo de um modo (para operações que afetam fichas e pastas)
async function salvar(modo) {
  const m = MODOS[modo]
  // localStorage sempre (cache offline)
  Storage.salvarFichas(m.fichas, modo)
  Storage.salvarPastas(m.pastas, modo)
  await _salvarFirebase(modo, { fichas: true, pastas: true })
}

// Salvar só pastas (criar/renomear/excluir pasta não re-salva todas as fichas)
// Bug #26
async function _salvarSoPastas(modo) {
  Storage.salvarPastas(MODOS[modo].pastas, modo)
  await _salvarFirebase(modo, { fichas: false, pastas: true })
}

// ── Trocar modo ────────────────────────────────────────────
window.setModo = function(modo) {
  if (modoAtivo === modo) return
  modoAtivo = modo
  localStorage.setItem("modoIndex", modo)
  _aplicarTema(modo)
  renderizar(modo)
}

function _aplicarTema(modo) {
  const isMestre = modo === "mestre"
  document.body.setAttribute("data-modo", modo)
  document.getElementById("painelPlayer").classList.toggle("hidden",  isMestre)
  document.getElementById("painelMestre").classList.toggle("hidden", !isMestre)
  document.getElementById("btnModoPlayer").classList.toggle("active", !isMestre)
  document.getElementById("btnModoMestre").classList.toggle("active",  isMestre)
  document.getElementById("tituloSite").textContent    = isMestre ? "📖 Mesa do Mestre" : "⚓ 3DeT One Piece"
  document.getElementById("subtituloSite").textContent = isMestre ? "Gerencie as fichas da sua campanha" : "Gerencie suas fichas de personagem"
}

// ── Render ─────────────────────────────────────────────────
function renderizar(modo) {
  _renderSemPasta(modo)
  _renderPastas(modo)
}

function _renderSemPasta(modo) {
  const m    = MODOS[modo]
  const area = document.getElementById(m.ids.areaSemPasta)
  if (!area) return
  area.innerHTML = ""

  // Bug #24: usa ficha.id para operações em vez de índice posicional
  const semPasta = m.fichas.filter(f => !f.pastaId)

  if (!m.fichas.length) {
    area.innerHTML = `<div class="lista-vazia">
      <p>Nenhuma ficha criada ainda.</p>
      <p>Clique em <strong>+ Nova Ficha</strong> para começar!</p></div>`
    _bindDropZone(area, null, modo)
    return
  }

  if (semPasta.length > 0) {
    if (m.pastas.length > 0) {
      const label = document.createElement("div")
      label.className = "area-sem-pasta-label"
      label.textContent = "Sem pasta"
      area.appendChild(label)
    }
    semPasta.forEach(f => area.appendChild(_criarCard(f, modo)))
  }

  _bindDropZone(area, null, modo)
}

function _renderPastas(modo) {
  const m         = MODOS[modo]
  const container = document.getElementById(m.ids.listaPastas)
  if (!container) return
  container.innerHTML = ""

  m.pastas.forEach((pasta, pi) => {
    // Bug #24: filtra por pastaId, não por index
    const fichasDaPasta = m.fichas.filter(f => f.pastaId === pasta.id)
    const aberta        = m.pastasAbertas.has(pasta.id)

    const bloco = document.createElement("div")
    bloco.className = "pasta-bloco"
    bloco.innerHTML = `
      <div class="pasta-header">
        <span class="pasta-toggle ${aberta ? "" : "fechada"}">▼</span>
        <span class="pasta-nome" title="Duplo clique para renomear">${_esc(pasta.nome)}</span>
        <span class="pasta-count">${fichasDaPasta.length} ficha${fichasDaPasta.length !== 1 ? "s" : ""}</span>
        <div class="pasta-acoes">
          <button class="btn-nova-pasta">+ Ficha</button>
          <button class="btn-ren-pasta">✏️</button>
          <button class="btn-del-pasta">🗑️</button>
        </div>
      </div>
      <div class="pasta-conteudo drop-zone ${aberta ? "" : "fechada"}"></div>`

    const conteudo = bloco.querySelector(".pasta-conteudo")
    const nomeEl   = bloco.querySelector(".pasta-nome")

    if (!fichasDaPasta.length) {
      const vazia = document.createElement("div")
      vazia.className = "pasta-vazia"
      vazia.textContent = "Arraste fichas para cá ou use '+ Ficha'"
      conteudo.appendChild(vazia)
    } else {
      fichasDaPasta.forEach(f => conteudo.appendChild(_criarCard(f, modo)))
    }

    bloco.querySelector(".pasta-header").addEventListener("click", (e) => {
      if (e.target.closest(".pasta-acoes")) return
      if (m.pastasAbertas.has(pasta.id)) m.pastasAbertas.delete(pasta.id)
      else m.pastasAbertas.add(pasta.id)
      // Persiste estado aberto/fechado
      Storage.salvarPastasAbertas([...m.pastasAbertas], modo)
      renderizar(modo)
    })

    nomeEl.addEventListener("dblclick", (e) => { e.stopPropagation(); _renomearInline(nomeEl, pi, modo) })
    bloco.querySelector(".btn-nova-pasta").addEventListener("click", (e) => { e.stopPropagation(); criarFicha(pasta.id, modo) })
    bloco.querySelector(".btn-ren-pasta").addEventListener("click",  (e) => { e.stopPropagation(); _abrirModal(pi, modo) })
    bloco.querySelector(".btn-del-pasta").addEventListener("click",  (e) => { e.stopPropagation(); _excluirPasta(pi, pasta.id, modo) })

    _bindDropZone(conteudo, pasta.id, modo)
    container.appendChild(bloco)
  })
}

// Bug #25: escapa HTML para evitar XSS
function _esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

/** Converte hex para [hue, saturation, lightness] — espelho do app.js */
function _hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3), 16) / 255
  let g = parseInt(hex.slice(3,5), 16) / 255
  let b = parseInt(hex.slice(5,7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// ── Card ───────────────────────────────────────────────────
function _criarCard(f, modo) {
  // Bug #24: opera por ficha.id, não por índice
  const div = document.createElement("div")
  div.className = "ficha-card"
  div.draggable = true

  const nivel  = f.nivel ?? 1
  const gastos = f.pontos?.gastos ?? 0
  const total  = f.pontos?.total  ?? 10
  const cor    = f.corTema ?? "#3b82f6"

  // Aplica a cor tema como CSS variable local do card
  div.style.setProperty("--cor-tema", cor)
  div.style.setProperty("--cor-tema-dim", cor + "22")
  div.style.setProperty("--cor-tema-mid", cor + "55")

  // Gera paleta de fundo derivada da matiz da cor tema (mesmo algoritmo do app.js)
  const [h, s] = _hexToHsl(cor)
  const satFundo  = Math.min(s * 0.35, 25)
  const satCard   = Math.min(s * 0.55, 40)
  // Aplica background diretamente — CSS variables locais não sobrescrevem seletores de classe
  div.style.background   = `hsl(${h},${satCard}%,15%)`
  div.style.borderColor  = `hsl(${h},${satFundo}%,25%)`
  div.style.setProperty("--bg-card",   `hsl(${h},${satCard}%,15%)`)
  div.style.setProperty("--bg-base",   `hsl(${h},${satFundo}%,7%)`)
  div.style.setProperty("--bg-accent", `hsl(${h},${Math.min(s * 0.5, 35)}%,18%)`)
  div.style.setProperty("--bg-hover",  `hsl(${h},${satFundo}%,17%)`)
  div.style.setProperty("--border",    `hsl(${h},${satFundo}%,20%)`)

  // Bug #25: escapa dados do usuário antes de inserir no HTML
  const imgSrc = f.imagemThumb || f.imagemUrl || null
  const retratoHtml = imgSrc
    ? `<div class="ficha-retrato" style="background-image:url('${imgSrc}')"></div>`
    : `<div class="ficha-retrato ficha-retrato-vazio">👤</div>`

  div.innerHTML = `
    ${retratoHtml}
    <div class="ficha-info">
      <strong class="ficha-nome">${_esc(f.nome) || "Sem Nome"}</strong>
      <div class="ficha-meta">
        <span>⚔️ Nível ${nivel}</span>
        ${f.racaId      ? `<span>🧬 ${_esc(f.racaId)}</span>`      : ""}
        ${f.profissaoId ? `<span>⚒️ ${_esc(f.profissaoId)}</span>` : ""}
        <span>🎯 ${gastos}/${total} PT</span>
      </div>
    </div>
    <div class="ficha-acoes">
      <button class="btn btn-abrir"   title="Abrir ficha">Abrir</button>
      <button class="btn btn-dupl"    title="Duplicar ficha">⧉ Duplicar</button>
      <button class="btn btn-deletar" title="Excluir ficha">🗑️</button>
    </div>`

  // Bug #24: closures capturam f.id, não índice posicional
  div.querySelector(".btn-abrir").onclick   = (e) => { e.stopPropagation(); _abrirFicha(f.id, modo) }
  div.querySelector(".btn-dupl").onclick    = (e) => { e.stopPropagation(); _duplicarFicha(f.id, modo) }
  div.querySelector(".btn-deletar").onclick = (e) => { e.stopPropagation(); _deletarFicha(f.id, modo) }

  div.addEventListener("dragstart", (e) => {
    div.classList.add("dragging")
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("fichaId", f.id)
    e.dataTransfer.setData("modo", modo)
  })
  div.addEventListener("dragend", () => {
    div.classList.remove("dragging")
    document.querySelectorAll(".dragover").forEach(el => el.classList.remove("dragover"))
  })

  return div
}

// ── Drop zones ─────────────────────────────────────────────
function _bindDropZone(el, pastaId, modo) {
  el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("dragover") })
  el.addEventListener("dragleave", (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove("dragover") })
  el.addEventListener("drop", (e) => {
    e.preventDefault()
    el.classList.remove("dragover")
    const fichaId   = e.dataTransfer.getData("fichaId")
    const fichaModo = e.dataTransfer.getData("modo")
    if (!fichaId || fichaModo !== modo) return
    const m    = MODOS[modo]
    const ficha = m.fichas.find(f => f.id === fichaId)
    if (!ficha) return
    if ((ficha.pastaId ?? null) === pastaId) return
    if (pastaId) ficha.pastaId = pastaId
    else delete ficha.pastaId
    // Bug #26: mover ficha de pasta = salva apenas as fichas (índice), não pastas
    salvar(modo)
    renderizar(modo)
  })
}

// ── Ações fichas ───────────────────────────────────────────
function criarFicha(pastaId = null, modo = modoAtivo) {
  const m   = MODOS[modo]
  const nova = Ficha.nova().toJSON()
  if (!nova.id) nova.id = crypto.randomUUID()
  if (pastaId) nova.pastaId = pastaId
  m.fichas.push(nova)
  if (pastaId) m.pastasAbertas.add(pastaId)
  // Nova ficha: salva ficha individual + índice, não as pastas
  _salvarFichaIndividual(nova, modo)
  salvar(modo)
  renderizar(modo)
}

// Bug #24: opera por id
async function _duplicarFicha(fichaId, modo) {
  const m        = MODOS[modo]
  const encontrado = m.fichas.find(f => f.id === fichaId)
  if (!encontrado) return

  // Se estiver logado, os cards são só metadados (_soMetadados: true).
  // Precisa carregar o documento completo antes de copiar.
  let dadosCompletos = encontrado
  if (encontrado._soMetadados) {
    const remoto = await carregarFichaFirestore(fichaId, modo)
    if (!remoto) { toastErro("Não foi possível carregar a ficha para duplicar."); return }
    dadosCompletos = remoto
  }

  const copia      = JSON.parse(JSON.stringify(dadosCompletos))
  copia.id         = crypto.randomUUID()
  copia.nome       = (dadosCompletos.nome || "Ficha") + " (cópia)"
  copia.isPublic   = false
  copia.editPublic = false
  delete copia._soMetadados
  delete copia._ownerUid  // será sobrescrito pelo salvarFichaFirestore

  // pastaId: prioridade ao metadado SE for uma string válida (UUID),
  // caso contrário usa o que veio do doc completo
  const pastaIdFinal = (typeof encontrado.pastaId === "string" && encontrado.pastaId)
    ? encontrado.pastaId
    : (typeof dadosCompletos.pastaId === "string" && dadosCompletos.pastaId)
      ? dadosCompletos.pastaId
      : null
  if (pastaIdFinal) copia.pastaId = pastaIdFinal
  else delete copia.pastaId

  const idx = m.fichas.indexOf(encontrado)
  m.fichas.splice(idx + 1, 0, copia)

  await _salvarFichaIndividual(copia, modo)
  await salvar(modo)
  renderizar(modo)
  toastSucesso(`"${copia.nome}" criada!`)
}

// Bug #21/#24: deleta do Firestore também
async function _deletarFicha(fichaId, modo) {
  const m     = MODOS[modo]
  const ficha = m.fichas.find(f => f.id === fichaId)
  if (!ficha) return
  const confirmado = await _confirmar(`Excluir "${ficha.nome || "esta ficha"}"?\nEsta ação não pode ser desfeita.`)
  if (!confirmado) return

  m.fichas = m.fichas.filter(f => f.id !== fichaId)
  Storage.salvarFichas(m.fichas, modo)
  renderizar(modo)

  // Remove o documento individual do Firestore
  if (_logado && estaConfigurado()) {
    try {
      await removerFichaFirestore(fichaId, modo)
      await salvarIndiceFichasFirestore(m.fichas, modo)
    } catch(e) {
      console.error("[deletar ficha]", e)
      toastErro("Erro ao remover ficha da nuvem.")
    }
  }

  // Remove referência da ficha excluída em todas as cenas
  try {
    let cenas = _logado && estaConfigurado()
      ? (await carregarCenasFirestore() ?? StorageCenas.carregar())
      : StorageCenas.carregar()
    const cenasAlteradas = cenas.some(c => c.fichaIds?.includes(fichaId))
    if (cenasAlteradas) {
      cenas = cenas.map(c => ({
        ...c,
        fichaIds: (c.fichaIds ?? []).filter(id => id !== fichaId)
      }))
      StorageCenas.salvar(cenas)
      if (_logado && estaConfigurado()) await salvarCenasFirestore(cenas)
    }
  } catch(eCena) {
    console.warn("[deletar ficha] erro ao limpar cenas:", eCena)
  }
}

function _abrirFicha(fichaId, modo) {
  if (!fichaId) return
  window.location.href = `ficha.html?id=${fichaId}&modo=${modo}`
}

// ── Ações pastas ───────────────────────────────────────────
let _modalEditIdx = null, _modalEditModo = "player"

function _abrirModal(editIdx = null, modo = modoAtivo) {
  _modalEditIdx = editIdx; _modalEditModo = modo
  const titulo = document.getElementById("modalPastaTitulo")
  const input  = document.getElementById("inputNomePasta")
  const btnOk  = document.getElementById("btnConfirmarPasta")
  if (editIdx !== null) {
    titulo.textContent = "✏️ Renomear Pasta"
    input.value = MODOS[modo].pastas[editIdx].nome
    btnOk.textContent = "Salvar"
  } else {
    titulo.textContent = "📁 Nova Pasta"
    input.value = ""
    btnOk.textContent = "Criar"
  }
  document.getElementById("modalPasta").classList.remove("hidden")
  setTimeout(() => input.focus(), 40)
}

window.fecharModalPasta = () => document.getElementById("modalPasta").classList.add("hidden")

document.getElementById("btnConfirmarPasta").addEventListener("click", () => {
  const nome = document.getElementById("inputNomePasta").value.trim()
  if (!nome) return
  const m = MODOS[_modalEditModo]
  if (_modalEditIdx !== null) {
    m.pastas[_modalEditIdx].nome = nome
  } else {
    m.pastas.push({ id: "p_" + Date.now(), nome })
    m.pastasAbertas.add(m.pastas[m.pastas.length - 1].id)
  }
  // Bug #26: renomear/criar pasta não salva fichas
  _salvarSoPastas(_modalEditModo)
  renderizar(_modalEditModo)
  fecharModalPasta()
})

document.getElementById("inputNomePasta").addEventListener("keydown", (e) => {
  if (e.key === "Enter")  document.getElementById("btnConfirmarPasta").click()
  if (e.key === "Escape") fecharModalPasta()
})

async function _excluirPasta(idx, pastaId, modo) {
  const m   = MODOS[modo]
  const nome = m.pastas[idx]?.nome || "esta pasta"
  const qtd  = m.fichas.filter(f => f.pastaId === pastaId).length
  const msg  = qtd > 0
    ? `Excluir a pasta "${nome}"?\nAs ${qtd} ficha(s) dentro dela ficarão sem pasta.`
    : `Excluir a pasta "${nome}"?`
  const confirmadoPasta = await _confirmar(msg)
  if (!confirmadoPasta) return
  m.fichas.forEach(f => { if (f.pastaId === pastaId) delete f.pastaId })
  m.pastas.splice(idx, 1)
  m.pastasAbertas.delete(pastaId)
  // Bug #26: só salva pastas
  _salvarSoPastas(modo)
  renderizar(modo)
}

function _renomearInline(el, idx, modo) {
  const input = document.createElement("input")
  input.className = "pasta-nome-input"
  input.value = MODOS[modo].pastas[idx].nome
  el.replaceWith(input)
  input.focus(); input.select()
  const commit = () => {
    const novo = input.value.trim()
    if (novo) { MODOS[modo].pastas[idx].nome = novo; _salvarSoPastas(modo) }
    renderizar(modo)
  }
  input.addEventListener("blur", commit)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit() }
    if (e.key === "Escape") renderizar(modo)
  })
}

// ── Login / Logout ─────────────────────────────────────────
function _atualizarUILogin() {
  const user = getUser()
  document.getElementById("btnLoginIndex").style.display  = user ? "none"        : "inline-flex"
  document.getElementById("btnLogoutIndex").style.display = user ? "inline-flex" : "none"
  document.getElementById("userInfoIndex").textContent    = user ? (user.displayName || user.email) : ""
}

window.fazerLogin  = () => loginGoogle().catch(() => toastErro("Erro ao fazer login."))
window.fazerLogout = () => logout()

// Bug #1/#5/#7/#22: ao logar, descarta cache e carrega EXCLUSIVAMENTE do Firebase
onLogin(async (user) => {
  _logado = true
  _atualizarUILogin()

  if (!estaConfigurado()) {
    toastAviso("Firebase não configurado — usando dados locais.")
    _carregarDoCache("player")
    _carregarDoCache("mestre")
    renderizar("player"); renderizar("mestre")
    return
  }

  toastInfo("Sincronizando com a nuvem...")
  _setSincronizando(true)

  let totalFichas = 0

  for (const modo of ["player", "mestre"]) {
    const m = MODOS[modo]

    // Bug #1/#22: limpa TUDO — não mescla com cache
    _limparModo(modo)

    // Carrega índice (metadados) — apenas para montar a lista de cards
    const indice = await carregarIndiceFichasFirestore(modo)
    if (indice !== null) {
      // Bug #5/#22: armazena como metadados explicitamente marcados
      // Os dados completos só são carregados ao abrir a ficha
      m.fichas = indice.map(meta => ({
        _soMetadados: true,  // flag que indica que não tem dados completos
        id: meta.id, nome: meta.nome ?? "Sem Nome",
        pastaId: meta.pastaId ?? null, nivel: meta.nivel ?? 1,
        racaId: meta.racaId ?? "", profissaoId: meta.profissaoId ?? "",
        pontos: { gastos: 0, total: 10 },
        imagemThumb: meta.imagemThumb ?? null,
        corTema:     meta.corTema     ?? "#3b82f6",
      }))
      totalFichas += m.fichas.length
    }

    // Carrega pastas
    const pastas = await carregarPastasFirestore(modo)
    if (pastas !== null) {
      m.pastas = pastas
      // Bug #28: abre apenas pastas que estavam abertas na última sessão
      const abertas = Storage.carregarPastasAbertas(modo)
      m.pastasAbertas = abertas ? new Set(abertas) : new Set(pastas.map(p => p.id))
    }

    renderizar(modo)
  }

  _setSincronizando(false)
  toastSucesso(`${user.displayName || "Jogador"} conectado! ${totalFichas} ficha(s) encontradas.`)
})

// Bug #7: ao deslogar, limpa tela e volta ao cache local
onLogout(() => {
  _logado = false
  _atualizarUILogin()
  // Limpa dados da nuvem da tela
  _limparModo("player")
  _limparModo("mestre")
  // Recarrega do cache local
  _carregarDoCache("player")
  _carregarDoCache("mestre")
  renderizar("player")
  renderizar("mestre")
  toastInfo("Desconectado. Exibindo dados locais.")
})

// ── Botões ─────────────────────────────────────────────────
document.getElementById("btnNova").addEventListener("click",           () => criarFicha(null, "player"))
document.getElementById("btnNovaPasta").addEventListener("click",      () => _abrirModal(null, "player"))
document.getElementById("btnNovaMestre").addEventListener("click",     () => criarFicha(null, "mestre"))
document.getElementById("btnNovaPastaMestre").addEventListener("click",() => _abrirModal(null, "mestre"))

document.getElementById("btnMigrar")?.addEventListener("click", () => {
  const result = Storage.migrarTudo()
  if (result.player.changed || result.mestre.changed) {
    for (const modo of ["player", "mestre"]) {
      if (result[modo].changed) {
        if (!_logado) { MODOS[modo].fichas = result[modo].fichas; renderizar(modo) }
      }
    }
    toastSucesso("Migração concluída! Todas as fichas agora têm ID único.")
  } else {
    toastInfo("Todas as fichas já estão atualizadas.")
  }
  document.getElementById("btnMigrar").style.display = "none"
})

// ── Botões de modo (evita onclick inline que quebra com módulos ES6) ──
document.getElementById("btnModoPlayer").addEventListener("click", () => setModo("player"))
document.getElementById("btnModoMestre").addEventListener("click", () => setModo("mestre"))

// ── Sistema de Viagem ──────────────────────────────────────
document.getElementById("btnGerarViagem").addEventListener("click", () => {
  const ambienteIdx = document.getElementById("viagemAmbiente").value
  const ritmoIdx    = +document.getElementById("viagemRitmo").value
  const porteIdx    = +document.getElementById("viagemPorte").value
  const estadoIdx   = +document.getElementById("viagemEstado").value

  const navIdx    = document.getElementById("viagemNavegador")?.value ?? "nenhum"
  const pilotoIdx = document.getElementById("viagemPiloto")?.value   ?? "nenhum"

  const opts = { ritmo: RITMOS[ritmoIdx], porte: PORTES[porteIdx], estado: ESTADOS_VEICULO[estadoIdx] }
  if (ambienteIdx !== "aleatorio") opts.ambiente = AMBIENTES[+ambienteIdx]
  if (navIdx    !== "nenhum") opts.testeNavegador = RESULTADOS_NAVEGADOR[+navIdx]
  if (pilotoIdx !== "nenhum") opts.testePiloto    = RESULTADOS_PILOTO[+pilotoIdx]

  _renderViagem(gerarViagem(opts))
})

function _nrCor(nr) { return nr<=1?"#22c55e":nr<=3?"#f59e0b":nr<=5?"#fb923c":"#ef4444" }
function _nrStr(nr) { return nr>=0?`+${nr}`:String(nr) }

function _renderViagem(r) {
  const el = document.getElementById("viagemResultado")
  el.classList.remove("hidden")
  const ambCor = r.ambiente.cor

  // ── Bloco de testes (navegador / piloto) ──
  let blocoTestes = ""

  if (r.testePiloto) {
    const cor = r.testePiloto.deltaNR > 0 ? "#ef4444" : "#22c55e"
    blocoTestes += `
      <div class="viagem-teste-bloco" style="border-color:${cor}40;background:${cor}08">
        <span class="viagem-teste-icone">🚢</span>
        <div>
          <strong style="color:${cor}">Piloto: ${r.testePiloto.label}</strong>
          <span style="color:${cor};font-weight:700;margin-left:8px">${_nrStr(r.testePiloto.deltaNR)} NR</span>
          <p style="margin:2px 0 0;font-size:11px;color:#94a3b8">${r.testePiloto.desc}</p>
        </div>
      </div>`
  }

  if (r.testeNavegador) {
    const cor = r.testeNavegador.rotasReais === 0 ? "#ef4444"
              : r.testeNavegador.rotasReais === 1 ? "#f59e0b" : "#22c55e"
    blocoTestes += `
      <div class="viagem-teste-bloco" style="border-color:${cor}40;background:${cor}08">
        <span class="viagem-teste-icone">🧭</span>
        <div>
          <strong style="color:${cor}">Navegador: ${r.testeNavegador.label}</strong>
          <p style="margin:2px 0 0;font-size:11px;color:#94a3b8">${r.testeNavegador.desc}</p>
        </div>
      </div>`
  }

  // ── Rotas ──
  const fracasso = r.testeNavegador?.rotasReais === 0

  // Gera HTML de uma rota individual
  function _htmlRota(ev, i, rota, opts = {}) {
    const c          = _nrCor(ev.nrTotal)
    const conhecida  = opts.conhecida  ?? false
    const ehFalsa    = opts.ehFalsa    ?? false
    const label      = opts.label      ?? `Rota ${i + 1}`

    const borderStyle = conhecida
      ? `border-color:#4ade80;box-shadow:0 0 0 1px #4ade8055`
      : ehFalsa
        ? `border-color:#f8717180`
        : `border-color:${c}60`

    let navBadge = ""
    if (r.testeNavegador) {
      if (ehFalsa) {
        navBadge = `<span class="viagem-nav-badge falsa">⚠️ Info Falsa</span>`
      } else if (conhecida) {
        navBadge = `<span class="viagem-nav-badge real">🧭 Conhecida</span>`
      } else if (!fracasso) {
        navBadge = `<span class="viagem-nav-badge desconhecida">🧭 Desconhecida</span>`
      }
    }

    return `<div class="viagem-rota" style="${borderStyle}">
      <div class="viagem-rota-header">
        <span class="viagem-rota-num">${label}</span>
        <span class="viagem-rota-tipo">${rota.icon} ${rota.nome}</span>
        <span class="viagem-nr-pill" style="background:${c}22;color:${c};border:1px solid ${c}55">NR ${_nrStr(ev.nrTotal)}</span>
        ${navBadge}
      </div>
      <p class="viagem-rota-desc">${rota.desc}</p>
      <div class="viagem-evento" style="border-left:3px solid ${ev.cor}">
        <span style="color:${ev.cor};font-weight:600">${ev.icon} Evento ${ev.tipo}</span>
        <span class="viagem-dado">🎲 D6: ${ev.dado}</span>
        <p>${ev.evento}</p>
      </div>
    </div>`
  }

  // Rotas reais do mestre (sempre as 3 verdadeiras)
  let htmlRotas = r.eventos.map((ev, i) =>
    _htmlRota(ev, i, ev.rota, { conhecida: ev.navegadorSabe === true })
  ).join("")

  // Se fracassou: adiciona bloco de INFORMAÇÃO FALSA abaixo das 3 rotas reais
  if (fracasso && r.rotasFalsas?.length) {
    htmlRotas += `
      <div class="viagem-fracasso-sep">
        <span>⚠️ Informação Falsa recebida pelo Navegador</span>
      </div>`
    r.rotasFalsas.forEach((rotaFalsa, i) => {
      htmlRotas += _htmlRota(r.eventos[i], i, rotaFalsa, {
        ehFalsa: true,
        label: `Falsa ${i + 1}`
      })
    })
  }

  el.innerHTML = `<div class="viagem-resultado-inner">
    <div class="viagem-bloco viagem-ambiente" style="border-color:${ambCor}40;background:${ambCor}10">
      <div class="viagem-bloco-header">
        <span class="viagem-bloco-icon">${r.ambiente.icon}</span>
        <div><strong>Ambiente: ${r.ambiente.nome}</strong>
        <span class="viagem-nr" style="color:${ambCor}">${_nrStr(r.ambiente.nr)} NR</span></div>
      </div>
      <p class="viagem-bloco-desc">${r.ambiente.desc}</p>
    </div>
    <div class="viagem-config-resumo">
      <span>🚢 ${r.porte.nome} (${_nrStr(r.porte.nr)})</span>
      <span>🔧 ${r.estado.nome} (${_nrStr(r.estado.nr)})</span>
      <span>💨 Ritmo ${r.ritmo.nome} (${_nrStr(r.ritmo.nr)})</span>
      ${r.deltaPiloto ? `<span>🚢 Piloto (${_nrStr(r.deltaPiloto)})</span>` : ""}
      <span>📊 NR Base: <strong style="color:${_nrCor(r.nrBase)}">${_nrStr(r.nrBase)}</strong></span>
    </div>
    ${blocoTestes ? `<div class="viagem-testes-area">${blocoTestes}</div>` : ""}
    <div class="viagem-rotas-titulo">🗺️ As 3 Rotas Possíveis</div>
    <div class="viagem-rotas">${htmlRotas}</div>
    <p class="viagem-nota">💡 Revele apenas o <em>tipo</em> da rota aos jogadores. O NR e o evento são informações do Mestre.</p>
  </div>`
}

// ── Init ───────────────────────────────────────────────────
Storage.migrarTudo()

// Bug #3: aguarda Firebase resolver o estado de auth antes de renderizar
await inicializarFirebase()
await aguardarAuth()   // <- key fix: não renderiza com getUser()=null prematuro

_atualizarUILogin()
_aplicarTema(modoAtivo)

// Bug #1: só carrega cache se NÃO estiver logado
if (!getUser()) {
  _carregarDoCache("player")
  _carregarDoCache("mestre")
}
// Se logado, onLogin já foi disparado e carregou do Firebase

renderizar("player")
renderizar("mestre")

const todasFichas = [...Storage.carregarFichas("player"), ...Storage.carregarFichas("mestre")]
const precisaMigrar = todasFichas.some(f => !f.id)
const btnMigrar = document.getElementById("btnMigrar")
if (btnMigrar) btnMigrar.style.display = precisaMigrar ? "inline-flex" : "none"