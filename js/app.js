// ============================================================
//  app.js — Ponto de entrada da ficha.html
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"

import { sincronizarAtributosParaFicha, renderAtributos, renderStatus, renderPontos, atualizarBarras } from "./ui/uiAtributos.js"
import { renderElementos, renderPericias, renderCaracteristicasIsoladas } from "./ui/uiElementos.js"
import {
  registrarCallbacks, abrirListaLivro, abrirCriarElemento, confirmarCriacaoElemento,
  abrirCriarFonte, atualizarCustoFonte, atualizarSubtipoFonte, confirmarSalvarFonte,
  abrirCriarCaracteristica, atualizarEscala, confirmarCriarCaracteristica,
  renderCaracteristicasFonte, trocarAbaCarac, fecharModal, atualizarPreviewCarac,
  registrarCallbackIsolada, abrirCriarCaracteristicaIsolada,
  atualizarEscalaIsolada, confirmarCaracIsolada,
  abrirLojinhaIsoladaModal, confirmarIsoladaLojinha, trocarAbaIso
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

  registrarCallbackIsolada((carac, editIndex) => {
    if (!ficha.caracteristicasIsoladas) ficha.caracteristicasIsoladas = []
    if (editIndex !== null && editIndex !== undefined) {
      ficha.caracteristicasIsoladas[editIndex] = carac
    } else {
      ficha.caracteristicasIsoladas.push(carac)
    }
    renderTudo(); salvar()
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
function _renderPericias() {
  renderPericias(ficha,
    (id) => { ficha.togglePericia(id); _renderPericias(); renderPontos(ficha); salvar() },
    (id) => {
      const res = ficha.toggleMaestria(id)
      if (!res.ok) { toastAviso(res.motivo); return }
      _renderPericias(); renderPontos(ficha); salvar()
      toastSucesso(ficha.maestrias[id] ? "Maestria aplicada! (2 PT)" : "Maestria removida.")
    }
  )
}

function renderTudo() {
  renderAtributos(ficha)
  renderStatus(ficha)
  renderPontos(ficha)
  _renderNivel()
  renderSidebarRacaProf(ficha)
  renderAbaRaca(ficha)
  renderAbaProfissao(ficha)
  const _onTogglePericia = (id) => {
    ficha.togglePericia(id)
    _renderPericias()
    renderPontos(ficha)
    salvar()
  }
  const _onToggleMaestria = (id) => {
    const res = ficha.toggleMaestria(id)
    if (!res.ok) { toastAviso(res.motivo); return }
    _renderPericias()
    renderPontos(ficha)
    salvar()
    toastSucesso(ficha.maestrias[id] ? "Maestria aplicada! (2 PT)" : "Maestria removida.")
  }
  renderPericias(ficha, _onTogglePericia, _onToggleMaestria)
  renderElementos(ficha, {
    onEditar:       (id) => { const el = ficha.encontrarElemento(id); if (el) abrirCriarElemento(el.tipo, el) },
    onRemover:      (id) => { ficha.removerElemento(id); renderTudo(); salvar() },
    onEditarFonte:  (id) => { const f = ficha.encontrarElemento(id); if (f) abrirCriarFonte(f) },
    onExpandirFonte:(id) => { const f = ficha.encontrarElemento(id); if (f) _abrirExpandirFonte(f) }
  })
  renderCaracteristicasIsoladas(ficha, {
    onEditar:  (i) => {
      const c = ficha.caracteristicasIsoladas?.[i]
      if (c) abrirCriarCaracteristicaIsolada(i, c)
    },
    onRemover: (i) => {
      ficha.caracteristicasIsoladas?.splice(i, 1)
      renderTudo(); salvar()
    }
  })
  _atualizarUILogin()
}

function _renderNivel() {
  const el = document.getElementById("nivelAtual")
  if (el) el.textContent = ficha.nivel

  const info = document.getElementById("nivelInfo")
  if (info) {
    const d = ficha.dadosNivel
    info.textContent = `Escala máx: ${d.escalaMax}`
  }

  const recomp = document.getElementById("nivelRecompensa")
  if (recomp) {
    const d = ficha.dadosNivel
    recomp.textContent = d.recompensa || ""
    recomp.style.display = d.recompensa ? "block" : "none"
  }

  // Maestria sidebar — editable spans
  const mAtual  = document.getElementById("maestriaAtual")
  const mLimite = document.getElementById("maestriaLimite")
  if (mAtual  && document.activeElement !== mAtual)  mAtual.innerText  = ficha.totalMaestrias
  if (mLimite && document.activeElement !== mLimite) {
    const offset = ficha.maestras?.offsetLimite ?? 0
    mLimite.innerText  = ficha.maestraLimite
    mLimite.style.color = offset !== 0 ? "#fbbf24" : ""
  }

  // Pontos offset hint
  const offEl = document.getElementById("pontosOffset")
  if (offEl) {
    const off = ficha.pontos.offsetTotal ?? 0
    offEl.textContent = off !== 0 ? `(base ${ficha.pontos.totalAuto} ${off > 0 ? "+" : ""}${off})` : ""
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

  // Bind "usado" (pontos gastos) — editável com offset
  const usadoEl = document.getElementById("usado")
  if (usadoEl) {
    usadoEl.addEventListener("blur", () => {
      const val = parseInt(usadoEl.innerText.trim(), 10)
      if (!isNaN(val) && val >= 0) {
        ficha.setGastosManual(val)
        renderPontos(ficha); salvar()
      } else {
        usadoEl.innerText = ficha.pontos.gastos
      }
    })
    usadoEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); usadoEl.blur() } })
    usadoEl.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }

  // Bind maestria atual (readonly display — não é editável diretamente, calculado)
  // Bind maestria LIMITE — offset sobre o automático do nível
  const mLimiteEl = document.getElementById("maestriaLimite")
  if (mLimiteEl) {
    mLimiteEl.addEventListener("blur", () => {
      const val = parseInt(mLimiteEl.innerText.trim(), 10)
      if (!isNaN(val) && val >= 0) {
        ficha.setMaestraLimiteManual(val)
        _renderNivel(); salvar()
      } else {
        mLimiteEl.innerText = ficha.maestraLimite
      }
    })
    mLimiteEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); mLimiteEl.blur() } })
    mLimiteEl.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }

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
  const BASES_PADRAO = {
    execucao: 'Padrão', alcance: 'Pessoal', duracao: 'Instantânea',
    area: '1 alvo', alvos: '1 alvo'
  }
  const result = {}
  const todasChaves = new Set([...Object.keys(escolhas), ...Object.keys(BASES_PADRAO)])
  for (const chave of todasChaves) {
    const lista = escolhas[chave] ?? []
    const itens = lista.filter(i => !i.gratuita)
    if (itens.length === 0) {
      if (BASES_PADRAO[chave]) result[_LABELS_ESCOLHAS[chave] ?? chave] = '<span style="opacity:0.45;font-style:italic">' + BASES_PADRAO[chave] + ' (padrão)</span>'
      continue
    }
    const cnt = {}
    let total = 0
    for (const item of itens) {
      const k = item.nome ?? (item.valor !== undefined ? ('+' + item.valor) : '?')
      cnt[k] = (cnt[k] ?? 0) + 1
      if (item.valor !== undefined) total += item.valor * 1
    }
    const partes = Object.entries(cnt).map(([n, q]) => q > 1 ? (n + ' ×' + q) : n).join(', ')
    const totalStr = total > 0 ? ' <span style="opacity:0.45">= ' + total + '</span>' : ''
    result[_LABELS_ESCOLHAS[chave] ?? chave] = partes + totalStr
  }
  return result
}
function _cardCaractExpandir(c) {
  const PC_POR_ESCALA = {1:1,2:2,3:3,4:4,5:5,6:6}
  const resumo = _resumoEscolhas(c.escolhas)
  const rows = Object.entries(resumo)
    .map(([l,v]) => '<div class="carac-resumo-row"><span class="carac-resumo-label">' + l + ':</span> <span>' + v + '</span></div>')
    .join('')
  const pc = c.gratuita ? '0 PC' : ((PC_POR_ESCALA[c.escala] ?? c.escala) + ' PC')
  const gratuitaBadge = c.gratuita
    ? ' <span style="font-size:10px;background:#14532d;color:#86efac;padding:1px 6px;border-radius:4px">GRÁTIS</span>'
    : ''
  return '<div class="card-info desbloqueado" style="margin-bottom:10px' + (c.gratuita ? ';border-color:#22c55e' : '') + '">' +
    '<div class="carac-header-row">' +
      '<strong>⚡ ' + c.nome + gratuitaBadge + '</strong>' +
      '<div class="carac-badges">' +
        '<span>Escala ' + c.escala + '</span>' +
        '<span>' + pc + '</span>' +
        (c.gratuita ? '' : '<span>Orç. ' + c.custo + '</span>') +
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
  window.criarFonte                     = () => abrirCriarFonte(null)
  window.criarCaracteristicaIsolada     = () => abrirCriarCaracteristicaIsolada(null, null)
  window.confirmarCaracIsolada          = confirmarCaracIsolada
  window.atualizarEscalaIsolada         = atualizarEscalaIsolada
  window.abrirLojinhaIsolada            = () => abrirLojinhaIsoladaModal()
  window.confirmarIsoladaLojinha        = confirmarIsoladaLojinha
  window.fecharIsoladaLojinha           = () => fecharModal("modalIsoladaLojinha")
  window.trocarAbaIso                   = trocarAbaIso
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
    const novo = Math.max(0, (ficha.status[chave].atual || 0) + delta)
    ficha.status[chave].atual = novo
    el.value = novo
    atualizarBarras(ficha)
    salvar()
  }

  // Fechar modais
  window.fecharModal               = (id) => fecharModal(id)
  window.fecharModalCriar          = () => fecharModal("modalCriar")
  window.fecharModalFonte          = () => fecharModal("modalFonte")
  window.fecharModalCaracteristica  = () => fecharModal("modalCaracteristica")
  window.fecharModalCaracIsolada    = () => fecharModal("modalCaracIsolada")
  window.fecharExpandirFonte       = () => fecharModal("modalExpandirFonte")
  window.fecharModalRaca           = () => fecharModal("modalEscolhaRaca")
  window.fecharModalProfissao      = () => fecharModal("modalEscolhaProfissao")

  // Firebase
  window.fazerLogin  = () => loginGoogle().catch(e => toastErro("Erro ao fazer login."))
  window.fazerLogout = () => logout()
}
