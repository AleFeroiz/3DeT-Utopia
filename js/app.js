// ============================================================
//  app.js — Fase 1: carregamento limpo, salvar único, sem duplicatas
// ============================================================

import { Storage }  from "./storage.js"
import { Ficha }    from "./modelos/Ficha.js"
import { RACAS }    from "./dados/racas.js"
import { sincronizarAtributosParaFicha, renderAtributos, renderStatus, renderPontos, atualizarBarras, _atualizarTesteMorte } from "./ui/uiAtributos.js"
import { renderElementos, renderPericias, renderCaracteristicasIsoladas } from "./ui/uiElementos.js"
import { resumoEscolhas } from "./ui/uiResumoEscolhas.js"
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
import {
  inicializarFirebase, loginGoogle, logout, getUser, onLogin, onLogout,
  salvarFichaFirestore, carregarFichaFirestore,
  salvarFichaPublicaFirestore, carregarFichaPublicaFirestore, removerFichaPublicaFirestore,
  salvarIndiceFichasFirestore, aguardarAuth, estaConfigurado
} from "./firebase.js"

// ── Debounce ──────────────────────────────────────────────
function _debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}
const _salvarDebounced = _debounce(() => salvar(), 800)

// ── Indicador de salvamento (Fase 2) ─────────────────────
function _setSaveStatus(estado) {
  // estado: 'salvando' | 'salvo' | 'erro'
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

function _showLoading(show) {
  const el = document.getElementById("loadingOverlay")
  if (el) el.style.display = show ? "flex" : "none"
}

// ── Estado da ficha aberta ────────────────────────────────
let ficha       = null
let _fichaId    = null
let _fichaModo  = "player"
let _fichaOwner = true
let _loginFoiManual = false   // evita loop: onLogin só redireciona se o login foi ação do usuário
let _fichaEraPublica = false  // rastreia se a ficha já foi pública: evita deletar doc inexistente

// ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

  _showLoading(true)   // Fase 2: mostra spinner enquanto carrega
  await inicializarFirebase()
  await aguardarAuth()

  // ── Fluxo de carregamento (conforme escopo Fase 2) ─────
  const params  = new URLSearchParams(window.location.search)
  const urlId   = params.get("id")
  const rawModo = params.get("modo")
  const urlModo = (rawModo === "mestre" || rawModo === "player") ? rawModo : "player"

  if (urlId) {
    _fichaId   = urlId
    _fichaModo = urlModo
    const user = getUser()

    if (user && estaConfigurado()) {
      // Logado: fonte primária = Firestore
      const remoto = await carregarFichaFirestore(urlId, urlModo)
      if (remoto && !remoto._soMetadados) {
        ficha       = Ficha.fromJSON(remoto)
        _fichaOwner = true
        Storage.salvarFichaPorId(ficha.toJSON(), _fichaModo)
      }
    }

    if (!ficha) {
      // Não logado OU ficha não encontrada no Firestore: tenta localStorage
      const found = Storage.carregarFichaPorId(urlId)
      if (found && !found.ficha._soMetadados) {
        ficha       = Ficha.fromJSON(found.ficha)
        _fichaModo  = found.modo
        _fichaOwner = true
      }
    }

    if (!ficha && estaConfigurado()) {
      // Último recurso: ficha pública de terceiro
      const publica = await carregarFichaPublicaFirestore(urlId)
      if (publica) {
        ficha       = Ficha.fromJSON(publica)
        const user  = getUser()
        _fichaOwner = !!(user && publica._ownerUid === user.uid)
      }
    }

    if (!ficha) {
      ficha       = Ficha.nova()
      _fichaId    = ficha.id
      _fichaOwner = true
    }

  } else {
    // Sem ?id= na URL: cria ficha nova (rota de emergência)
    ficha       = Ficha.nova()
    _fichaId    = ficha.id
    _fichaModo  = urlModo
    _fichaOwner = true
  }

  ficha.calcularStatus()
  ficha.calcularPontos()
  _fichaEraPublica = ficha.isPublic ?? false  // inicializa com estado real da ficha

  _showLoading(false)  // Fase 2: esconde spinner após carregamento

  // ── Registrar callbacks dos módulos de UI ────────────
  registrarCallbacks({
    onSalvarElemento: (elemento) => {
      if (!elemento) return
      const idx = ficha.elementos.findIndex(e => e.id === elemento.id)
      if (idx !== -1) {
        ficha.elementos[idx] = elemento
        ficha.calcularPontos()
      } else {
        ficha.adicionarElemento(elemento)
      }
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

  // ── Render inicial ───────────────────────────────────
  renderTudo()
  _bindNomeEditavel()
  _bindStatusInputs()
  expor()
  _atualizarUILogin()
  _renderCombate()
  _renderVisibilidade()

}) // fim DOMContentLoaded

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

function _renderVisibilidade() {
  const isPub  = ficha.isPublic  ?? false
  const isEdit = ficha.editPublic ?? false

  const chkPub  = document.getElementById("togglePublico")
  const chkEdit = document.getElementById("toggleEditPublic")
  const hintPub = document.getElementById("hintPublico")
  const hintEdit= document.getElementById("hintEditPublic")
  const rowEdit = document.getElementById("rowEditPublic")

  if (chkPub)  chkPub.checked  = isPub
  if (chkEdit) chkEdit.checked = isEdit

  if (hintPub)  hintPub.textContent  = isPub  ? "Visível para todos" : "Apenas você"
  if (hintEdit) hintEdit.textContent = isEdit ? "Todos podem editar" : "Só visualizar"

  if (rowEdit) {
    rowEdit.style.opacity       = isPub ? "1" : "0.4"
    rowEdit.style.pointerEvents = isPub ? "auto" : "none"
  }

  // Banner de somente-leitura para terceiros
  _aplicarModoLeitura()
}

// Bloqueia/desbloqueia toda a ficha conforme _fichaOwner e editPublic
function _aplicarModoLeitura() {
  const somenteLeitura = !_fichaOwner && !ficha.editPublic
  const container = document.querySelector(".ficha-container")
  if (!container) return

  let banner = document.getElementById("bannerLeitura")

  if (somenteLeitura) {
    // Desabilita todos os inputs, buttons e textareas exceto login
    container.querySelectorAll("input, textarea, button, select").forEach(el => {
      if (el.closest(".login-area")) return
      el.disabled = true
    })
    // Mostra banner
    if (!banner) {
      banner = document.createElement("div")
      banner.id = "bannerLeitura"
      banner.className = "banner-leitura"
      banner.innerHTML = `👁️ Modo visualização — esta ficha está somente para leitura`
      document.querySelector(".ficha-container").prepend(banner)
    }
  } else {
    // Reabilita tudo
    container.querySelectorAll("input, textarea, button, select").forEach(el => {
      el.disabled = false
    })
    banner?.remove()
  }
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
  // Recalcula combate pois bônus de equipamento podem ter mudado
  _renderCombate()

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
    card.className = "inv-item-card" + (item.categoria === "equipamento" ? " inv-item-equip" : "")

    // Badges de bônus
    const badgeAtk = (item.categoria === "equipamento" && item.usadoAtaque)
      ? `<span class="inv-badge inv-badge-atk">⚔️ +${item.bonusAtaque ?? 0}</span>` : ""
    const badgeDef = (item.categoria === "equipamento" && item.usadoDefesa)
      ? `<span class="inv-badge inv-badge-def">🛡️ +${item.bonusDefesa ?? 0}</span>` : ""
    const badgeCat = item.categoria === "equipamento"
      ? `<span class="inv-badge inv-badge-equip">Equip.</span>` : ""

    card.innerHTML = `
      <div class="inv-item-info">
        <div class="inv-item-nome">${item.nome} ${badgeCat}${badgeAtk}${badgeDef}</div>
        ${item.descricao ? `<div class="inv-item-desc">${item.descricao}</div>` : ""}
      </div>
      <div class="inv-item-direita">
        <span class="inv-item-peso" style="color:${(item.peso??0)<0?'#4ade80':''}">⚖️ ${item.peso ?? 0}</span>
        <div class="inv-item-acoes">
          <button class="btn-editar" onclick="abrirEditarItem('${item.id}')">✏️</button>
          <button class="btn-remover" onclick="removerItem('${item.id}')">🗑️</button>
        </div>
      </div>`
    container.appendChild(card)
  })
}

// ── Atributo de combate selecionado (poder ou habilidade) ─
let _atribCombate = 'poder'

function _renderCombate() {
  const atrib    = ficha.atributos[_atribCombate] ?? 0
  const bonusAtk = ficha.bonusAtaqueEquipamentos
  const bonusDef = ficha.bonusDefesaEquipamentos
  const res      = ficha.atributos.resistencia ?? 0
  const hab      = ficha.atributos.habilidade  ?? 0
  const ex       = ficha.combateExtras ?? {}

  // Sincroniza inputs "Outros" (só se não estiver em foco)
  const syncInput = (id, val) => {
    const el = document.getElementById(id)
    if (el && document.activeElement !== el) el.value = val ?? 0
  }
  syncInput('extraAtkSeguro',    ex.atkSeguro)
  syncInput('extraAtkArriscado', ex.atkArriscado)
  syncInput('extraAtkMaluco',    ex.atkMaluco)
  syncInput('extraDefBloqueio',  ex.defBloqueio)
  syncInput('extraDefEsquiva',   ex.defEsquiva)
  syncInput('extraDefContra',    ex.defContra)

  // Calcula totais
  const set = (id, val) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }
  set('atkSeguro',    bonusAtk + atrib       + (ex.atkSeguro    ?? 0))
  set('atkArriscado', bonusAtk + atrib * 2   + (ex.atkArriscado ?? 0))
  set('atkMaluco',    bonusAtk + atrib * 3   + (ex.atkMaluco    ?? 0))
  set('defBloqueio',  bonusDef + res * 2     + (ex.defBloqueio  ?? 0))
  set('defEsquiva',   bonusDef + hab * 2     + (ex.defEsquiva   ?? 0))
  set('defContra',    bonusDef               + (ex.defContra     ?? 0))

  // Toggle visual
  document.getElementById('togglePoder')?.classList.toggle('active',      _atribCombate === 'poder')
  document.getElementById('toggleHabilidade')?.classList.toggle('active', _atribCombate === 'habilidade')
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
    const offset = ficha.maestrasCfg?.offsetLimite ?? 0
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
async function salvar() {
  if (!_fichaOwner && !ficha.editPublic) return

  const fichaJson = ficha.toJSON()

  // localStorage sempre (cache offline e testes locais)
  if (_fichaId) Storage.salvarFichaPorId(fichaJson, _fichaModo)

  if (!estaConfigurado()) { _setSaveStatus("salvo"); return }
  const user = getUser()
  if (!user) { _setSaveStatus("salvo"); return }

  _setSaveStatus("salvando")

  try {
    if (_fichaOwner && user && _fichaId) {
      await salvarFichaFirestore({ ...fichaJson, _ownerUid: user.uid }, _fichaModo)
      // Atualiza índice: re-lê do localStorage (já tem o fichaJson salvo acima)
      // e garante que a ficha atual está com os dados mais recentes
      const fichasParaIndice = Storage.carregarFichas(_fichaModo).map(f =>
        f.id === fichaJson.id ? fichaJson : f
      )
      salvarIndiceFichasFirestore(fichasParaIndice, _fichaModo)
    }

  if (_fichaId) {
    if (fichaJson.isPublic) {
      const ownerUid = _fichaOwner && user ? user.uid : fichaJson._ownerUid
      await salvarFichaPublicaFirestore({ ...fichaJson, _ownerUid: ownerUid })
      _fichaEraPublica = true   // marca que já existiu como pública
    } else if (_fichaOwner && _fichaEraPublica) {
      // Só tenta remover se a ficha JÁ foi pública antes nesta sessão
      await removerFichaPublicaFirestore(_fichaId)
      _fichaEraPublica = false
    }
  }

  _setSaveStatus("salvo")
  } catch(e) {
    console.error("[salvar]", e)
    _setSaveStatus("erro")
  }
}



// ─────────────────────────────────────────────────────────
//  BIND — Nome editável
// ─────────────────────────────────────────────────────────
function _bindNomeEditavel() {
  const el = document.getElementById("nomeFicha")
  if (!el) return
  // Exibe o nome atual ao montar
  el.textContent = ficha.nome ?? "Nova Ficha"
  el.addEventListener("blur", () => {
    // textContent evita HTML injetado; replace limpa quebras de linha do contenteditable
    const novo = (el.textContent ?? "").replace(/[\n\r]+/g, " ").trim()
    if (novo) {
      ficha.nome = novo
      el.textContent = novo  // normaliza o DOM também
      salvar()
    } else {
      el.textContent = ficha.nome ?? "Nova Ficha"
    }
  })
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); el.blur() }
  })
  // Impede colar HTML formatado
  el.addEventListener("paste", e => {
    e.preventDefault()
    const texto = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, texto)
  })
}

// ─────────────────────────────────────────────────────────
//  BIND — Inputs de status (paMax, pmMax, pvMax) e campos editáveis
// ─────────────────────────────────────────────────────────
function _bindStatusInputs() {
  // Inputs de atual (pa, pm, pv)
  const bindAtual = (inputId, chave) => {
    const el = document.getElementById(inputId)
    if (!el) return
    el.addEventListener("change", () => {
      const val = Math.max(0, parseInt(el.value) || 0)
      ficha.status[chave].atual = val
      el.value = val
      atualizarBarras(ficha)
      salvar()
    })
  }
  bindAtual("paAtual", "pa")
  bindAtual("pmAtual", "pm")
  bindAtual("pvAtual", "pv")

  // Spans contenteditable de máximo (paMax, pmMax, pvMax)
  const bindMax = (spanId, chave) => {
    const el = document.getElementById(spanId)
    if (!el) return
    el.addEventListener("blur", () => {
      const val = parseInt(el.innerText) || 0
      if (val >= 0) {
        const auto = ficha.status[chave].max  // valor base calculado
        ficha.status[chave].offsetMax = val - auto
        ficha.calcularStatus()
        renderStatus(ficha)
        salvar()
      } else {
        el.innerText = ficha.status[chave].max  // reverte se inválido
      }
    })
    el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.blur() } })
    el.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }
  bindMax("paMax", "pa"); bindMax("pmMax", "pm"); bindMax("pvMax", "pv")

  // Pontos usados e total (contenteditable)
  const bindPontos = (spanId, campo) => {
    const el = document.getElementById(spanId)
    if (!el) return
    el.addEventListener("blur", () => {
      const val = parseInt(el.innerText) || 0
      if (val >= 0) {
        ficha.pontos[campo] = val
        renderPontos(ficha)
        salvar()
      } else {
        el.innerText = ficha.pontos[campo] ?? 0
      }
    })
    el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.blur() } })
    el.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }
  bindPontos("usado",  "gastos")
  bindPontos("total",  "offsetTotal")

  // Maestria limite (contenteditable)
  const mLimite = document.getElementById("maestriaLimite")
  if (mLimite) {
    mLimite.addEventListener("blur", () => {
      const val = parseInt(mLimite.innerText) || 0
      const base = ficha.maestraLimiteBase ?? ficha.maestraLimite
      if (!ficha.maestrasCfg) ficha.maestrasCfg = {}
      ficha.maestrasCfg.offsetLimite = val - base
      _renderNivel()
      salvar()
    })
    mLimite.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); mLimite.blur() } })
    mLimite.addEventListener("keypress", e => { if (!/[0-9-]/.test(e.key)) e.preventDefault() })
  }

  // Peso máximo do inventário (contenteditable)
  const invPesoMax = document.getElementById("invPesoMax")
  if (invPesoMax) {
    invPesoMax.addEventListener("blur", () => {
      window.editarPesoMaxInventario?.(invPesoMax.innerText)
    })
    invPesoMax.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); invPesoMax.blur() } })
    invPesoMax.addEventListener("keypress", e => { if (!/[0-9-]/.test(e.key)) e.preventDefault() })
  }
}

// ─────────────────────────────────────────────────────────
//  EXPANDIR FONTE — helpers e modal
// ─────────────────────────────────────────────────────────

// Alias: _resumoEscolhas → importado de uiResumoEscolhas.js
const _resumoEscolhas = resumoEscolhas

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

// Fase 2 (escopo): logar/deslogar na ficha redireciona para index.html
// Não há ambiguidade sobre qual versão da ficha está sendo editada
onLogin(async (user) => {
  _atualizarUILogin()
  if (_loginFoiManual) {
    _loginFoiManual = false
    window.location.href = "index.html"
    return
  }
  // Login automático (restauração de sessão): recarrega ficha da nuvem se mais recente
  if (_fichaId && estaConfigurado()) {
    const remoto = await carregarFichaFirestore(_fichaId, _fichaModo)
    if (remoto && !remoto._soMetadados) {
      const fichaRemota = Ficha.fromJSON(remoto)
      if ((remoto._updatedAt ?? "") > (ficha.toJSON()._updatedAt ?? "")) {
        ficha = fichaRemota
        _fichaOwner = true
        renderTudo()
        toastInfo("Ficha atualizada da nuvem.")
      }
    }
  }
})
onLogout(() => {
  _atualizarUILogin()
  toastInfo("Você saiu.")
  window.location.href = "index.html"
})



//  MESTIÇO — Modal e lógica
// ═══════════════════════════════════════════════════════════

// Estado temporário do wizard mestiço
let _mesticoTemp = { racas: [], extras: [], vantagens: [], desvantagens: [], evolucoes: [] }
let _mesticoEvolSel = new Set() // "racaId|nivel|nome"

function _racasSemEspeciais() {
  return RACAS.filter(r => r.id !== "mestico" && r.id !== "modificado")
}

function _abrirModalMestico(ficha) {
  const d = ficha.racaDados
  _mesticoTemp = d?.racas?.length ? JSON.parse(JSON.stringify(d)) : { racas: [], extras: [], vantagens: [], desvantagens: [], evolucoes: [] }
  _mesticoEvolSel = new Set((d?.evolucoes ?? []).map(e => `${e.racaId}|${e.nivel}|${e.nome}`))

  // Popular selects de raça
  const racas = _racasSemEspeciais()
  ;['mesticoRaca1','mesticoRaca2'].forEach((id, i) => {
    const sel = document.getElementById(id)
    sel.innerHTML = '<option value="">— escolha —</option>'
    racas.forEach(r => {
      const opt = document.createElement('option')
      opt.value = r.id; opt.textContent = `${r.emoji} ${r.nome}`
      if (_mesticoTemp.racas[i] === r.id) opt.selected = true
      sel.appendChild(opt)
    })
  })

  _mesticoAtualizarOpcoes()
  document.getElementById('modalMestico').classList.remove('hidden')
}

function _mesticoAtualizarOpcoes() {
  const id1 = document.getElementById('mesticoRaca1')?.value
  const id2 = document.getElementById('mesticoRaca2')?.value
  const step2 = document.getElementById('mesticoStep2')
  const step3 = document.getElementById('mesticoStep3')
  const btnSalvar = document.getElementById('btnSalvarMestico')

  if (!id1 || !id2 || id1 === id2) {
    step2.style.display = 'none'; step3.style.display = 'none'
    if (btnSalvar) btnSalvar.style.display = 'none'
    return
  }
  step2.style.display = 'block'; step3.style.display = 'block'
  if (btnSalvar) btnSalvar.style.display = 'inline-block'

  _mesticoRenderEscolhas(id1, 'mesticoEscolhasR1', 1)
  _mesticoRenderEscolhas(id2, 'mesticoEscolhasR2', 2)
  _mesticoRenderEvolucoes(id1, id2)
}

function _mesticoRenderEscolhas(racaId, containerId, rNum) {
  const raca = RACAS.find(r => r.id === racaId)
  const container = document.getElementById(containerId)
  if (!raca || !container) return

  const salvos   = _mesticoTemp
  const extraSel = salvos.extras?.find(e => e.racaId === racaId)?.texto ?? ''
  const vantSel  = salvos.vantagens?.find(v => v.racaId === racaId)?.nome ?? ''
  const desvSel  = salvos.desvantagens?.find(d => d.racaId === racaId)?.nome ?? ''

  const renderOpcoes = (lista, grupo, selNome, renderItem) => {
    return lista.map((item, i) => {
      const id    = `mopt_${grupo}_${rNum}_${i}`
      const nome  = typeof item === 'string' ? item : item.nome
      const sel   = nome === selNome
      return `<div class="mopt-card ${sel ? 'mopt-sel' : ''}" onclick="mesticoSelecionarOpcao(this, '${grupo}', ${rNum})">
        <input type="radio" name="mestico_${grupo}_${rNum}" id="${id}" value="${nome.replace(/"/g,'&quot;')}"
          data-desc="${typeof item === 'string' ? '' : (item.desc ?? '').replace(/"/g,'&quot;')}"
          ${sel ? 'checked' : ''} style="display:none">
        ${renderItem(item)}
      </div>`
    }).join('')
  }

  container.innerHTML = `
    <div class="mestico-raca-bloco">
      <div class="mestico-raca-titulo">${raca.emoji} ${raca.nome}</div>

      <div class="mestico-grupo">
        <div class="mestico-grupo-label">✨ Extra</div>
        <div class="mopt-lista">
          ${renderOpcoes(raca.extras, 'extra', extraSel,
            e => `<span class="mopt-nome">${e}</span>`
          )}
        </div>
      </div>

      <div class="mestico-grupo">
        <div class="mestico-grupo-label">👍 Vantagem</div>
        <div class="mopt-lista">
          ${renderOpcoes(raca.vantagens, 'vant', vantSel,
            v => `<div><span class="mopt-nome">${v.nome}</span><p class="mopt-desc">${v.desc}</p></div>`
          )}
        </div>
      </div>

      <div class="mestico-grupo">
        <div class="mestico-grupo-label">👎 Desvantagem</div>
        <div class="mopt-lista">
          ${renderOpcoes(raca.desvantagens, 'desv', desvSel,
            d => `<div><span class="mopt-nome">${d.nome}</span><p class="mopt-desc">${d.desc}</p></div>`
          )}
        </div>
      </div>
    </div>`
}

function _mesticoRenderEvolucoes(id1, id2) {
  const r1 = RACAS.find(r => r.id === id1)
  const r2 = RACAS.find(r => r.id === id2)
  const container = document.getElementById('mesticoEvolucoes')
  if (!container) return

  const evs1 = r1?.evolucoes ?? []
  const evs2 = r2?.evolucoes ?? []
  const numLinhas = Math.max(evs1.length, evs2.length)

  // Índices selecionados por raça
  const idxSel1 = new Set()
  const idxSel2 = new Set()
  for (const key of _mesticoEvolSel) {
    const [rid] = key.split('|')
    const evs = rid === id1 ? evs1 : evs2
    const idx = evs.findIndex(e => `${rid}|${e.nivel}|${e.nome}` === key)
    if (idx !== -1) { if (rid === id1) idxSel1.add(idx); else idxSel2.add(idx) }
  }

  const renderCard = (raca, ev, idx) => {
    const key     = `${raca.id}|${ev.nivel}|${ev.nome}`
    const checked = _mesticoEvolSel.has(key)
    const outraSels = raca.id === id1 ? idxSel2 : idxSel1
    const bloqLinha  = !checked && outraSels.has(idx)
    const bloqLimite = !checked && _mesticoEvolSel.size >= 3
    const bloq = bloqLinha || bloqLimite
    const motivo = bloqLinha ? 'Posição já ocupada pela outra raça' : bloqLimite ? 'Máximo de 3 evoluções' : ''
    return `<div class="mopt-card mopt-evol ${checked ? 'mopt-sel' : ''} ${bloq ? 'mopt-bloq' : ''}"
      data-key="${key}" data-idx="${idx}" data-racaid="${raca.id}"
      onclick="mesticoToggleEvol(this)"
      title="${motivo}">
      <div class="mopt-evol-header">
        <span class="badge-raca-mini">${raca.emoji} ${raca.nome}</span>
        ${ev.nivel ? `<span class="badge-nivel">Nível ${ev.nivel}</span>` : ''}
        ${checked ? '<span class="mopt-evol-check">✓</span>' : ''}
      </div>
      <span class="mopt-nome">${ev.nome}</span>
      <p class="mopt-desc">${ev.desc}</p>
      ${bloqLinha ? '<p class="mopt-bloq-msg">⚠️ Posição ocupada</p>' : ''}
    </div>`
  }

  let html = ''
  for (let i = 0; i < numLinhas; i++) {
    const e1 = evs1[i]
    const e2 = evs2[i]
    html += '<div class="mopt-evol-linha">'
    html += e1 ? renderCard(r1, e1, i) : '<div class="mopt-card mopt-evol mopt-vazio">—</div>'
    html += e2 ? renderCard(r2, e2, i) : '<div class="mopt-card mopt-evol mopt-vazio">—</div>'
    html += '</div>'
  }
  container.innerHTML = html
}

window.mesticoSelecionarOpcao = (card, grupo, rNum) => {
  // Desmarca todos os cards do mesmo grupo/rNum e marca o clicado
  const lista = card.closest('.mopt-lista')
  lista?.querySelectorAll('.mopt-card').forEach(c => c.classList.remove('mopt-sel'))
  card.classList.add('mopt-sel')
  card.querySelector('input[type="radio"]').checked = true
}

window.mesticoToggleEvol = (card) => {
  if (card.classList.contains('mopt-bloq')) return  // bloqueado, ignora clique

  const key    = card.dataset.key
  const idx    = parseInt(card.dataset.idx)
  const racaId = card.dataset.racaid
  const id1    = document.getElementById('mesticoRaca1')?.value
  const id2    = document.getElementById('mesticoRaca2')?.value
  const evs1   = RACAS.find(r => r.id === id1)?.evolucoes ?? []
  const evs2   = RACAS.find(r => r.id === id2)?.evolucoes ?? []

  if (_mesticoEvolSel.has(key)) {
    // Desselecionar
    _mesticoEvolSel.delete(key)
  } else {
    // Validar limite
    if (_mesticoEvolSel.size >= 3) {
      toastAviso('Máximo de 3 evoluções para o Mestiço.')
      return
    }
    // Validar posição: checar se o índice desta linha já foi usado pela outra raça
    const outraRacaId = racaId === id1 ? id2 : id1
    const outraEvs    = racaId === id1 ? evs2 : evs1
    const outraEv     = outraEvs[idx]
    if (outraEv) {
      const outraKey = `${outraRacaId}|${outraEv.nivel}|${outraEv.nome}`
      if (_mesticoEvolSel.has(outraKey)) {
        toastAviso('Posição já ocupada pela outra raça.')
        return
      }
    }
    _mesticoEvolSel.add(key)
  }

  // Re-renderiza para atualizar estados de bloqueio
  _mesticoRenderEvolucoes(id1, id2)

  // Atualiza contador
  const titulo = document.getElementById('mesticoEvolTitulo')
  if (titulo) titulo.textContent = `Passo 3 — Evoluções: ${_mesticoEvolSel.size}/3 (mín. 1 de cada raça)`
}

function _salvarMestico(ficha) {
  const id1 = document.getElementById('mesticoRaca1')?.value
  const id2 = document.getElementById('mesticoRaca2')?.value
  if (!id1 || !id2 || id1 === id2) { toastErro('Escolha duas raças distintas.'); return }

  // Lê o input radio checked e pega nome + desc do data-*
  const lerOpcao = (name) => {
    const inp = document.querySelector(`input[name="${name}"]:checked`)
    if (!inp) return null
    return { nome: inp.value, desc: inp.dataset.desc ?? '' }
  }

  const extra1 = lerOpcao('mestico_extra_1')
  const extra2 = lerOpcao('mestico_extra_2')
  const vant1  = lerOpcao('mestico_vant_1')
  const vant2  = lerOpcao('mestico_vant_2')
  const desv1  = lerOpcao('mestico_desv_1')
  const desv2  = lerOpcao('mestico_desv_2')

  if (!extra1) { toastErro('Escolha 1 extra da Raça 1.'); return }
  if (!extra2) { toastErro('Escolha 1 extra da Raça 2.'); return }
  if (!vant1)  { toastErro('Escolha 1 vantagem da Raça 1.'); return }
  if (!vant2)  { toastErro('Escolha 1 vantagem da Raça 2.'); return }
  if (!desv1)  { toastErro('Escolha 1 desvantagem da Raça 1.'); return }
  if (!desv2)  { toastErro('Escolha 1 desvantagem da Raça 2.'); return }

  // Validar evoluções: mín. 1 de cada raça
  const evolArr = []
  for (const key of _mesticoEvolSel) {
    const [rId, , nome] = key.split('|')
    const raca = RACAS.find(r => r.id === rId)
    const ev   = raca?.evolucoes.find(e => e.nome === nome)
    if (ev) evolArr.push({ racaId: rId, nivel: ev.nivel, nome: ev.nome, desc: ev.desc })
  }

  const temDe1 = evolArr.some(e => e.racaId === id1)
  const temDe2 = evolArr.some(e => e.racaId === id2)
  if (!temDe1 || !temDe2) { toastErro('Selecione ao menos 1 evolução de cada raça.'); return }

  const racaDados = {
    racas:        [id1, id2],
    extras:       [{ racaId: id1, texto: extra1.nome }, { racaId: id2, texto: extra2.nome }],
    vantagens:    [{ racaId: id1, nome: vant1.nome, desc: vant1.desc }, { racaId: id2, nome: vant2.nome, desc: vant2.desc }],
    desvantagens: [{ racaId: id1, nome: desv1.nome, desc: desv1.desc }, { racaId: id2, nome: desv2.nome, desc: desv2.desc }],
    evolucoes:    evolArr
  }

  ficha.racaId    = 'mestico'
  ficha.racaDados = racaDados
  ficha.calcularPontos()
  renderTudo(); salvar()
  fecharModal('modalMestico')
  toastSucesso('Mestiço configurado!')
}

// ═══════════════════════════════════════════════════════════
//  MODIFICADO — Modal e lógica
// ═══════════════════════════════════════════════════════════

let _modEvolTemp = [] // [{ nivel, nome, desc }]

function _abrirModalModificado(ficha) {
  const d = ficha.racaDados ?? {}
  // Se já tem dados salvos, restaura; senão pré-popula com evoluções da raça base
  if (d.evolucoes?.length) {
    _modEvolTemp = JSON.parse(JSON.stringify(d.evolucoes))
    _modEvolTemp._racaId = d.racaBase ?? null  // marca como da raça salva
  } else {
    _modEvolTemp = []  // será preenchido ao selecionar raça base
  }

  const racas = _racasSemEspeciais()
  const sel = document.getElementById('modRacaBase')
  sel.innerHTML = '<option value="">— escolha —</option>'
  racas.forEach(r => {
    const opt = document.createElement('option')
    opt.value = r.id; opt.textContent = `${r.emoji} ${r.nome}`
    if (d.racaBase === r.id) opt.selected = true
    sel.appendChild(opt)
  })

  // Restaurar campos manuais
  document.getElementById('modExtraManual').value             = d.extraManual ?? ''
  document.getElementById('modVantagemManualNome').value      = d.vantagemManual?.nome ?? ''
  document.getElementById('modVantagemManualDesc').value      = d.vantagemManual?.desc ?? ''
  document.getElementById('modDesvantagemManualNome').value   = d.desvantagemManual?.nome ?? ''
  document.getElementById('modDesvantagemManualDesc').value   = d.desvantagemManual?.desc ?? ''

  _modAtualizarOpcoes(d)
  _modRenderEvolucoes()
  document.getElementById('modalModificado').classList.remove('hidden')
}

function _modAtualizarOpcoes(salvos) {
  const id = document.getElementById('modRacaBase')?.value
  const opcoes = document.getElementById('modOpcoes')
  if (!id) { if (opcoes) opcoes.style.display = 'none'; return }
  if (opcoes) opcoes.style.display = 'block'

  const raca = RACAS.find(r => r.id === id)
  if (!raca) return

  // Ao trocar raça base OU iniciar sem dados, recarregar evoluções da nova raça
  // Guarda a raça anterior para detectar troca
  if (!_modEvolTemp._racaId || _modEvolTemp._racaId !== id) {
    _modEvolTemp = (raca.evolucoes ?? []).map(e => ({
      nivel: e.nivel ?? null,
      nome:  e.nome,
      desc:  e.desc
    }))
    _modEvolTemp._racaId = id  // marca qual raça gerou essas evoluções
    _modRenderEvolucoes()
  }

  const d = salvos ?? {}

  // Extras
  const selExtra = document.getElementById('modExtraBase')
  selExtra.innerHTML = '<option value="">— escolha —</option>'
  raca.extras.forEach(e => {
    const opt = document.createElement('option')
    opt.value = e; opt.textContent = e
    if (d.extraBase === e) opt.selected = true
    selExtra.appendChild(opt)
  })

  // Vantagens
  const selVant = document.getElementById('modVantagemBase')
  selVant.innerHTML = '<option value="">— escolha —</option>'
  raca.vantagens.forEach(v => {
    const opt = document.createElement('option')
    opt.value = `${v.nome}|${v.desc}`; opt.textContent = v.nome
    if (d.vantagemBase?.nome === v.nome) opt.selected = true
    selVant.appendChild(opt)
  })

  // Desvantagens
  const selDesv = document.getElementById('modDesvantagemBase')
  selDesv.innerHTML = '<option value="">— escolha —</option>'
  raca.desvantagens.forEach(dv => {
    const opt = document.createElement('option')
    opt.value = `${dv.nome}|${dv.desc}`; opt.textContent = dv.nome
    if (d.desvantagemBase?.nome === dv.nome) opt.selected = true
    selDesv.appendChild(opt)
  })
}

function _modRenderEvolucoes() {
  const container = document.getElementById('modEvolucoes')
  if (!container) return
  container.innerHTML = ''
  // filtra apenas itens de array reais (ignora propriedades extras como _racaId)
  const itens = Array.from({ length: _modEvolTemp.length }, (_, i) => _modEvolTemp[i])
  itens.forEach((ev, i) => {
    const div = document.createElement('div')
    div.className = 'mod-evol-row'
    div.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <span class="mestico-label" style="flex-shrink:0">Nível</span>
        <input type="number" class="mestico-input-sm" value="${ev.nivel ?? ''}" min="1" max="20"
          onchange="_modEvolTemp[${i}].nivel = +this.value || null" style="width:52px">
        <input type="text" class="mestico-input" value="${ev.nome ?? ''}" placeholder="Nome da evolução"
          oninput="_modEvolTemp[${i}].nome = this.value" style="flex:1">
        <button onclick="modRemoverEvolucao(${i})" style="background:#7f1d1d;border:none;color:#fca5a5;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px">✕</button>
      </div>
      <textarea class="mestico-textarea" placeholder="Descrição..." oninput="_modEvolTemp[${i}].desc = this.value">${ev.desc ?? ''}</textarea>`
    container.appendChild(div)
  })
}

function _modAdicionarEvolucao() {
  const racaId = _modEvolTemp._racaId
  _modEvolTemp.push({ nivel: null, nome: '', desc: '' })
  _modEvolTemp._racaId = racaId  // preserva marcador
  _modRenderEvolucoes()
}

function _modRemoverEvolucao(i) {
  const racaId = _modEvolTemp._racaId
  _modEvolTemp.splice(i, 1)
  _modEvolTemp._racaId = racaId  // preserva marcador
  _modRenderEvolucoes()
}

function _salvarModificado(ficha) {
  const racaBase = document.getElementById('modRacaBase')?.value
  if (!racaBase) { toastErro('Escolha a raça base.'); return }

  const lerSelect = (id) => document.getElementById(id)?.value ?? ''

  const vantBParts  = lerSelect('modVantagemBase').split('|')
  const desvBParts  = lerSelect('modDesvantagemBase').split('|')

  const racaDados = {
    racaBase,
    extraBase:          lerSelect('modExtraBase'),
    vantagemBase:       vantBParts[0] ? { nome: vantBParts[0], desc: vantBParts[1] ?? '' } : null,
    desvantagemBase:    desvBParts[0] ? { nome: desvBParts[0], desc: desvBParts[1] ?? '' } : null,
    extraManual:        document.getElementById('modExtraManual')?.value.trim() ?? '',
    vantagemManual:     {
      nome: document.getElementById('modVantagemManualNome')?.value.trim() ?? '',
      desc: document.getElementById('modVantagemManualDesc')?.value.trim() ?? ''
    },
    desvantagemManual:  {
      nome: document.getElementById('modDesvantagemManualNome')?.value.trim() ?? '',
      desc: document.getElementById('modDesvantagemManualDesc')?.value.trim() ?? ''
    },
    evolucoes: Array.from({ length: _modEvolTemp.length }, (_, i) => _modEvolTemp[i]).filter(e => e.nome?.trim())
  }

  ficha.racaId    = 'modificado'
  ficha.racaDados = racaDados
  ficha.calcularPontos()
  renderTudo(); salvar()
  fecharModal('modalModificado')
  toastSucesso('Modificado configurado!')
}
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
  window.abrirModalMestico   = () => _abrirModalMestico(ficha)
  window.abrirModalModificado= () => _abrirModalModificado(ficha)
  window.mesticoAtualizarOpcoes = _mesticoAtualizarOpcoes
  window.salvarMestico          = () => _salvarMestico(ficha)
  window.modAtualizarOpcoes     = _modAtualizarOpcoes
  window.modAdicionarEvolucao   = _modAdicionarEvolucao
  window.modRemoverEvolucao     = _modRemoverEvolucao
  window.salvarModificado       = () => _salvarModificado(ficha)

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
    _salvarDebounced()  // Bug #16: debounce para campos de texto livre
  }

  // Inventário
  let _itemEditandoId = null

  window.abrirModalItem = () => {
    _itemEditandoId = null
    document.getElementById("modalItemTitulo").innerText = "🎒 Adicionar Item"
    document.getElementById("itemNome").value      = ""
    document.getElementById("itemDescricao").value = ""
    document.getElementById("itemPeso").value      = "0"
    window.syncStepper?.("itemPeso")
    // Reset categoria
    document.querySelector('input[name="itemCategoria"][value="item"]').checked = true
    document.getElementById("camposEquipamento").style.display   = "none"
    document.getElementById("itemUsadoAtaque").checked           = false
    document.getElementById("itemUsadoDefesa").checked           = false
    document.getElementById("campoBonusAtaque").style.display    = "none"
    document.getElementById("campoBonusDefesa").style.display    = "none"
    document.getElementById("itemBonusAtaque").value             = "0"
    document.getElementById("itemBonusDefesa").value             = "0"
    window.syncStepper?.("itemBonusAtaque")
    window.syncStepper?.("itemBonusDefesa")
    fecharModal("modalItem")
    document.getElementById("modalItem").classList.remove("hidden")
  }

  window.abrirEditarItem = (id) => {
    const item = ficha.inventario.itens.find(i => i.id === id)
    if (!item) return
    _itemEditandoId = id
    document.getElementById("modalItemTitulo").innerText = "✏️ Editar Item"
    document.getElementById("itemNome").value      = item.nome ?? ""
    document.getElementById("itemDescricao").value = item.descricao ?? ""
    document.getElementById("itemPeso").value      = item.peso ?? 0
    window.syncStepper?.("itemPeso")
    // Restaurar categoria
    const cat = item.categoria ?? "item"
    document.querySelector(`input[name="itemCategoria"][value="${cat}"]`).checked = true
    document.getElementById("camposEquipamento").style.display = cat === "equipamento" ? "block" : "none"
    // Ataque
    const usaAtk = !!item.usadoAtaque
    document.getElementById("itemUsadoAtaque").checked        = usaAtk
    document.getElementById("campoBonusAtaque").style.display = usaAtk ? "block" : "none"
    document.getElementById("itemBonusAtaque").value          = item.bonusAtaque ?? 0
    window.syncStepper?.("itemBonusAtaque")
    // Defesa
    const usaDef = !!item.usadoDefesa
    document.getElementById("itemUsadoDefesa").checked        = usaDef
    document.getElementById("campoBonusDefesa").style.display = usaDef ? "block" : "none"
    document.getElementById("itemBonusDefesa").value          = item.bonusDefesa ?? 0
    window.syncStepper?.("itemBonusDefesa")
    document.getElementById("modalItem").classList.remove("hidden")
  }

  window.confirmarSalvarItem = () => {
    const nome = document.getElementById("itemNome").value.trim()
    if (!nome) { toastErro("Digite um nome para o item."); return }
    const cat     = document.querySelector('input[name="itemCategoria"]:checked')?.value ?? "item"
    const usaAtk  = cat === "equipamento" && document.getElementById("itemUsadoAtaque").checked
    const usaDef  = cat === "equipamento" && document.getElementById("itemUsadoDefesa").checked
    const item = {
      nome,
      descricao:   document.getElementById("itemDescricao").value.trim(),
      peso:        +document.getElementById("itemPeso").value || 0,
      categoria:   cat,
      usadoAtaque: usaAtk,
      usadoDefesa: usaDef,
      bonusAtaque: usaAtk ? (+document.getElementById("itemBonusAtaque").value || 0) : 0,
      bonusDefesa: usaDef ? (+document.getElementById("itemBonusDefesa").value || 0) : 0,
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

  // Combate toggle e extras
  window.setAtribCombate = (atrib) => {
    _atribCombate = atrib
    _renderCombate()
  }
  window.salvarCombateExtra = (campo, val) => {
    if (!ficha.combateExtras) ficha.combateExtras = {}
    ficha.combateExtras[campo] = parseInt(val) || 0
    _renderCombate()
    salvar()
  }

  // Modal de item — toggles de categoria e checkboxes
  window.toggleCategoriaItem = (val) => {
    document.getElementById('camposEquipamento').style.display = val === 'equipamento' ? 'block' : 'none'
  }
  window.toggleBonusAtaque = () => {
    const chk = document.getElementById('itemUsadoAtaque')
    document.getElementById('campoBonusAtaque').style.display = chk.checked ? 'block' : 'none'
  }
  window.toggleBonusDefesa = () => {
    const chk = document.getElementById('itemUsadoDefesa')
    document.getElementById('campoBonusDefesa').style.display = chk.checked ? 'block' : 'none'
  }

  // Visibilidade
  window.toggleVisibilidade = (campo, valor) => {
    ficha[campo] = valor
    _renderVisibilidade()
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
  window.fazerLogin  = () => {
    _loginFoiManual = true
    loginGoogle().catch(e => { _loginFoiManual = false; toastErro("Erro ao fazer login.") })
  }
  window.fazerLogout = () => logout()
  window._renderVisibilidade = _renderVisibilidade
}

// ═══════════════════════════════════════════════════════════