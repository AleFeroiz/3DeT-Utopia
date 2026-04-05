// ============================================================
//  app.js — Ponto de entrada da ficha.html
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"

import { sincronizarAtributosParaFicha, renderAtributos, renderStatus, renderPontos, atualizarBarras } from "./ui/uiAtributos.js"
import { renderElementos, renderPericias } from "./ui/uiElementos.js"
import {
  registrarCallbacks, abrirListaLivro, abrirCriarElemento, confirmarCriacaoElemento,
  abrirCriarFonte, atualizarCustoFonte, atualizarSubtipoFonte, confirmarSalvarFonte,
  abrirCriarCaracteristica, atualizarEscala, confirmarCriarCaracteristica,
  renderCaracteristicasFonte, trocarAbaCarac, fecharModal, atualizarPreviewCarac
} from "./ui/uiModal.js"
import {
  registrarCallbackRacaProf, renderSidebarRacaProf,
  renderAbaRaca, renderAbaProfissao,
  abrirModalRaca, abrirModalProfissao
} from "./ui/uiRacaProfissao.js"
import { toastErro, toastSucesso, toastAviso, toastInfo } from "./ui/uiToast.js"
import { inicializarFirebase, loginGoogle, logout, getUser, onLogin, onLogout,
         salvarFichasFirestore, carregarFichasFirestore, estaConfigurado } from "./firebase.js"

// ─────────────────────────────────────────────────────────
let ficha = null

// ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

  const dados = Storage.carregarFichaAtual()
  ficha = dados ? Ficha.fromJSON(dados.ficha) : Ficha.nova()
  ficha.calcularStatus()
  ficha.calcularPontos()

  registrarCallbacks({
    onSalvarElemento: (elemento) => {
      if (elemento) ficha.adicionarElemento(elemento)
      renderTudo(); salvar()
    },
    onSalvarFonte: (fonte, editandoId) => {
      if (editandoId) {
        const idx = ficha.elementos.findIndex(e => e.id === editandoId)
        if (idx !== -1) ficha.elementos[idx] = fonte
        ficha.calcularPontos()
      } else {
        ficha.adicionarElemento(fonte)
      }
      renderTudo(); salvar()
      toastSucesso(editandoId ? "Fonte atualizada!" : "Fonte criada!")
    },
    getFicha: () => ficha
  })

  registrarCallbackRacaProf((dados) => {
    Object.assign(ficha, dados)
    renderTudo(); salvar()
  })

  expor()
  renderTudo()
  _bindStatusInputs()
  _bindNomeEditavel()

  // Firebase
  await inicializarFirebase()
  _atualizarUILogin()
})

// ─────────────────────────────────────────────────────────
//  RENDER CENTRAL
// ─────────────────────────────────────────────────────────
function renderTudo() {
  renderAtributos(ficha)
  renderStatus(ficha)
  renderPontos(ficha)
  _renderNivel()
  renderSidebarRacaProf(ficha)
  renderAbaRaca(ficha)
  renderAbaProfissao(ficha)
  renderPericias(ficha,
    (id) => { ficha.togglePericia(id); renderPericias(ficha, ...arguments); renderPontos(ficha); salvar() },
    (id) => {
      const res = ficha.toggleMaestria(id)
      if (!res.ok) { toastAviso(res.motivo); return }
      renderPericias(ficha, ...arguments); renderPontos(ficha); salvar()
      toastSucesso(ficha.maestrias[id] ? "Maestria aplicada!" : "Maestria removida.")
    }
  )
  renderElementos(ficha, {
    onEditar:       (id) => { const el = ficha.encontrarElemento(id); if (el) abrirCriarElemento(el.tipo, el) },
    onRemover:      (id) => { ficha.removerElemento(id); renderTudo(); salvar() },
    onEditarFonte:  (id) => { const f = ficha.encontrarElemento(id); if (f) abrirCriarFonte(f) },
    onExpandirFonte:(id) => { const f = ficha.encontrarElemento(id); if (f) _abrirExpandirFonte(f) }
  })
  _atualizarUILogin()
}

function _renderNivel() {
  const el = document.getElementById("nivelAtual")
  if (el) el.textContent = ficha.nivel
  const info = document.getElementById("nivelInfo")
  if (info) {
    const d = ficha.dadosNivel
    info.textContent = `Escala máx: ${d.escalaMax} | Maestrias: ${ficha.totalMaestrias}/${d.maestriaLimite}`
  }
  const recomp = document.getElementById("nivelRecompensa")
  if (recomp) {
    const d = ficha.dadosNivel
    recomp.textContent = d.recompensa || ""
    recomp.style.display = d.recompensa ? "block" : "none"
  }
}

// ─────────────────────────────────────────────────────────
//  PERSISTÊNCIA
// ─────────────────────────────────────────────────────────
function salvar() {
  Storage.salvarFichaAtual(ficha.toJSON())
  // Sync Firebase se logado
  if (getUser() && estaConfigurado()) {
    const fichas = Storage.carregarFichas()
    salvarFichasFirestore(fichas)
  }
}

// ─────────────────────────────────────────────────────────
//  NOME EDITÁVEL
// ─────────────────────────────────────────────────────────
function _bindNomeEditavel() {
  const el = document.getElementById("nomeFicha")
  if (!el) return
  el.textContent = ficha.nome
  el.addEventListener("blur", () => {
    ficha.nome = el.textContent.trim() || "Nova Ficha"
    el.textContent = ficha.nome
    salvar()
  })
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); el.blur() }
  })
}

// ─────────────────────────────────────────────────────────
//  STATUS INPUTS
// ─────────────────────────────────────────────────────────
function _bindStatusInputs() {
  // Bind atual inputs
  const bindAtual = (id, chave) => {
    const el = document.getElementById(id)
    if (!el) return
    el.oninput = () => {
      ficha.status[chave].atual = +el.value || 0
      atualizarBarras(ficha); salvar()
    }
  }
  bindAtual("paAtual", "pa"); bindAtual("pmAtual", "pm"); bindAtual("pvAtual", "pv")

  // Bind max editable spans — sistema de OFFSET: finalMax = auto + offset
  const bindMax = (id, chave) => {
    const el = document.getElementById(id)
    if (!el) return
    el.addEventListener("blur", () => {
      const val = parseInt(el.innerText.trim(), 10)
      if (!isNaN(val) && val >= 0) {
        ficha.setMaxManual(chave, val)   // calcula e guarda o offset
        atualizarBarras(ficha); salvar()
      } else {
        el.innerText = ficha.status[chave].max  // reverte se inválido
      }
    })
    el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.blur() } })
    el.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }
  bindMax("paMax", "pa"); bindMax("pmMax", "pm"); bindMax("pvMax", "pv")

  // Bind pontos total — sistema de OFFSET: total = ptTotal(nível) + offsetTotal
  const totalEl = document.getElementById("total")
  if (totalEl) {
    totalEl.addEventListener("blur", () => {
      const val = parseInt(totalEl.innerText.trim(), 10)
      if (!isNaN(val) && val >= 0) {
        ficha.setTotalManual(val)   // calcula e guarda offsetTotal
        renderPontos(ficha); salvar()
      } else {
        totalEl.innerText = ficha.pontos.total
      }
    })
    totalEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); totalEl.blur() } })
    totalEl.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }
}

// ─────────────────────────────────────────────────────────
//  EXPANDIR FONTE
// ─────────────────────────────────────────────────────────
const _LABELS_ESCOLHAS = {
  potencia: 'Potência', pressao: 'Pressão', execucao: 'Execução',
  alcance: 'Alcance', duracao: 'Duração', area: 'Área',
  alvos: 'Alvos Adicionais', condicoes: 'Condições', descontos: 'Descontos'
}
function _resumoEscolhas(escolhas) {
  if (!escolhas) return {}
  const result = {}
  for (const [chave, lista] of Object.entries(escolhas)) {
    if (!lista?.length) continue
    const cnt = {}
    for (const item of lista) {
      const k = item.nome ?? (item.valor !== undefined ? ('+' + item.valor) : '?')
      cnt[k] = (cnt[k] ?? 0) + 1
    }
    result[_LABELS_ESCOLHAS[chave] ?? chave] = Object.entries(cnt)
      .map(([n, q]) => q > 1 ? (n + ' x' + q) : n).join(', ')
  }
  return result
}
function _cardCaractExpandir(c) {
  const PC_POR_ESCALA = {1:1,2:2,3:3,4:4,5:5,6:6}
  const resumo = _resumoEscolhas(c.escolhas)
  const rows = Object.entries(resumo)
    .map(([l,v]) => '<div class="carac-resumo-row"><span class="carac-resumo-label">' + l + ':</span> <span>' + v + '</span></div>')
    .join('')
  const pc = PC_POR_ESCALA[c.escala] ?? c.escala
  return '<div class="card-info desbloqueado" style="margin-bottom:10px">' +
    '<div class="carac-header-row">' +
      '<strong>⚡ ' + c.nome + '</strong>' +
      '<div class="carac-badges">' +
        '<span>Escala ' + c.escala + '</span>' +
        '<span>' + pc + ' PC</span>' +
        '<span>Orç. ' + c.custo + '</span>' +
        '<span>' + c.custoPM + ' PM</span>' +
      '</div>' +
    '</div>' +
    (rows ? '<div class="carac-resumo">' + rows + '</div>' : '') +
    (c.descricao ? '<p class="carac-descricao">' + c.descricao + '</p>' : '') +
  '</div>'
}
function _abrirExpandirFonte(fonte) {
  const modal   = document.getElementById("modalExpandirFonte")
  const content = document.getElementById("expandirFonteContent")
  if (!modal || !content) return

  const PC_POR_ESCALA = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6 }

  let passivosHTML = ""
  if (fonte.subtipo === "zoan" && fonte.passivos?.zoan_resistencias?.length) {
    passivosHTML += `<div class="passivo-tag">🛡️ Resistente a: <strong>${fonte.passivos.zoan_resistencias.join(", ")}</strong></div>`
  }
  if (fonte.subtipo === "logia" && fonte.passivos?.elemento) {
    passivosHTML += `<div class="passivo-tag">🌊 Elemento: <strong>${fonte.passivos.elemento}</strong></div>`
    passivosHTML += `<div class="passivo-tag">✨ Imune a danos mundanos (exceto Haki)</div>`
  }

  const caracts = fonte.caracteristicas.length
    ? fonte.caracteristicas.map(c => _cardCaractExpandir(c)).join("")
    : "<p style='opacity:0.4'>Nenhuma característica criada.</p>"

  content.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">🍎</span>
      <div>
        <h2>${fonte.nome}</h2>
        <span class="badge-subtipo">${fonte.subtipo}</span>
        ${fonte.tema ? `<p style="font-size:13px;opacity:0.6;margin-top:4px"><i>${fonte.tema}</i></p>` : ""}
      </div>
    </div>
    <div class="pcs-display" style="margin:12px 0">
      <span>PCs totais: <strong>${fonte.pcs}</strong></span>
      <span>Gastos: <strong>${fonte.pcsGastos ?? 0}</strong></span>
      <span>Restantes: <strong style="color:#22c55e">${fonte.pcsDisponiveis ?? fonte.pcs}</strong></span>
    </div>
    ${passivosHTML ? `<div style="margin-bottom:12px">${passivosHTML}</div>` : ""}
    <h3 style="margin-bottom:8px">⚡ Características</h3>
    ${caracts}
  `

  modal.classList.remove("hidden")
}

// ─────────────────────────────────────────────────────────
//  FIREBASE UI
// ─────────────────────────────────────────────────────────
function _atualizarUILogin() {
  const user = getUser()
  const btnLogin  = document.getElementById("btnLogin")
  const btnLogout = document.getElementById("btnLogout")
  const userInfo  = document.getElementById("userInfo")
  if (btnLogin)  btnLogin.style.display  = user ? "none" : "flex"
  if (btnLogout) btnLogout.style.display = user ? "flex" : "none"
  if (userInfo)  userInfo.textContent    = user ? user.displayName || user.email : ""
}

onLogin(() => { _atualizarUILogin(); toastSucesso("Login realizado!") })
onLogout(() => { _atualizarUILogin(); toastInfo("Você saiu.") })

// ─────────────────────────────────────────────────────────
//  EXPOSIÇÃO PARA HTML (type="module" tem escopo fechado)
// ─────────────────────────────────────────────────────────
function expor() {
  // Abas
  window.trocarAba = (i) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"))
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"))
    document.querySelectorAll(".tab")[i]?.classList.add("active")
    document.querySelectorAll(".section")[i]?.classList.add("active")
  }

  // Atributos
  window.atualizar = () => {
    sincronizarAtributosParaFicha(ficha)
    ficha.calcularStatus(); ficha.calcularPontos()
    renderStatus(ficha); renderPontos(ficha); salvar()
  }

  // Nível
  window.mudarNivel = (delta) => {
    ficha.setNivel(ficha.nivel + delta)
    renderTudo(); salvar()
    toastInfo(`Nível ${ficha.nivel} — ${ficha.dadosNivel.recompensa || "sem recompensa especial"}`)
  }

  // Elementos
  window.abrirLista    = (tipo) => abrirListaLivro(tipo)
  window.criarElemento = (tipo) => abrirCriarElemento(tipo)
  window.confirmarCriacao = () => { confirmarCriacaoElemento(); renderTudo(); salvar() }

  // Fontes
  window.criarFonte               = () => abrirCriarFonte(null)
  window.salvarFonte              = confirmarSalvarFonte
  window.atualizarCustoFonte      = atualizarCustoFonte
  window.atualizarSubtipoFonte    = atualizarSubtipoFonte
  window.abrirModalCaracteristica = () => abrirCriarCaracteristica(null)
  window.adicionarCaracteristica  = confirmarCriarCaracteristica
  window.atualizarEscala          = atualizarEscala

  // Abas característica
  window.trocarAbaCarac = trocarAbaCarac

  // Raça / Profissão
  window.abrirModalRaca      = () => abrirModalRaca(ficha)
  window.abrirModalProfissao = () => abrirModalProfissao(ficha)

  // Status arrows
  window.ajustarStatus = (chave, delta) => {
    const inputId = chave + 'Atual'
    const el = document.getElementById(inputId)
    if (!el) return
    const max = ficha.status[chave].max || 999
    const novo = Math.max(0, Math.min(max, (ficha.status[chave].atual || 0) + delta))
    ficha.status[chave].atual = novo
    el.value = novo
    atualizarBarras(ficha)
    salvar()
  }

  // Fechar modais
  window.fecharModal               = (id) => fecharModal(id)
  window.fecharModalCriar          = () => fecharModal("modalCriar")
  window.fecharModalFonte          = () => fecharModal("modalFonte")
  window.fecharModalCaracteristica = () => fecharModal("modalCaracteristica")
  window.fecharExpandirFonte       = () => fecharModal("modalExpandirFonte")
  window.fecharModalRaca           = () => fecharModal("modalEscolhaRaca")
  window.fecharModalProfissao      = () => fecharModal("modalEscolhaProfissao")

  // Firebase
  window.fazerLogin  = () => loginGoogle().catch(e => toastErro("Erro ao fazer login."))
  window.fazerLogout = () => logout()
}
