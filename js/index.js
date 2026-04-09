// ============================================================
//  js/index.js — Lógica da página inicial (pastas + fichas)
//  NÃO toca em nenhum arquivo de ficha interna.
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"
import {
  inicializarFirebase, loginGoogle, logout, getUser,
  onLogin, onLogout, salvarFichasFirestore, carregarFichasFirestore, estaConfigurado
} from "./firebase.js"
import { toastSucesso, toastInfo, toastErro } from "./ui/uiToast.js"

// ── Estado ────────────────────────────────────────────────
let fichas = Storage.carregarFichas()
let pastas = Storage.carregarPastas()
// IDs das pastas abertas (persistido apenas em memória)
let pastasAbertas = new Set(pastas.map(p => p.id))

// ── Persistência ──────────────────────────────────────────
function salvar() {
  Storage.salvarFichas(fichas)
  Storage.salvarPastas(pastas)
  if (getUser() && estaConfigurado()) salvarFichasFirestore(fichas)
}

// ── Render ────────────────────────────────────────────────
function renderizar() {
  _renderSemPasta()
  _renderPastas()
}

function _renderSemPasta() {
  const area = document.getElementById("areaSemPasta")
  area.innerHTML = ""

  const semPasta = fichas.map((f, i) => ({ f, i })).filter(({ f }) => !f.pastaId)

  if (!fichas.length) {
    area.innerHTML = `
      <div class="lista-vazia">
        <p>Nenhuma ficha criada ainda.</p>
        <p>Clique em <strong>+ Nova Ficha</strong> para começar!</p>
      </div>`
    _bindDropZone(area, null)
    return
  }

  if (semPasta.length > 0) {
    if (pastas.length > 0) {
      const label = document.createElement("div")
      label.className = "area-sem-pasta-label"
      label.textContent = "Sem pasta"
      area.appendChild(label)
    }
    semPasta.forEach(({ f, i }) => area.appendChild(_criarCard(f, i)))
  }

  _bindDropZone(area, null)
}

function _renderPastas() {
  const container = document.getElementById("listaPastas")
  container.innerHTML = ""

  pastas.forEach((pasta, pi) => {
    const fichasDaPasta = fichas.map((f, i) => ({ f, i })).filter(({ f }) => f.pastaId === pasta.id)
    const aberta = pastasAbertas.has(pasta.id)

    const bloco = document.createElement("div")
    bloco.className = "pasta-bloco"
    bloco.innerHTML = `
      <div class="pasta-header">
        <span class="pasta-toggle ${aberta ? "" : "fechada"}">▼</span>
        <span class="pasta-nome" title="Duplo clique para renomear">${pasta.nome}</span>
        <span class="pasta-count">${fichasDaPasta.length} ficha${fichasDaPasta.length !== 1 ? "s" : ""}</span>
        <div class="pasta-acoes" id="pasta-acoes-${pasta.id}">
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

    // Fichas dentro
    if (fichasDaPasta.length === 0) {
      const vazia = document.createElement("div")
      vazia.className = "pasta-vazia"
      vazia.textContent = "Arraste fichas para cá ou use '+ Ficha'"
      conteudo.appendChild(vazia)
    } else {
      fichasDaPasta.forEach(({ f, i }) => conteudo.appendChild(_criarCard(f, i)))
    }

    // Toggle abrir/fechar
    header.addEventListener("click", (e) => {
      if (e.target.closest(".pasta-acoes")) return
      if (pastasAbertas.has(pasta.id)) pastasAbertas.delete(pasta.id)
      else pastasAbertas.add(pasta.id)
      renderizar()
    })

    // Renomear inline (duplo clique no nome)
    nomeEl.addEventListener("dblclick", (e) => {
      e.stopPropagation()
      _renomearInline(nomeEl, pi)
    })

    // Botões da pasta
    bloco.querySelector(".btn-nova-pasta").addEventListener("click", (e) => {
      e.stopPropagation(); criarFicha(pasta.id)
    })
    bloco.querySelector(".btn-ren-pasta").addEventListener("click", (e) => {
      e.stopPropagation(); _abrirModal(pi)
    })
    bloco.querySelector(".btn-del-pasta").addEventListener("click", (e) => {
      e.stopPropagation(); _excluirPasta(pi, pasta.id)
    })

    _bindDropZone(conteudo, pasta.id)
    container.appendChild(bloco)
  })
}

// ── Card de ficha ─────────────────────────────────────────
function _criarCard(f, index) {
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
        ${f.racaId     ? `<span>🧬 ${f.racaId}</span>`     : ""}
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

  div.querySelector(".btn-abrir").onclick   = (e) => { e.stopPropagation(); _abrirFicha(index) }
  div.querySelector(".btn-dupl").onclick    = (e) => { e.stopPropagation(); _duplicarFicha(index) }
  div.querySelector(".btn-deletar").onclick = (e) => { e.stopPropagation(); _deletarFicha(index) }

  // Drag & Drop
  div.addEventListener("dragstart", (e) => {
    div.classList.add("dragging")
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  })
  div.addEventListener("dragend", () => {
    div.classList.remove("dragging")
    document.querySelectorAll(".dragover").forEach(el => el.classList.remove("dragover"))
  })

  return div
}

// ── Drop zones ────────────────────────────────────────────
function _bindDropZone(el, pastaId) {
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
    if (isNaN(idx) || !fichas[idx]) return
    const jaEstaNaPasta = (fichas[idx].pastaId ?? null) === pastaId
    if (jaEstaNaPasta) return
    if (pastaId) fichas[idx].pastaId = pastaId
    else delete fichas[idx].pastaId
    salvar(); renderizar()
  })
}

// ── Ações de fichas ───────────────────────────────────────
function criarFicha(pastaId = null) {
  const nova = Ficha.nova().toJSON()
  if (pastaId) nova.pastaId = pastaId
  fichas.push(nova)
  // Garante que a pasta de destino está aberta
  if (pastaId) pastasAbertas.add(pastaId)
  salvar(); renderizar()
}

function _duplicarFicha(index) {
  const original = fichas[index]
  const copia    = JSON.parse(JSON.stringify(original))
  copia.nome     = (original.nome || "Ficha") + " (cópia)"
  fichas.splice(index + 1, 0, copia)
  salvar(); renderizar()
  toastSucesso(`"${copia.nome}" criada!`)
}

function _deletarFicha(index) {
  const nome = fichas[index]?.nome || "esta ficha"
  if (confirm(`Excluir "${nome}"?\nEsta ação não pode ser desfeita.`)) {
    fichas.splice(index, 1)
    salvar(); renderizar()
  }
}

function _abrirFicha(index) {
  Storage.setIndiceFichaAtual(index)
  window.location.href = "ficha.html"
}

// ── Ações de pastas ───────────────────────────────────────
let _modalEditIdx = null

function _abrirModal(editIdx = null) {
  _modalEditIdx = editIdx
  const titulo = document.getElementById("modalPastaTitulo")
  const input  = document.getElementById("inputNomePasta")
  const btnOk  = document.getElementById("btnConfirmarPasta")

  if (editIdx !== null) {
    titulo.textContent = "✏️ Renomear Pasta"
    input.value        = pastas[editIdx].nome
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

  if (_modalEditIdx !== null) {
    pastas[_modalEditIdx].nome = nome
  } else {
    const id = "p_" + Date.now()
    pastas.push({ id, nome })
    pastasAbertas.add(id)
  }
  salvar(); renderizar(); fecharModalPasta()
})

document.getElementById("inputNomePasta").addEventListener("keydown", (e) => {
  if (e.key === "Enter")  document.getElementById("btnConfirmarPasta").click()
  if (e.key === "Escape") fecharModalPasta()
})

function _excluirPasta(idx, pastaId) {
  const nome    = pastas[idx]?.nome || "esta pasta"
  const qtd     = fichas.filter(f => f.pastaId === pastaId).length
  const msg     = qtd > 0
    ? `Excluir a pasta "${nome}"?\nAs ${qtd} ficha(s) dentro dela ficarão sem pasta.`
    : `Excluir a pasta "${nome}"?`

  if (confirm(msg)) {
    fichas.forEach(f => { if (f.pastaId === pastaId) delete f.pastaId })
    pastas.splice(idx, 1)
    pastasAbertas.delete(pastaId)
    salvar(); renderizar()
  }
}

function _renomearInline(el, idx) {
  const input = document.createElement("input")
  input.className = "pasta-nome-input"
  input.value     = pastas[idx].nome
  el.replaceWith(input)
  input.focus(); input.select()

  const commit = () => {
    const novo = input.value.trim()
    if (novo) { pastas[idx].nome = novo; salvar() }
    renderizar()
  }
  input.addEventListener("blur",    commit)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")  { e.preventDefault(); commit() }
    if (e.key === "Escape") renderizar()
  })
}

// ── Login ─────────────────────────────────────────────────
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
      fichas = cloud
      Storage.salvarFichas(fichas)
      renderizar()
      toastInfo(cloud.length > 0 ? "Fichas sincronizadas da nuvem." : "Nuvem sincronizada.")
    }
  }
})
onLogout(() => _atualizarUILogin())

// ── Init ──────────────────────────────────────────────────
document.getElementById("btnNova").addEventListener("click",      () => criarFicha())
document.getElementById("btnNovaPasta").addEventListener("click", () => _abrirModal())

await inicializarFirebase()
_atualizarUILogin()
renderizar()
