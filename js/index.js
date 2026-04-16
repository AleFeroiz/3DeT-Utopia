// ============================================================
//  js/index.js — Lógica da página inicial (Player + Mestre)
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"
import {
  inicializarFirebase, loginGoogle, logout, getUser,
  onLogin, onLogout, salvarFichasFirestore, carregarFichasFirestore, estaConfigurado
} from "./firebase.js"
import { toastSucesso, toastInfo, toastErro } from "./ui/uiToast.js"
import { gerarViagem, AMBIENTES, RITMOS, PORTES, ESTADOS_VEICULO } from "./viagem.js"

// ── Estado por modo ────────────────────────────────────────
const MODOS = {
  player: {
    fichas:       [],
    pastas:       [],
    pastasAbertas: new Set(),
    ids: {
      areaSemPasta: "areaSemPasta",
      listaPastas:  "listaPastas",
      btnNova:      "btnNova",
      btnNovaPasta: "btnNovaPasta",
    },
    storageKey: "player",
    firestoreKey: "fichas",           // chave atual compatível com código existente
    label: "player",
  },
  mestre: {
    fichas:       [],
    pastas:       [],
    pastasAbertas: new Set(),
    ids: {
      areaSemPasta: "areaSemPastaMestre",
      listaPastas:  "listaPastasMestre",
      btnNova:      "btnNovaMestre",
      btnNovaPasta: "btnNovaPastaMestre",
    },
    storageKey: "mestre",
    firestoreKey: "fichas_mestre",
    label: "mestre",
  },
}

let modoAtivo = localStorage.getItem("modoIndex") ?? "player"

// ── Carregar estado de cada modo ───────────────────────────
function _carregarModo(modo) {
  const m = MODOS[modo]
  m.fichas = Storage.carregarFichas(modo)
  m.pastas = Storage.carregarPastas(modo)
  m.pastasAbertas = new Set(m.pastas.map(p => p.id))
}

_carregarModo("player")
_carregarModo("mestre")

// ── Persistência ───────────────────────────────────────────
function salvar(modo) {
  const m = MODOS[modo]
  Storage.salvarFichas(m.fichas, modo)
  Storage.salvarPastas(m.pastas, modo)
  if (getUser() && estaConfigurado()) {
    salvarFichasFirestore(m.fichas, m.firestoreKey)
  }
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

  // Painel visibilidade
  document.getElementById("painelPlayer").classList.toggle("hidden",  isMestre)
  document.getElementById("painelMestre").classList.toggle("hidden", !isMestre)

  // Botões do toggle
  document.getElementById("btnModoPlayer").classList.toggle("active", !isMestre)
  document.getElementById("btnModoMestre").classList.toggle("active",  isMestre)

  // Textos do header
  document.getElementById("tituloSite").textContent   = isMestre ? "📖 Mesa do Mestre" : "⚓ 3DeT One Piece"
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

  const semPasta = m.fichas.map((f, i) => ({ f, i })).filter(({ f }) => !f.pastaId)

  if (!m.fichas.length) {
    area.innerHTML = `
      <div class="lista-vazia">
        <p>Nenhuma ficha criada ainda.</p>
        <p>Clique em <strong>+ Nova Ficha</strong> para começar!</p>
      </div>`
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
    semPasta.forEach(({ f, i }) => area.appendChild(_criarCard(f, i, modo)))
  }

  _bindDropZone(area, null, modo)
}

function _renderPastas(modo) {
  const m         = MODOS[modo]
  const container = document.getElementById(m.ids.listaPastas)
  if (!container) return
  container.innerHTML = ""

  m.pastas.forEach((pasta, pi) => {
    const fichasDaPasta = m.fichas.map((f, i) => ({ f, i })).filter(({ f }) => f.pastaId === pasta.id)
    const aberta = m.pastasAbertas.has(pasta.id)

    const bloco = document.createElement("div")
    bloco.className = "pasta-bloco"
    bloco.innerHTML = `
      <div class="pasta-header">
        <span class="pasta-toggle ${aberta ? "" : "fechada"}">▼</span>
        <span class="pasta-nome" title="Duplo clique para renomear">${pasta.nome}</span>
        <span class="pasta-count">${fichasDaPasta.length} ficha${fichasDaPasta.length !== 1 ? "s" : ""}</span>
        <div class="pasta-acoes">
          <button class="btn-nova-pasta">+ Ficha</button>
          <button class="btn-ren-pasta">✏️</button>
          <button class="btn-del-pasta">🗑️</button>
        </div>
      </div>
      <div class="pasta-conteudo drop-zone ${aberta ? "" : "fechada"}"></div>
    `

    const header   = bloco.querySelector(".pasta-header")
    const conteudo = bloco.querySelector(".pasta-conteudo")
    const nomeEl   = bloco.querySelector(".pasta-nome")

    if (fichasDaPasta.length === 0) {
      const vazia = document.createElement("div")
      vazia.className = "pasta-vazia"
      vazia.textContent = "Arraste fichas para cá ou use '+ Ficha'"
      conteudo.appendChild(vazia)
    } else {
      fichasDaPasta.forEach(({ f, i }) => conteudo.appendChild(_criarCard(f, i, modo)))
    }

    header.addEventListener("click", (e) => {
      if (e.target.closest(".pasta-acoes")) return
      if (m.pastasAbertas.has(pasta.id)) m.pastasAbertas.delete(pasta.id)
      else m.pastasAbertas.add(pasta.id)
      renderizar(modo)
    })

    nomeEl.addEventListener("dblclick", (e) => {
      e.stopPropagation()
      _renomearInline(nomeEl, pi, modo)
    })

    bloco.querySelector(".btn-nova-pasta").addEventListener("click", (e) => {
      e.stopPropagation(); criarFicha(pasta.id, modo)
    })
    bloco.querySelector(".btn-ren-pasta").addEventListener("click", (e) => {
      e.stopPropagation(); _abrirModal(pi, modo)
    })
    bloco.querySelector(".btn-del-pasta").addEventListener("click", (e) => {
      e.stopPropagation(); _excluirPasta(pi, pasta.id, modo)
    })

    _bindDropZone(conteudo, pasta.id, modo)
    container.appendChild(bloco)
  })
}

// ── Card ───────────────────────────────────────────────────
function _criarCard(f, index, modo) {
  const div = document.createElement("div")
  div.className = "ficha-card"
  div.draggable = true
  div.dataset.index = index

  const nivel  = f.nivel ?? 1
  const gastos = f.pontos?.gastos ?? 0
  const total  = f.pontos?.total  ?? 10

  div.innerHTML = `
    <div class="ficha-info">
      <strong class="ficha-nome">${f.nome || "Sem Nome"}</strong>
      <div class="ficha-meta">
        <span>⚔️ Nível ${nivel}</span>
        ${f.racaId      ? `<span>🧬 ${f.racaId}</span>`      : ""}
        ${f.profissaoId ? `<span>⚒️ ${f.profissaoId}</span>` : ""}
        <span>🎯 ${gastos}/${total} PT</span>
      </div>
    </div>
    <div class="ficha-acoes">
      <button class="btn btn-abrir"   title="Abrir ficha">Abrir</button>
      <button class="btn btn-dupl"    title="Duplicar ficha">⧉ Duplicar</button>
      <button class="btn btn-deletar" title="Excluir ficha">🗑️</button>
    </div>
  `

  div.querySelector(".btn-abrir").onclick   = (e) => { e.stopPropagation(); _abrirFicha(index, modo) }
  div.querySelector(".btn-dupl").onclick    = (e) => { e.stopPropagation(); _duplicarFicha(index, modo) }
  div.querySelector(".btn-deletar").onclick = (e) => { e.stopPropagation(); _deletarFicha(index, modo) }

  div.addEventListener("dragstart", (e) => {
    div.classList.add("dragging")
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
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
  el.addEventListener("dragover", (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    el.classList.add("dragover")
  })
  el.addEventListener("dragleave", (e) => {
    if (!el.contains(e.relatedTarget)) el.classList.remove("dragover")
  })
  el.addEventListener("drop", (e) => {
    e.preventDefault()
    el.classList.remove("dragover")
    const idx = parseInt(e.dataTransfer.getData("text/plain"), 10)
    const m   = MODOS[modo]
    if (isNaN(idx) || !m.fichas[idx]) return
    const jaEstaNaPasta = (m.fichas[idx].pastaId ?? null) === pastaId
    if (jaEstaNaPasta) return
    if (pastaId) m.fichas[idx].pastaId = pastaId
    else delete m.fichas[idx].pastaId
    salvar(modo); renderizar(modo)
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
  salvar(modo); renderizar(modo)
}

function _duplicarFicha(index, modo) {
  const m      = MODOS[modo]
  const copia  = JSON.parse(JSON.stringify(m.fichas[index]))
  copia.id     = crypto.randomUUID()  // cópia ganha id próprio
  copia.nome   = (m.fichas[index].nome || "Ficha") + " (cópia)"
  m.fichas.splice(index + 1, 0, copia)
  salvar(modo); renderizar(modo)
  toastSucesso(`"${copia.nome}" criada!`)
}

function _deletarFicha(index, modo) {
  const m    = MODOS[modo]
  const nome = m.fichas[index]?.nome || "esta ficha"
  if (confirm(`Excluir "${nome}"?\nEsta ação não pode ser desfeita.`)) {
    m.fichas.splice(index, 1)
    salvar(modo); renderizar(modo)
  }
}

function _abrirFicha(index, modo) {
  const m     = MODOS[modo]
  const ficha = m.fichas[index]
  if (!ficha) return
  if (ficha.id) {
    // Novo sistema: navega pela URL com id — cada aba mantém seu próprio estado
    window.location.href = `ficha.html?id=${ficha.id}&modo=${modo}`
  } else {
    // Legado: sem id, usa índice
    Storage.setIndiceFichaAtual(index, modo)
    window.location.href = "ficha.html"
  }
}

// ── Ações pastas ───────────────────────────────────────────
let _modalEditIdx  = null
let _modalEditModo = "player"

function _abrirModal(editIdx = null, modo = modoAtivo) {
  _modalEditIdx  = editIdx
  _modalEditModo = modo
  const titulo = document.getElementById("modalPastaTitulo")
  const input  = document.getElementById("inputNomePasta")
  const btnOk  = document.getElementById("btnConfirmarPasta")

  if (editIdx !== null) {
    titulo.textContent = "✏️ Renomear Pasta"
    input.value        = MODOS[modo].pastas[editIdx].nome
    btnOk.textContent  = "Salvar"
  } else {
    titulo.textContent = "📁 Nova Pasta"
    input.value        = ""
    btnOk.textContent  = "Criar"
  }

  document.getElementById("modalPasta").classList.remove("hidden")
  setTimeout(() => input.focus(), 40)
}

window.fecharModalPasta = () => {
  document.getElementById("modalPasta").classList.add("hidden")
}

document.getElementById("btnConfirmarPasta").addEventListener("click", () => {
  const nome = document.getElementById("inputNomePasta").value.trim()
  if (!nome) return
  const m = MODOS[_modalEditModo]
  if (_modalEditIdx !== null) {
    m.pastas[_modalEditIdx].nome = nome
  } else {
    const id = "p_" + Date.now()
    m.pastas.push({ id, nome })
    m.pastasAbertas.add(id)
  }
  salvar(_modalEditModo); renderizar(_modalEditModo); fecharModalPasta()
})

document.getElementById("inputNomePasta").addEventListener("keydown", (e) => {
  if (e.key === "Enter")  document.getElementById("btnConfirmarPasta").click()
  if (e.key === "Escape") fecharModalPasta()
})

function _excluirPasta(idx, pastaId, modo) {
  const m    = MODOS[modo]
  const nome = m.pastas[idx]?.nome || "esta pasta"
  const qtd  = m.fichas.filter(f => f.pastaId === pastaId).length
  const msg  = qtd > 0
    ? `Excluir a pasta "${nome}"?\nAs ${qtd} ficha(s) dentro dela ficarão sem pasta.`
    : `Excluir a pasta "${nome}"?`

  if (confirm(msg)) {
    m.fichas.forEach(f => { if (f.pastaId === pastaId) delete f.pastaId })
    m.pastas.splice(idx, 1)
    m.pastasAbertas.delete(pastaId)
    salvar(modo); renderizar(modo)
  }
}

function _renomearInline(el, idx, modo) {
  const input = document.createElement("input")
  input.className = "pasta-nome-input"
  input.value     = MODOS[modo].pastas[idx].nome
  el.replaceWith(input)
  input.focus(); input.select()

  const commit = () => {
    const novo = input.value.trim()
    if (novo) { MODOS[modo].pastas[idx].nome = novo; salvar(modo) }
    renderizar(modo)
  }
  input.addEventListener("blur",    commit)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")  { e.preventDefault(); commit() }
    if (e.key === "Escape") renderizar(modo)
  })
}

// ── Login ──────────────────────────────────────────────────
function _atualizarUILogin() {
  const user = getUser()
  document.getElementById("btnLoginIndex").style.display  = user ? "none"        : "inline-flex"
  document.getElementById("btnLogoutIndex").style.display = user ? "inline-flex" : "none"
  document.getElementById("userInfoIndex").textContent    = user ? (user.displayName || user.email) : ""
}

window.fazerLogin  = () => loginGoogle().catch(() => toastErro("Erro ao fazer login."))
window.fazerLogout = () => logout()

onLogin(async (user) => {
  _atualizarUILogin()
  toastSucesso(`Bem-vindo, ${user.displayName || "jogador"}!`)
  if (estaConfigurado()) {
    const cloud = await carregarFichasFirestore()
    if (cloud !== null) {
      MODOS.player.fichas = cloud
      Storage.salvarFichas(cloud, "player")
      renderizar("player")
      toastInfo(cloud.length > 0 ? "Fichas sincronizadas da nuvem." : "Nuvem sincronizada.")
    }
  }
})
onLogout(() => _atualizarUILogin())

// ── Botões ─────────────────────────────────────────────────
document.getElementById("btnNova").addEventListener("click",           () => criarFicha(null, "player"))
document.getElementById("btnNovaPasta").addEventListener("click",      () => _abrirModal(null, "player"))
document.getElementById("btnNovaMestre").addEventListener("click",     () => criarFicha(null, "mestre"))
document.getElementById("btnNovaPastaMestre").addEventListener("click",() => _abrirModal(null, "mestre"))

// Botão de migração de dados
document.getElementById("btnMigrar")?.addEventListener("click", () => {
  const result = Storage.migrarTudo()
  const total  = MODOS.player.fichas.length + MODOS.mestre.fichas.length
  let migradas = 0
  // Recarrega fichas migradas na memória
  for (const modo of ["player", "mestre"]) {
    const { fichas, changed } = result[modo]
    if (changed) {
      MODOS[modo].fichas = fichas
      migradas += fichas.filter(f => f.id).length
      renderizar(modo)
    }
  }
  if (result.player.changed || result.mestre.changed) {
    toastSucesso(`Migração concluída! ${total} ficha(s) agora com ID único.`)
    // Oculta botão após migrar
    document.getElementById("btnMigrar").style.display = "none"
  } else {
    toastInfo("Todas as fichas já estão atualizadas.")
    document.getElementById("btnMigrar").style.display = "none"
  }
})

// ── Sistema de Viagem ──────────────────────────────────────
document.getElementById("btnGerarViagem").addEventListener("click", () => {
  const ambienteIdx = document.getElementById("viagemAmbiente").value
  const ritmoIdx    = +document.getElementById("viagemRitmo").value
  const porteIdx    = +document.getElementById("viagemPorte").value
  const estadoIdx   = +document.getElementById("viagemEstado").value

  const opts = {
    ritmo:  RITMOS[ritmoIdx],
    porte:  PORTES[porteIdx],
    estado: ESTADOS_VEICULO[estadoIdx],
  }
  if (ambienteIdx !== "aleatorio") opts.ambiente = AMBIENTES[+ambienteIdx]

  const resultado = gerarViagem(opts)
  _renderViagem(resultado)
})

function _nrCor(nr) {
  if (nr <= 1)  return "#22c55e"
  if (nr <= 3)  return "#f59e0b"
  if (nr <= 5)  return "#fb923c"
  return "#ef4444"
}

function _nrStr(nr) { return nr >= 0 ? `+${nr}` : String(nr) }

function _renderViagem(r) {
  const el = document.getElementById("viagemResultado")
  el.classList.remove("hidden")

  // Ambiente
  const ambCor = r.ambiente.cor
  const ambHTML = `
    <div class="viagem-bloco viagem-ambiente" style="border-color:${ambCor}40;background:${ambCor}10">
      <div class="viagem-bloco-header">
        <span class="viagem-bloco-icon">${r.ambiente.icon}</span>
        <div>
          <strong>Ambiente: ${r.ambiente.nome}</strong>
          <span class="viagem-nr" style="color:${ambCor}">${_nrStr(r.ambiente.nr)} NR</span>
        </div>
      </div>
      <p class="viagem-bloco-desc">${r.ambiente.desc}</p>
    </div>`

  // Config resumida
  const configHTML = `
    <div class="viagem-config-resumo">
      <span>🚢 ${r.porte.nome} (${_nrStr(r.porte.nr)})</span>
      <span>🔧 ${r.estado.nome} (${_nrStr(r.estado.nr)})</span>
      <span>💨 Ritmo ${r.ritmo.nome} (${_nrStr(r.ritmo.nr)})</span>
      <span>📊 NR Base: <strong style="color:${_nrCor(r.nrBase)}">${_nrStr(r.nrBase)}</strong></span>
    </div>`

  // Rotas
  const rotasHTML = r.eventos.map((ev, i) => {
    const rotaCor = _nrCor(ev.nrTotal)
    return `
      <div class="viagem-rota" style="border-color:${rotaCor}60">
        <div class="viagem-rota-header">
          <span class="viagem-rota-num">Rota ${i + 1}</span>
          <span class="viagem-rota-tipo">${ev.rota.icon} ${ev.rota.nome}</span>
          <span class="viagem-nr-pill" style="background:${rotaCor}22;color:${rotaCor};border:1px solid ${rotaCor}55">
            NR ${_nrStr(ev.nrTotal)}
          </span>
        </div>
        <p class="viagem-rota-desc">${ev.rota.desc}</p>
        <div class="viagem-evento" style="border-left:3px solid ${ev.cor}">
          <span style="color:${ev.cor};font-weight:600">${ev.icon} Evento ${ev.tipo}</span>
          <span class="viagem-dado">🎲 D6: ${ev.dado}</span>
          <p>${ev.evento}</p>
        </div>
      </div>`
  }).join("")

  el.innerHTML = `
    <div class="viagem-resultado-inner">
      ${ambHTML}
      ${configHTML}
      <div class="viagem-rotas-titulo">🗺️ As 3 Rotas Possíveis</div>
      <div class="viagem-rotas">${rotasHTML}</div>
      <p class="viagem-nota">💡 Revele apenas o <em>tipo</em> da rota aos jogadores. O NR e o evento são informações do Mestre.</p>
    </div>`
}

// ── Init ───────────────────────────────────────────────────
// Migração silenciosa: garante que todas as fichas existentes têm id UUID
Storage.migrarTudo()

await inicializarFirebase()
_atualizarUILogin()
_aplicarTema(modoAtivo)
renderizar("player")
renderizar("mestre")

// Mostra botão de migração só se existirem fichas antigas sem id
const todasFichas = [...Storage.carregarFichas("player"), ...Storage.carregarFichas("mestre")]
const precisaMigrar = todasFichas.some(f => !f.id)
const btnMigrar = document.getElementById("btnMigrar")
if (btnMigrar) btnMigrar.style.display = precisaMigrar ? "inline-flex" : "none"
