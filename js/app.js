// ============================================================
//  app.js — Ponto de entrada da ficha.html
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"

import { sincronizarAtributosParaFicha, renderAtributos, renderStatus, renderPontos, atualizarBarras, _atualizarTesteMorte } from "./ui/uiAtributos.js"
import { renderElementos, renderPericias, renderCaracteristicasIsoladas } from "./ui/uiElementos.js"
import {
  registrarCallbacks, abrirListaLivro, abrirCriarElemento, confirmarCriacaoElemento,
  abrirCriarFonte, atualizarCustoFonte, atualizarSubtipoFonte, confirmarSalvarFonte,
  abrirCriarCaracteristica, atualizarEscala, atualizarLimiteEscala, confirmarCriarCaracteristica,
  renderCaracteristicasFonte, trocarAbaCarac, fecharModal, atualizarPreviewCarac,
  toggleVariante, selecionarAbaVariante,
  registrarCallbackIsolada, abrirCriarCaracteristicaIsolada,
  atualizarEscalaIsolada, confirmarCaracIsolada,
  abrirLojinhaIsoladaModal, confirmarIsoladaLojinha, trocarAbaIso,
  selecionarAbaVarianteIso, toggleVarianteIso
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
  _renderAnotacoes()
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

function _renderAnotacoes() {
  const a = ficha.anotacoes ?? {}
  const set = (id, val) => {
    const el = document.getElementById(id)
    if (el && document.activeElement !== el) el.value = val ?? ""
  }
  set("anotObjetivo",      a.objetivo)
  set("anotHistoria",      a.historia)
  set("anotPersonalidade", a.personalidade)
  set("anotNotas",         a.notas)
}

function _renderInventario() {
  const inv      = ficha.inventario ?? { itens: [], offsetPeso: 0 }
  const pesoMax  = ficha.pesoMaxInventario
  const pesoAtual = ficha.pesoAtualInventario
  const offset   = inv.offsetPeso ?? 0
  const auto     = (ficha.atributos.resistencia ?? 0) * 5

  // Atualiza display de peso
  const elAtual = document.getElementById("invPesoAtual")
  const elMax   = document.getElementById("invPesoMax")
  const elOff   = document.getElementById("invPesoOffset")
  const elFill  = document.getElementById("invBarraFill")

  if (elAtual) { elAtual.textContent = pesoAtual; elAtual.style.color = pesoAtual > pesoMax ? "#ef4444" : "#22c55e" }
  if (elMax && document.activeElement !== elMax) {
    elMax.innerText   = pesoMax
    elMax.style.color = offset !== 0 ? "#fbbf24" : ""
    elMax.title       = offset !== 0 ? `Auto (Res×5): ${auto} + offset: ${offset > 0 ? "+" : ""}${offset}` : "Clique para editar o máximo (base: Resistência × 5)"
  }
  if (elOff) elOff.textContent = offset !== 0 ? `(base ${auto} + offset ${offset > 0 ? "+" : ""}${offset})` : `(Resistência ${ficha.atributos.resistencia ?? 0} × 5)`
  if (elFill) {
    const ratio = pesoMax > 0 ? Math.min(pesoAtual / pesoMax, 1) : 0
    const over  = pesoAtual > pesoMax
    elFill.style.width      = (ratio * 100).toFixed(1) + "%"
    elFill.style.background = over
      ? "linear-gradient(90deg,#ef4444,#fca5a5)"
      : ratio > 0.75
        ? "linear-gradient(90deg,#f59e0b,#fcd34d)"
        : "linear-gradient(90deg,#16a34a,#4ade80)"
  }

  // Renderiza lista de itens
  const container = document.getElementById("listaItens")
  if (!container) return
  container.innerHTML = ""

  if (!inv.itens.length) {
    container.innerHTML = `<div class="aba-vazia" style="padding:32px 0"><p style="opacity:0.5">Nenhum item no inventário.</p></div>`
    return
  }

  inv.itens.forEach(item => {
    const card = document.createElement("div")
    card.className = "inv-item-card"
    card.innerHTML = `
      <div class="inv-item-info">
        <div class="inv-item-nome">${item.nome}</div>
        ${item.descricao ? `<div class="inv-item-desc">${item.descricao}</div>` : ""}
      </div>
      <div class="inv-item-direita">
        <span class="inv-item-peso">⚖️ ${item.peso ?? 0}</span>
        <div class="inv-item-acoes">
          <button class="btn-editar" onclick="abrirEditarItem('${item.id}')">✏️</button>
          <button class="btn-remover" onclick="removerItem('${item.id}')">🗑️</button>
        </div>
      </div>`
    container.appendChild(card)
  })
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
  _renderAnotacoes()
  _renderInventario()
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
function _htmlVariantesExpandir(c) {
  const renderV = (v, tipo) => {
    if (!v) return ''
    const amp   = tipo === 'amplificada'
    const icone = amp ? '⬆️' : '⬇️'
    const label = amp ? 'Amplificada' : 'Reduzida'
    const cor   = amp ? '#f59e0b' : '#60a5fa'
    const linhas = v.detalhes.map(d => {
      const dc = d.destaque === 'amp' ? '#fbbf24' : d.destaque === 'red' ? '#93c5fd' : 'rgba(255,255,255,0.45)'
      return '<span style="color:' + dc + ';font-size:11px">' + d.label + ': <strong>' + d.valor + '</strong></span>'
    }).join(' · ')
    return '<div style="border:1px solid ' + cor + '55;border-radius:6px;padding:5px 8px;margin-top:5px;background:' + (amp ? 'rgba(245,158,11,0.06)' : 'rgba(96,165,250,0.06)') + '">' +
      '<span style="font-size:11px;font-weight:600;color:' + cor + '">' + icone + ' ' + label + ' — ' + v.custoPM + ' PM</span>' +
      '<div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px">' + linhas + '</div>' +
    '</div>'
  }
  const ha = renderV(c.amplificada, 'amplificada')
  const hr = renderV(c.reduzida,    'reduzida')
  return (ha || hr) ? '<div style="margin-top:4px">' + ha + hr + '</div>' : ''
}

function _cardCaractExpandir(c) {
  const PC_POR_ESCALA = {1:1,2:2,3:3,4:4,5:5,6:6}
  const resumo = _resumoEscolhas(c.escolhas)
  const rows = Object.entries(resumo)
    .map(([l,v]) => '<div class="carac-resumo-row"><span class="carac-resumo-label">' + l + ':</span> <span>' + v + '</span></div>')
    .join('')
  const pc = c.gratuita ? '0 PC' : ((PC_POR_ESCALA[c.escala] ?? c.escala) + ' PC')
  const gratuitaBadge = c.gratuita
    ? ' <span style="font-size:10px;background:#14532d;color:#86efac;padding:1px 6px;border-radius:4px">GRÁTIS em PCs</span>'
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
    _htmlVariantesExpandir(c) +
    (c.descricao ? '<p class="carac-descricao">' + c.descricao + '</p>' : '') +
  '</div>'
}
function _abrirExpandirFonte(fonte) {
  const modal   = document.getElementById("modalExpandirFonte")
  const content = document.getElementById("expandirFonteContent")
  if (!modal || !content) return

  const PC_POR_ESCALA = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6 }

  let passivosHTML = ""
  if (fonte.subtipo === "zoan") {
    const resH = fonte.passivos?.zoan_res_hibrida
    const resC = fonte.passivos?.zoan_res_completa

    passivosHTML += `<div class="passivo-tag zoan-forma" style="display:block;margin-top:6px">
      <strong>⚙️ Regra de Transformação</strong>
      <p style="font-size:12px;opacity:0.7;margin-top:3px">Mudar de forma custa uma <strong>Ação Completa</strong>. Durante a transição você é considerado <strong>Indefeso</strong>.</p>
    </div>`

    passivosHTML += `<div class="passivo-tag zoan-forma" style="display:block;margin-top:6px">
      <strong>🧍 Forma Humana</strong> — <span style="color:#94a3b8">Custo: Nenhum</span>
      <p style="font-size:12px;opacity:0.7;margin-top:3px">Apenas características de Escala 1 da fruta.</p>
    </div>`

    passivosHTML += `<div class="passivo-tag zoan-forma" style="display:block;margin-top:6px">
      <strong>🐺 Forma Híbrida</strong> — <span style="color:#fbbf24">3 PM</span>
      ${resH?.length ? `<span style="margin-left:6px;font-size:12px">🛡️ ${resH.join(", ")}</span>` : ""}
      <p style="font-size:12px;opacity:0.7;margin-top:3px">Vontade Mista: (5×Resistência) + (5×Habilidade) em PV/PM temporários. Escalas 1 e 2 + ficha normal liberadas.</p>
    </div>`

    passivosHTML += `<div class="passivo-tag zoan-forma" style="display:block;margin-top:6px">
      <strong>🦖 Forma Zoan (Animal)</strong> — <span style="color:#f87171">6 PM</span>
      ${resC?.length ? `<span style="margin-left:6px;font-size:12px">🛡️ ${resC.join(", ")}</span>` : ""}
      <p style="font-size:12px;opacity:0.7;margin-top:3px">Vontade Animalesca: (10×Resistência) + (10×Habilidade) em PV/PM temporários. Todas as escalas liberadas, mas ficha normal indisponível.</p>
    </div>`
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
    renderStatus(ficha); renderPontos(ficha)
    _renderInventario()
    salvar()
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
  window.selecionarAbaVarianteIso       = selecionarAbaVarianteIso
  window.toggleVarianteIso              = toggleVarianteIso
  window.salvarFonte              = confirmarSalvarFonte
  window.atualizarCustoFonte      = atualizarCustoFonte
  window.atualizarSubtipoFonte    = atualizarSubtipoFonte
  window.abrirModalCaracteristica = () => abrirCriarCaracteristica(null)
  window.adicionarCaracteristica  = confirmarCriarCaracteristica
  window.atualizarEscala          = atualizarEscala
  window.atualizarLimiteEscala    = atualizarLimiteEscala

  // Abas característica
  window.trocarAbaCarac        = trocarAbaCarac
  window.toggleVariante        = toggleVariante
  window.selecionarAbaVariante = selecionarAbaVariante

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

  window.marcarTesteMorte = (idx) => {
    if (!ficha.status.pv.testeMorte) ficha.status.pv.testeMorte = [false, false, false]
    ficha.status.pv.testeMorte[idx] = !ficha.status.pv.testeMorte[idx]
    const pvAtual = +document.getElementById("pvAtual").value || 0
    _atualizarTesteMorte(pvAtual, ficha)
    salvar()
  }

  // Anotações
  window.salvarAnotacao = (campo, valor) => {
    if (!ficha.anotacoes) ficha.anotacoes = {}
    ficha.anotacoes[campo] = valor
    salvar()
  }

  // Inventário
  let _itemEditandoId = null

  window.abrirModalItem = () => {
    _itemEditandoId = null
    document.getElementById("modalItemTitulo").innerText = "🎒 Adicionar Item"
    document.getElementById("itemNome").value       = ""
    document.getElementById("itemDescricao").value  = ""
    document.getElementById("itemPeso").value       = "0"
    window.syncStepper?.("itemPeso")
    fecharModal("modalItem") // reset
    document.getElementById("modalItem").classList.remove("hidden")
  }

  window.abrirEditarItem = (id) => {
    const item = ficha.inventario.itens.find(i => i.id === id)
    if (!item) return
    _itemEditandoId = id
    document.getElementById("modalItemTitulo").innerText = "✏️ Editar Item"
    document.getElementById("itemNome").value       = item.nome ?? ""
    document.getElementById("itemDescricao").value  = item.descricao ?? ""
    document.getElementById("itemPeso").value       = item.peso ?? 0
    window.syncStepper?.("itemPeso")
    document.getElementById("modalItem").classList.remove("hidden")
  }

  window.confirmarSalvarItem = () => {
    const nome = document.getElementById("itemNome").value.trim()
    if (!nome) { toastErro("Digite um nome para o item."); return }
    const item = {
      nome,
      descricao: document.getElementById("itemDescricao").value.trim(),
      peso:      +document.getElementById("itemPeso").value || 0
    }
    if (_itemEditandoId) {
      ficha.editarItem(_itemEditandoId, item)
      toastSucesso("Item atualizado!")
    } else {
      ficha.adicionarItem(item)
      toastSucesso("Item adicionado!")
    }
    fecharModal("modalItem")
    _renderInventario()
    salvar()
  }

  window.removerItem = (id) => {
    ficha.removerItem(id)
    _renderInventario()
    salvar()
    toastAviso("Item removido.")
  }

  window.editarPesoMaxInventario = (val) => {
    const novo = parseInt(val) || 0
    const auto = (ficha.atributos.resistencia ?? 0) * 5
    ficha.inventario.offsetPeso = novo - auto
    _renderInventario()
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
