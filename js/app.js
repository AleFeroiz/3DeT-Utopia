// ============================================================
//  app.js — Fase 1: carregamento limpo, salvar único, sem duplicatas
// ============================================================

import { Storage }  from "./storage.js"
import { Ficha }    from "./modelos/Ficha.js"
import { RACAS }    from "./dados/racas.js"
import { LISTA_PERICIAS } from "./dados/banco.js?v=600000"
import { sincronizarAtributosParaFicha, renderAtributos, renderStatus, renderPontos, atualizarBarras, _atualizarTesteMorte } from "./ui/uiAtributos.js"
import { renderElementos, renderPericias, renderCaracteristicasIsoladas } from "./ui/uiElementos.js"
import { resumoEscolhas } from "./ui/uiResumoEscolhas.js"
import {
  registrarCallbacks, abrirListaLivro, abrirCriarElemento, confirmarCriacaoElemento,
  abrirCriarFonte, atualizarCustoFonte, atualizarSubtipoFonte, confirmarSalvarFonte,
  abrirCriarCaracteristica, atualizarEscala, atualizarLimiteEscala, confirmarCriarCaracteristica,
  renderCaracteristicasFonte, trocarAbaCarac, fecharModal, atualizarPreviewCarac,
  toggleVariante, selecionarAbaVariante, alternarTipoCarac,
  registrarCallbackIsolada, abrirCriarCaracteristicaIsolada,
  atualizarEscalaIsolada, confirmarCaracIsolada, alternarTipoIsolada,
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
  registrarIndicePublico, removerIndicePublico,
  carregarFichaDeOutroUsuario, salvarFichaComoEditor,
  escutarFicha,
  salvarIndiceFichasFirestore, carregarIndiceFichasFirestore, aguardarAuth, estaConfigurado
} from "./firebase.js?v=542442"

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

function _mostrarFichaPrivada() {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0f172a;font-family:sans-serif">
      <div style="text-align:center;padding:40px;max-width:400px">
        <div style="font-size:56px;margin-bottom:16px">🔒</div>
        <h2 style="color:#e2e8f0;margin:0 0 12px">Ficha Privada</h2>
        <p style="color:#94a3b8;margin:0 0 28px;line-height:1.6">
          Esta ficha não está disponível para visualização pública.
        </p>
        <a href="index.html" style="display:inline-block;padding:10px 24px;
          background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;
          font-weight:600">← Voltar ao início</a>
      </div>
    </div>`
}

// ── Estado da ficha aberta ────────────────────────────────
let ficha       = null
let _fichaId    = null
let _fichaModo  = "player"
let _fichaOwner     = true
let _loginFoiManual = false   // evita loop: onLogin só redireciona se o login foi ação do usuário
let _fichaOwnerUid  = null    // uid do dono real da ficha (preenchido ao abrir ficha de terceiro)
let _fichaOwnerModo = null    // modo do dono (player/mestre) para salvar como editor externo
let _fichaEraPublica = false  // rastreia se a ficha estava pública ao ser carregada
let _unsubscribeFicha = null  // função para cancelar listener realtime
let _ultimaEdicaoLocal = 0    // timestamp da última edição local (throttle realtime)

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
      // Logado: tenta carregar como dono (ficha privada própria)
      const remoto = await carregarFichaFirestore(urlId, urlModo)
      if (remoto && !remoto._soMetadados) {
        ficha            = Ficha.fromJSON(remoto)
        _fichaOwner      = true
        _fichaOwnerUid   = user.uid
        _fichaOwnerModo  = urlModo
        _fichaEraPublica = remoto.isPublic ?? false
        Storage.salvarFichaPorId(ficha.toJSON(), _fichaModo)
      }
    }

    if (!ficha) {
      // Não logado OU não é o dono: tenta localStorage (cache offline do próprio dono)
      const found = Storage.carregarFichaPorId(urlId)
      if (found && !found.ficha._soMetadados) {
        ficha            = Ficha.fromJSON(found.ficha)
        _fichaModo       = found.modo
        _fichaOwner      = true
        _fichaOwnerUid   = getUser()?.uid ?? null
        _fichaOwnerModo  = found.modo
        _fichaEraPublica = found.ficha.isPublic ?? false
      }
    }

    if (!ficha && estaConfigurado()) {
      // Ficha de outro usuário: resolve via public_index → lê ficha real do dono
      const publica = await carregarFichaDeOutroUsuario(urlId)
      if (publica) {
        ficha            = Ficha.fromJSON(publica)
        const user       = getUser()
        _fichaOwner      = !!(user && publica._ownerUid === user.uid)
        _fichaOwnerUid   = publica._ownerUid ?? null
        _fichaOwnerModo  = publica._modo ?? "player"
        _fichaEraPublica = true
      } else {
        // public_index não existe OU ficha não é pública:
        // pode ser ficha privada de outro usuário ou id inválido
        _mostrarFichaPrivada()
        _showLoading(false)
        return
      }
    }

    // Se ainda não achou ficha com urlId → id inválido/inacessível
    if (!ficha) {
      if (urlId) {
        // Tinha um id na URL mas não encontrou em lugar nenhum
        _mostrarFichaPrivada()
        _showLoading(false)
        return
      }
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
  _fichaEraPublica = ficha.isPublic ?? false   // rastreia mudança de visibilidade

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
    ficha.calcularPontos()
    renderTudo(); salvar()
  })

  // ── Render inicial ───────────────────────────────────
  renderTudo()
  _bindNomeEditavel()
  _bindStatusInputs()
  _bindRetrato()
  _bindCorTema()
  expor()
  _atualizarUILogin()
  _renderCombate()
  _renderVisibilidade()
  _iniciarEscutaRealtime()  // escuta mudanças remotas se ficha for pública

}) // fim DOMContentLoaded

function _renderPericias() {
  const somenteLeitura = !_fichaOwner && !ficha.editPublic
  renderPericias(ficha,
    (id) => { ficha.togglePericia(id); _renderPericias(); renderPontos(ficha); salvar() },
    (id) => {
      const res = ficha.toggleMaestria(id)
      if (!res.ok) { toastAviso(res.motivo); return }
      _renderPericias(); renderPontos(ficha); salvar()
      toastSucesso(ficha.maestrias[id] ? "Maestria aplicada! (2 PT)" : "Maestria removida.")
    },
    somenteLeitura
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
  const somenteLeitura   = !_fichaOwner && !ficha.editPublic
  const editavelExterno  = !_fichaOwner && ficha.editPublic   // terceiro com permissão de edição
  const container = document.querySelector(".ficha-container")
  if (!container) return

  let banner = document.getElementById("bannerLeitura")

  if (somenteLeitura) {
    // Desabilita inputs/botões (exceto área de login)
    container.querySelectorAll("input, textarea, button, select").forEach(el => {
      if (el.closest(".login-area")) return
      el.disabled = true
    })
    // Bloqueia contenteditable
    container.querySelectorAll("[contenteditable]").forEach(el => {
      el.setAttribute("contenteditable", "false")
      el.style.cursor = "default"
    })
    // Banner de leitura
    if (!banner) {
      banner = document.createElement("div")
      banner.id = "bannerLeitura"
      banner.className = "banner-leitura"
      banner.innerHTML = `👁️ Modo visualização — esta ficha está somente para leitura`
      document.querySelector(".ficha-container").prepend(banner)
    }
  } else {
    // Reabilita inputs/botões
    container.querySelectorAll("input, textarea, button, select").forEach(el => {
      el.disabled = false
    })
    // Reabilita contenteditable — mas nome é sempre exclusivo do dono
    container.querySelectorAll("[contenteditable]").forEach(el => {
      el.setAttribute("contenteditable", "true")
      el.style.cursor = ""
    })
    // Se é editor externo (não dono), bloqueia só o nome da ficha
    if (editavelExterno) {
      const nomeEl = document.getElementById("nomeFicha")
      if (nomeEl) {
        nomeEl.setAttribute("contenteditable", "false")
        nomeEl.style.cursor = "default"
        nomeEl.title = "Apenas o dono pode renomear esta ficha"
      }
    }
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
  const _invSomenteLeitura = !_fichaOwner && !ficha.editPublic
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

    // Badges de bônus (só mostram quando CAN usar E está equipado)
    const badgeAtk = (item.categoria === "equipamento" && item.usadoAtaque && item.equipadoAtaque)
      ? `<span class="inv-badge inv-badge-atk">⚔️ +${item.bonusAtaque ?? 0}</span>` : ""
    const badgeDef = (item.categoria === "equipamento" && item.usadoDefesa && item.equipadoDefesa)
      ? (() => {
          const bonus = Number(item.bonusDefesa) || 0
          const prio  = Math.max(1, Number(item.prioridadeDefesa) || 1)
          const efet  = Math.trunc(bonus / prio)
          const prioBadge = prio > 1 ? ` <span style="opacity:0.6;font-size:10px">(÷${prio})</span>` : ""
          return `<span class="inv-badge inv-badge-def" title="Bônus bruto: ${bonus} ÷ prioridade ${prio} = ${efet}">🛡️ +${efet}${prioBadge}</span>`
        })() : ""
    const badgeCat = item.categoria === "equipamento"
      ? `<span class="inv-badge inv-badge-equip">Equip.</span>` : ""
    const pericia  = LISTA_PERICIAS.find(p => p.id === item.pericia)
    const badgePericia = pericia
      ? `<span class="inv-badge inv-badge-pericia" title="Perícia: ${pericia.nome}">${pericia.emoji} ${pericia.nome}</span>` : ""
    // Badge de categoria do equipamento
    const badgeCatNum = (item.categoria === "equipamento" && item.catEquip)
      ? `<span class="inv-badge" style="background:rgba(30,64,175,0.3);color:#93c5fd;border:1px solid rgba(59,130,246,0.3)" title="Categoria ${item.catEquip}">Cat. ${item.catEquip}</span>` : ""
    // Badges de encantamentos
    const encantsHtml = (item.encantamentos ?? []).map(e =>
      `<span class="inv-badge inv-badge-encant" title="${e.desc}">${e.emoji} ${e.nome}${e.extra ? ' ('+e.extra+')' : ''}</span>`
    ).join("")

    // Badge de alcance ideal
    const _alcLabels = {corpo_a_corpo:"🤜 Corpo a corpo",curto:"📏 Curto",longo:"📐 Longo",muito_longo:"🎯 Muito longo",fora_de_alcance:"❌ Fora de alcance"}
    const badgeAlcance = (item.categoria === "equipamento" && item.usadoAtaque && item.equipadoAtaque && item.alcanceIdeal)
      ? `<span class="inv-badge inv-badge-alcance" title="Alcance ideal">${_alcLabels[item.alcanceIdeal] ?? item.alcanceIdeal}</span>` : ""

    // Checkboxes de "em uso" — aparecem sempre que o equipamento PODE ser usado para ataque/defesa
    const checkAtk = (item.categoria === "equipamento" && item.usadoAtaque && !_invSomenteLeitura)
      ? `<label class="inv-check-uso" title="Ativar bônus de ataque">
           <input type="checkbox" ${item.equipadoAtaque ? "checked" : ""} onchange="toggleEquipado('${item.id}','ataque',this.checked)">
           ⚔️
         </label>` : ""
    const checkDef = (item.categoria === "equipamento" && item.usadoDefesa && !_invSomenteLeitura)
      ? `<label class="inv-check-uso" title="Ativar bônus de defesa">
           <input type="checkbox" ${item.equipadoDefesa ? "checked" : ""} onchange="toggleEquipado('${item.id}','defesa',this.checked)">
           🛡️
         </label>` : ""

    const botoesAcao = _invSomenteLeitura ? `
        <div class="inv-item-acoes">
          <button class="btn-editar" title="Ver detalhes" onclick="toggleDetalheItem('${item.id}')">👁️</button>
        </div>` : `
        <div class="inv-item-acoes">
          ${checkAtk}${checkDef}
          <button class="btn-editar" onclick="abrirEditarItem('${item.id}')">✏️</button>
          <button class="btn-remover" onclick="removerItem('${item.id}')">🗑️</button>
        </div>`

    // Painel de detalhes expandível (para modo leitura)
    const restricoesHtml = [...(item.restricoes ?? [])].map(r =>
      `<span style="font-size:11px;background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.25);border-radius:4px;padding:2px 6px">${r.nome ?? r}</span>`
    ).join(" ")
    const detalhePanel = _invSomenteLeitura ? `
      <div id="detalhe_${item.id}" class="inv-item-detalhe" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);font-size:12px;color:#94a3b8;display:none">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px">
          <span>⚖️ Peso: <b style="color:#e2e8f0">${item.peso ?? 0}</b></span>
          ${item.catEquip ? `<span>🏷️ Cat. <b style="color:#93c5fd">${item.catEquip}</b></span>` : ""}
          ${item.usadoAtaque ? `<span>⚔️ Atk bruto: <b style="color:#fbbf24">+${item.bonusAtaque ?? 0}</b></span>` : ""}
          ${item.usadoAtaque && item.alcanceIdeal ? (() => {
            const labels = {corpo_a_corpo:"🤜 Corpo a corpo",curto:"📏 Curto",longo:"📐 Longo",muito_longo:"🎯 Muito longo",fora_de_alcance:"❌ Fora de alcance"}
            return `<span style="color:#a78bfa">${labels[item.alcanceIdeal] ?? item.alcanceIdeal}</span>`
          })() : ""}
          ${item.usadoDefesa ? (() => {
            const b = Number(item.bonusDefesa)||0; const p = Math.max(1,Number(item.prioridadeDefesa)||1); const e = Math.trunc(b/p)
            return `<span>🛡️ Def bruto: <b style="color:#4ade80">+${b}</b>${p>1?` ÷${p} = <b style="color:#4ade80">${e}</b>`:""}</span>`
          })() : ""}
        </div>
        ${restricoesHtml ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">${restricoesHtml}</div>` : ""}
      </div>` : ""

    card.innerHTML = `
      <div class="inv-item-info">
        <div class="inv-item-nome">${item.nome} ${badgeCat}${badgeCatNum}${badgePericia}${badgeAtk}${badgeDef}${badgeAlcance}${encantsHtml}</div>
        ${item.descricao ? `<div class="inv-item-desc">${item.descricao}</div>` : ""}
        ${detalhePanel}
      </div>
      <div class="inv-item-direita">
        <span class="inv-item-peso" style="color:${(item.peso??0)<0?'#4ade80':''};${_invSomenteLeitura?'display:none':''}">⚖️ ${item.peso ?? 0}</span>
        ${botoesAcao}
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
  set('defContra',    bonusDef + res         + (ex.defContra     ?? 0))

  // Toggle visual
  document.getElementById('togglePoder')?.classList.toggle('active',      _atribCombate === 'poder')
  document.getElementById('toggleHabilidade')?.classList.toggle('active', _atribCombate === 'habilidade')
}

function _renderNome() {
  const el = document.getElementById("nomeFicha")
  if (!el) return
  // Sempre sincroniza o nome visível com o dado real da ficha
  if (document.activeElement !== el) {
    el.textContent = ficha.nome ?? "Nova Ficha"
  }
  // Não-donos nunca podem editar o nome, independente de editPublic
  if (!_fichaOwner) {
    el.setAttribute("contenteditable", "false")
    el.style.cursor = "default"
  }
}

function renderTudo() {
  ficha.calcularPontos()
  _renderNome()
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
  const _somenteLeitura = !_fichaOwner && !ficha.editPublic
  renderElementos(ficha, {
    onEditar:       (id) => { const el = ficha.encontrarElemento(id); if (el) abrirCriarElemento(el.tipo, el) },
    onRemover:      (id) => { ficha.removerElemento(id); renderTudo(); salvar() },
    onEditarFonte:  (id) => { const f = ficha.encontrarElemento(id); if (f) abrirCriarFonte(f) },
    onExpandirFonte:(id) => { const f = ficha.encontrarElemento(id); if (f) _abrirExpandirFonte(f) }
  }, _somenteLeitura)
  renderCaracteristicasIsoladas(ficha, {
    onEditar:  (i) => {
      const c = ficha.caracteristicasIsoladas?.[i]
      if (c) abrirCriarCaracteristicaIsolada(i, c)
    },
    onRemover: (i) => {
      ficha.caracteristicasIsoladas?.splice(i, 1)
      renderTudo(); salvar()
    }
  }, _somenteLeitura)
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
    mLimite.innerText   = ficha.maestraLimite
    mLimite.style.color = offset !== 0 ? "#fbbf24" : ""
    const mHint = document.getElementById("maestriaLimiteOffset")
    if (mHint) {
      const auto = ficha.dadosNivel.maestriaLimite
      mHint.textContent = offset !== 0 ? `(base ${auto} ${offset > 0 ? "+" : ""}${offset})` : ""
    }
  }

  // Pontos offset hint
  const offEl = document.getElementById("pontosOffset")
  if (offEl) {
    const off = ficha.pontos.offsetTotal ?? 0
    offEl.textContent = off !== 0 ? `(base ${ficha.pontos.totalAuto} ${off > 0 ? "+" : ""}${off})` : ""
  }
}

// ─────────────────────────────────────────────────────────
//  REALTIME — escuta mudanças remotas na ficha
// ─────────────────────────────────────────────────────────
function _iniciarEscutaRealtime() {
  // Só escuta se a ficha for pública (qualquer situação: dono ou externo)
  if (!ficha.isPublic || !estaConfigurado()) return
  if (!_fichaId || !_fichaOwnerUid) return

  // Cancela escuta anterior se existir
  _pararEscutaRealtime()

  _unsubscribeFicha = escutarFicha(
    _fichaId,
    _fichaOwnerModo ?? _fichaModo,
    _fichaOwnerUid,
    (dadosRemotos) => {
      // Dono: ignora updates remotos se editou localmente nos últimos 3s
      // (evita sobrescrever o que ele está digitando)
      // Editor externo: SEMPRE aplica — o snapshot é a confirmação do próprio save
      if (_fichaOwner && Date.now() - _ultimaEdicaoLocal < 3000) return

      // Ignora se os dados são idênticos (evita re-render desnecessário)
      try {
        const localJson  = JSON.stringify(ficha.toJSON())
        const remotoJson = JSON.stringify(dadosRemotos)
        if (localJson === remotoJson) return
      } catch(_) {}

      // Aplica a versão remota e re-renderiza silenciosamente
      ficha = Ficha.fromJSON(dadosRemotos)
      ficha.calcularStatus()
      ficha.calcularPontos()
      renderTudo()
    }
  )
}

function _pararEscutaRealtime() {
  if (_unsubscribeFicha) {
    _unsubscribeFicha()
    _unsubscribeFicha = null
  }
}

// Marca que houve edição local agora (chama antes de salvar)
function _marcarEdicaoLocal() {
  _ultimaEdicaoLocal = Date.now()
}

// ─────────────────────────────────────────────────────────
//  PERSISTÊNCIA
// ─────────────────────────────────────────────────────────
async function salvar() {
  if (!_fichaOwner && !ficha.editPublic) return

  _marcarEdicaoLocal()  // throttle: ignora updates remotos por 3s após edição local
  const fichaJson = ficha.toJSON()

  // localStorage sempre (cache offline)
  if (_fichaId && _fichaOwner) Storage.salvarFichaPorId(fichaJson, _fichaModo)

  if (!estaConfigurado()) { _setSaveStatus("salvo"); return }

  _setSaveStatus("salvando")

  try {
    const user = getUser()

    if (_fichaOwner && user && _fichaId) {
      // ── DONO: salva na própria coleção privada ──────────
      await salvarFichaFirestore({ ...fichaJson, _ownerUid: user.uid }, _fichaModo)

      // Atualiza índice de forma cirúrgica preservando pastaId
      try {
        const indiceAtual = await carregarIndiceFichasFirestore(_fichaModo) ?? []
        const metaAtual   = indiceAtual.find(m => m.id === fichaJson.id)
        const novoMeta    = {
          id:          fichaJson.id,
          nome:        fichaJson.nome ?? "Sem Nome",
          nivel:       fichaJson.nivel ?? 1,
          racaId:      fichaJson.racaId ?? "",
          profissaoId: fichaJson.profissaoId ?? "",
          pastaId:     metaAtual?.pastaId ?? fichaJson.pastaId ?? null,
          imagemThumb: fichaJson.imagemThumb ?? metaAtual?.imagemThumb ?? null,
          corTema:     fichaJson.corTema ?? "#3b82f6",
        }
        const indiceAtualizado = indiceAtual.some(m => m.id === fichaJson.id)
          ? indiceAtual.map(m => m.id === fichaJson.id ? novoMeta : m)
          : [...indiceAtual, novoMeta]
        salvarIndiceFichasFirestore(indiceAtualizado, _fichaModo)
      } catch(eIdx) {
        console.warn("[salvar] erro ao atualizar índice:", eIdx)
      }

      // Gerencia public_index conforme flag isPublic
      if (fichaJson.isPublic) {
        // Registra (ou atualiza) entrada no índice público
        await registrarIndicePublico(fichaJson.id, user.uid, _fichaModo)
        _fichaEraPublica = true
      } else if (_fichaEraPublica) {
        // Ficha deixou de ser pública: remove do índice público
        await removerIndicePublico(fichaJson.id)
        _fichaEraPublica = false
      }

    } else if (!_fichaOwner && ficha.editPublic && _fichaId && _fichaOwnerUid) {
      // ── EDITOR EXTERNO: salva direto na ficha do dono ──
      await salvarFichaComoEditor(
        { ...fichaJson, _ownerUid: _fichaOwnerUid },
        _fichaOwnerUid,
        _fichaOwnerModo ?? "player"
      )
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

  // Só o dono pode renomear — terceiros (mesmo com editPublic) não alteram nome
  el.addEventListener("blur", () => {
    if (!_fichaOwner) { el.textContent = ficha.nome ?? "Nova Ficha"; return }
    const novo = (el.textContent ?? "").replace(/[\n\r]+/g, " ").trim()
    if (novo) {
      ficha.nome = novo
      el.textContent = novo
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
//  BIND — Cor tema da ficha
// ─────────────────────────────────────────────────────────
function _aplicarCorTema(cor) {
  const c = cor || "#3b82f6"
  const [h, s] = _hexToHsl(c)

  // Variações diretas da cor tema (para botões, bordas ativas, destaques)
  document.documentElement.style.setProperty("--cor-tema",      c)
  document.documentElement.style.setProperty("--cor-tema-dark", _darken(c, 0.7))
  document.documentElement.style.setProperty("--cor-tema-dim",  c + "22")
  document.documentElement.style.setProperty("--cor-tema-mid",  c + "55")

  // Paleta de fundo derivada da matiz da cor tema
  // Cada camada é progressivamente mais clara, mantendo saturação baixa
  // para não competir com os elementos de UI
  const sat = Math.min(s * 0.35, 25) // saturação bem reduzida nos fundos
  document.documentElement.style.setProperty("--bg-deepest", `hsl(${h},${sat}%,2%)`)   // #020617 equiv
  document.documentElement.style.setProperty("--bg-base",    `hsl(${h},${sat}%,7%)`)   // #0f172a equiv
  document.documentElement.style.setProperty("--bg-deep",    `hsl(${h},${sat}%,4%)`)   // #0a1628 equiv
  document.documentElement.style.setProperty("--bg-card",    `hsl(${h},${sat}%,13%)`)  // #1e293b equiv
  document.documentElement.style.setProperty("--bg-input",   `hsl(${h},${sat}%,10%)`)  // #0c1a3a equiv
  document.documentElement.style.setProperty("--bg-darker",  `hsl(${h},${sat}%,5%)`)   // #080f1e equiv
  document.documentElement.style.setProperty("--bg-hover",   `hsl(${h},${sat}%,17%)`)  // #334155 equiv
  document.documentElement.style.setProperty("--bg-accent",  `hsl(${h},${Math.min(s * 0.5, 35)}%,18%)`) // #1e3a5f equiv
  document.documentElement.style.setProperty("--border",     `hsl(${h},${sat}%,20%)`)  // #334155 equiv
  document.documentElement.style.setProperty("--border-dim", `hsl(${h},${sat}%,12%)`)  // #1e293b equiv

  // Atualiza também o background do body com gradiente derivado
  document.body.style.background = `linear-gradient(135deg, hsl(${h},${sat}%,7%), hsl(${h},${sat}%,2%))`
}

/** Converte hex para [hue, saturation, lightness] */
function _hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3), 16) / 255
  let g = parseInt(hex.slice(3,5), 16) / 255
  let b = parseInt(hex.slice(5,7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
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

/** Escurece uma cor hex multiplicando os canais por `factor` (0-1) */
function _darken(hex, factor) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  const d = (v) => Math.round(v * factor).toString(16).padStart(2, "0")
  return `#${d(r)}${d(g)}${d(b)}`
}

function _bindCorTema() {
  const input = document.getElementById("fichaCorInput")
  const wrap  = document.getElementById("fichaCorWrap")
  if (!input) return

  // Aplica a cor atual da ficha ao carregar
  const corAtual = ficha.corTema ?? "#3b82f6"
  input.value = corAtual
  _aplicarCorTema(corAtual)

  // Só o dono pode editar
  if (!_fichaOwner) {
    input.disabled = true
    if (wrap) wrap.style.opacity = "0.4"
    if (wrap) wrap.style.pointerEvents = "none"
    return
  }

  // Atualiza em tempo real enquanto arrasta o picker
  input.addEventListener("input", () => {
    ficha.corTema = input.value
    _aplicarCorTema(input.value)
  })

  // Salva só ao soltar (evita salvar a cada pixel arrastado)
  input.addEventListener("change", () => {
    ficha.corTema = input.value
    _aplicarCorTema(input.value)
    salvar()
  })
}

// ─────────────────────────────────────────────────────────
//  BIND — Retrato do personagem
// ─────────────────────────────────────────────────────────
function _bindRetrato() {
  const grande  = document.getElementById("fichaRetratoGrande")
  const input   = document.getElementById("fichaRetratoInput")
  const btnEdit = document.getElementById("fichaRetratoBtnEditar")
  const btnDel  = document.getElementById("fichaRetratoBtnRemover")
  if (!grande || !input) return

  function _atualizarRetratoUI() {
    if (ficha.imagemUrl) {
      grande.style.backgroundImage = `url('${ficha.imagemUrl}')`
      grande.style.fontSize = "0"
      grande.textContent = ""
      if (btnDel) btnDel.style.display = "flex"
    } else {
      grande.style.backgroundImage = ""
      grande.style.fontSize = ""
      grande.textContent = "👤"
      if (btnDel) btnDel.style.display = "none"
    }
    if (btnEdit) btnEdit.style.display = _fichaOwner ? "flex" : "none"
  }

  _atualizarRetratoUI()
  if (!_fichaOwner) return

  grande.addEventListener("click", () => input.click())
  if (btnEdit) btnEdit.addEventListener("click", () => input.click())

  if (btnDel) btnDel.addEventListener("click", (e) => {
    e.stopPropagation()
    ficha.imagemUrl   = null
    ficha.imagemThumb = null
    _atualizarRetratoUI()
    salvar()
  })

  input.addEventListener("change", () => {
    const file = input.files[0]
    if (!file) return
    input.value = ""
    const reader = new FileReader()
    reader.onload = (ev) => _abrirCropModal(ev.target.result, async (croppedUrl) => {
      ficha.imagemUrl   = croppedUrl
      ficha.imagemThumb = await _gerarThumbnail(croppedUrl, 80)
      _atualizarRetratoUI()
      salvar()
    })
    reader.readAsDataURL(file)
  })
}

/** Gera uma thumbnail quadrada reduzida (tamanho px) em base64 */
function _gerarThumbnail(base64, tamanho = 80) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = tamanho; canvas.height = tamanho
      const ctx = canvas.getContext("2d")
      // Crop central quadrado
      const lado = Math.min(img.width, img.height)
      const ox   = (img.width  - lado) / 2
      const oy   = (img.height - lado) / 2
      ctx.drawImage(img, ox, oy, lado, lado, 0, 0, tamanho, tamanho)
      resolve(canvas.toDataURL("image/jpeg", 0.7))
    }
    img.src = base64
  })
}

/** Abre o modal de crop — o usuário arrasta para posicionar e confirma */
function _abrirCropModal(srcBase64, onConfirm) {
  // Remove modal anterior se existir
  document.getElementById("cropModal")?.remove()

  const modal = document.createElement("div")
  modal.id = "cropModal"
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.85);
    display:flex;align-items:center;justify-content:center;z-index:9999;`

  modal.innerHTML = `
    <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:16px;
                padding:24px;display:flex;flex-direction:column;gap:16px;
                max-width:min(480px,92vw);width:100%">
      <p style="color:#f1f5f9;font-size:15px;font-weight:600;margin:0">
        ✂️ Ajustar Retrato
      </p>
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Arraste a imagem para posicionar. A área circular será o retrato.
      </p>

      <!-- Viewport de crop -->
      <div id="cropViewport" style="
        position:relative;width:260px;height:260px;
        border-radius:50%;overflow:hidden;
        border:3px solid #3b82f6;
        align-self:center;cursor:grab;
        background:#000;flex-shrink:0">
        <img id="cropImg" src="${srcBase64}" draggable="false" style="
          position:absolute;user-select:none;max-width:none;"/>
      </div>

      <!-- Slider de zoom -->
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;color:#64748b">🔍</span>
        <input type="range" id="cropZoom" min="50" max="300" value="100" style="flex:1;accent-color:#3b82f6">
        <span style="font-size:12px;color:#64748b" id="cropZoomLabel">100%</span>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="cropCancelar" style="
          padding:8px 18px;border:1px solid #334155;background:#1e293b;
          color:#94a3b8;border-radius:8px;cursor:pointer;font-size:13px">Cancelar</button>
        <button id="cropConfirmar" style="
          padding:8px 18px;border:none;background:#1d4ed8;
          color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Usar Retrato</button>
      </div>
    </div>`

  document.body.appendChild(modal)

  const viewport = document.getElementById("cropViewport")
  const img      = document.getElementById("cropImg")
  const zoom     = document.getElementById("cropZoom")
  const zoomLbl  = document.getElementById("cropZoomLabel")

  const VP = 260  // tamanho do viewport em px
  let scale = 1, ox = 0, oy = 0
  let dragging = false, startX = 0, startY = 0, startOx = 0, startOy = 0

  function _clamp() {
    const w = img.naturalWidth  * scale
    const h = img.naturalHeight * scale
    ox = Math.min(0, Math.max(VP - w, ox))
    oy = Math.min(0, Math.max(VP - h, oy))
  }

  function _aplicar() {
    img.style.width     = (img.naturalWidth  * scale) + "px"
    img.style.height    = (img.naturalHeight * scale) + "px"
    img.style.left      = ox + "px"
    img.style.top       = oy + "px"
  }

  img.onload = () => {
    // Zoom inicial: preenche o viewport
    const minScale = Math.max(VP / img.naturalWidth, VP / img.naturalHeight)
    scale = minScale
    ox = (VP - img.naturalWidth  * scale) / 2
    oy = (VP - img.naturalHeight * scale) / 2
    zoom.min = Math.round(minScale * 100)
    zoom.value = Math.round(scale * 100)
    zoomLbl.textContent = zoom.value + "%"
    _aplicar()
  }

  zoom.addEventListener("input", () => {
    const cx = VP / 2, cy = VP / 2
    const newScale = +zoom.value / 100
    ox = cx - (cx - ox) * (newScale / scale)
    oy = cy - (cy - oy) * (newScale / scale)
    scale = newScale
    _clamp(); _aplicar()
    zoomLbl.textContent = zoom.value + "%"
  })

  // Drag
  const onDown = (e) => {
    dragging = true
    const pt = e.touches ? e.touches[0] : e
    startX = pt.clientX; startY = pt.clientY
    startOx = ox;        startOy = oy
    viewport.style.cursor = "grabbing"
    e.preventDefault()
  }
  const onMove = (e) => {
    if (!dragging) return
    const pt = e.touches ? e.touches[0] : e
    ox = startOx + (pt.clientX - startX)
    oy = startOy + (pt.clientY - startY)
    _clamp(); _aplicar()
    e.preventDefault()
  }
  const onUp = () => { dragging = false; viewport.style.cursor = "grab" }

  viewport.addEventListener("mousedown",  onDown)
  viewport.addEventListener("mousemove",  onMove)
  viewport.addEventListener("mouseup",    onUp)
  viewport.addEventListener("mouseleave", onUp)
  viewport.addEventListener("touchstart", onDown, { passive: false })
  viewport.addEventListener("touchmove",  onMove, { passive: false })
  viewport.addEventListener("touchend",   onUp)

  const fechar = () => modal.remove()

  document.getElementById("cropCancelar").onclick = fechar
  modal.addEventListener("click", e => { if (e.target === modal) fechar() })

  document.getElementById("cropConfirmar").onclick = () => {
    // Renderiza o crop num canvas quadrado 400px
    const OUT = 400
    const canvas = document.createElement("canvas")
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext("2d")
    // ox/oy são em pixels do viewport (260px) — converte para coords da imagem original
    const srcX = -ox / scale
    const srcY = -oy / scale
    const srcW = VP  / scale
    ctx.drawImage(img, srcX, srcY, srcW, srcW, 0, 0, OUT, OUT)
    const result = canvas.toDataURL("image/jpeg", 0.88)
    fechar()
    onConfirm(result)
  }
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
        const auto = ficha.status[chave].auto  // valor automático base (sem offset)
        ficha.status[chave].offset = val - auto
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
  // "usado" é especial: o usuário digita o valor final, salvamos o offset (val - gastosAuto)
  const elUsado = document.getElementById("usado")
  if (elUsado) {
    elUsado.addEventListener("blur", () => {
      const val = parseInt(elUsado.innerText) || 0
      if (val >= 0) {
        ficha.pontos.offsetGastos = val - (ficha.pontos.gastosAuto ?? 0)
        ficha.pontos.gastos = val
        renderPontos(ficha)
        salvar()
      } else {
        elUsado.innerText = ficha.pontos.gastos ?? 0
      }
    })
    elUsado.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); elUsado.blur() } })
    elUsado.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }

  // "total" é especial: o usuário digita o valor final, mas salvamos o offset (val - totalAuto)
  const elTotal = document.getElementById("total")
  if (elTotal) {
    elTotal.addEventListener("blur", () => {
      const val = parseInt(elTotal.innerText) || 0
      if (val >= 0) {
        ficha.pontos.offsetTotal = val - (ficha.pontos.totalAuto ?? 0)
        ficha.pontos.total = val
        renderPontos(ficha)
        _renderNivel()
        salvar()
      } else {
        elTotal.innerText = ficha.pontos.total ?? 0
      }
    })
    elTotal.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); elTotal.blur() } })
    elTotal.addEventListener("keypress", e => { if (!/[0-9]/.test(e.key)) e.preventDefault() })
  }

  // Maestria limite (contenteditable)
  const mLimite = document.getElementById("maestriaLimite")
  if (mLimite) {
    mLimite.addEventListener("blur", () => {
      const val = parseInt(mLimite.innerText) || 0
      // usa o método do modelo que calcula o offset corretamente a partir do auto do nível
      ficha.setMaestraLimiteManual(val)
      _renderNivel()
      // atualiza hint de offset do limite de maestrias
      const mHint = document.getElementById("maestriaLimiteOffset")
      if (mHint) {
        const off = ficha.maestrasCfg?.offsetLimite ?? 0
        const auto = ficha.dadosNivel.maestriaLimite
        mHint.textContent = off !== 0 ? `(base ${auto} ${off > 0 ? "+" : ""}${off})` : ""
      }
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
function _popularSelectPericias() {
  const sel = document.getElementById("itemPericia")
  if (!sel) return
  // Só repopula se estiver vazio (evita re-render desnecessário)
  if (sel.options.length > 1) return
  sel.innerHTML = `<option value="">— escolha uma perícia —</option>`
  LISTA_PERICIAS.forEach(p => {
    const opt = document.createElement("option")
    opt.value = p.id
    opt.textContent = `${p.emoji} ${p.nome}`
    sel.appendChild(opt)
  })
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
  window.alternarTipoCarac        = alternarTipoCarac
  window.alternarTipoIsolada      = alternarTipoIsolada

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

  window.toggleEquipado = (id, tipo, valor) => {
    const item = ficha.inventario.itens.find(i => i.id === id)
    if (!item) return
    if (tipo === 'ataque') item.equipadoAtaque = valor
    else                   item.equipadoDefesa = valor
    _renderInventario()
    salvar()
  }

  // Expande/colapsa painel de detalhes no modo somente-leitura
  window.toggleDetalheItem = (id) => {
    const el = document.getElementById(`detalhe_${id}`)
    if (!el) return
    const aberto = el.style.display !== "none"
    el.style.display = aberto ? "none" : "block"
    // Atualiza ícone do botão
    const btn = el.closest(".inv-item-card")?.querySelector(".btn-editar")
    if (btn) btn.textContent = aberto ? "👁️" : "🔼"
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
    // Reset perícia
    _popularSelectPericias()
    document.getElementById("itemPericia").value = ""
    // Reset categoria
    document.querySelector('input[name="itemCategoria"][value="item"]').checked = true
    document.getElementById("camposEquipamento").style.display   = "none"
    document.getElementById("itemUsadoAtaque").checked           = false
    document.getElementById("itemUsadoDefesa").checked           = false
    document.getElementById("campoBonusAtaque").style.display    = "none"
    document.getElementById("campoBonusDefesa").style.display    = "none"
    document.getElementById("itemBonusAtaque").value             = "0"
    document.getElementById("itemBonusDefesa").value             = "0"
    document.getElementById("itemAlcanceIdeal").value            = "corpo_a_corpo"
    window.syncStepper?.("itemBonusAtaque")
    window.syncStepper?.("itemBonusDefesa")
    document.getElementById("itemPrioridadeDefesa").value        = "1"
    window.syncStepper?.("itemPrioridadeDefesa")
    const _prvReset = document.getElementById("defesaFinalDisplay")
    if (_prvReset) { _prvReset.textContent = "0"; _prvReset.style.color = "#4ade80" }
    _resetItemEncantamentos()
    fecharModal("modalItem")
    const _modalItem = document.getElementById("modalItem")
    _modalItem.classList.remove("hidden")
    // Fix: re-habilita os elementos do modal caso _aplicarModoLeitura os tenha desabilitado
    // (acontece quando editPublic=true — terceiro tem permissão de edição mas o container foi bloqueado)
    if (!_fichaOwner && ficha.editPublic) {
      _modalItem.querySelectorAll("input, textarea, button, select").forEach(el => { el.disabled = false })
    }
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
    // Restaurar perícia
    _popularSelectPericias()
    document.getElementById("itemPericia").value = item.pericia ?? ""
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
    document.getElementById("itemAlcanceIdeal").value         = item.alcanceIdeal ?? "corpo_a_corpo"
    // Defesa
    const usaDef = !!item.usadoDefesa
    document.getElementById("itemUsadoDefesa").checked        = usaDef
    document.getElementById("campoBonusDefesa").style.display = usaDef ? "block" : "none"
    document.getElementById("itemBonusDefesa").value          = item.bonusDefesa ?? 0
    window.syncStepper?.("itemBonusDefesa")
    document.getElementById("itemPrioridadeDefesa").value     = item.prioridadeDefesa ?? 1
    window.syncStepper?.("itemPrioridadeDefesa")
    _atualizarPreviewPrioridade()
    // Encantamentos
    if (cat === "equipamento") _carregarItemEncantamentos(item)
    else _resetItemEncantamentos()
    const _modalItemEdit = document.getElementById("modalItem")
    _modalItemEdit.classList.remove("hidden")
    // Fix: re-habilita elementos do modal caso editPublic tenha sido bloqueado
    if (!_fichaOwner && ficha.editPublic) {
      _modalItemEdit.querySelectorAll("input, textarea, button, select").forEach(el => { el.disabled = false })
    }
  }

  window.confirmarSalvarItem = () => {
    const nome = document.getElementById("itemNome").value.trim()
    if (!nome) { toastErro("Digite um nome para o item."); return }
    const pericia  = document.getElementById("itemPericia").value
    if (!pericia) { toastErro("Selecione uma perícia alvo para o item."); return }
    const cat     = document.querySelector('input[name="itemCategoria"]:checked')?.value ?? "item"
    const usaAtk  = cat === "equipamento" && document.getElementById("itemUsadoAtaque").checked
    const usaDef  = cat === "equipamento" && document.getElementById("itemUsadoDefesa").checked
    // Preserva estado equipado atual se editando; inicializa como true em itens novos
    const itemAtual = _itemEditandoId ? ficha.inventario.itens.find(i => i.id === _itemEditandoId) : null
    const item = {
      nome,
      pericia,
      descricao:      document.getElementById("itemDescricao").value.trim(),
      peso:           +document.getElementById("itemPeso").value || 0,
      categoria:      cat,
      usadoAtaque:    usaAtk,
      usadoDefesa:    usaDef,
      bonusAtaque:    usaAtk ? (+document.getElementById("itemBonusAtaque").value || 0) : 0,
      alcanceIdeal:   usaAtk ? (document.getElementById("itemAlcanceIdeal").value || "corpo_a_corpo") : undefined,
      bonusDefesa:    usaDef ? (+document.getElementById("itemBonusDefesa").value || 0) : 0,
      prioridadeDefesa: usaDef ? (Math.max(1, +document.getElementById("itemPrioridadeDefesa").value || 1)) : 1,
      // Encantamentos e categoria (só para equipamentos)
      catEquip:       cat === "equipamento" ? _itemCategoria : undefined,
      encantamentos:  cat === "equipamento" ? JSON.parse(JSON.stringify(_itemEncantamentos)) : [],
      restricoes:     cat === "equipamento" ? JSON.parse(JSON.stringify(_itemRestricoes))     : [],
      // equipadoAtaque/Defesa: se era item existente preserva; se novo inicializa como true (se tiver o bônus)
      equipadoAtaque: usaAtk ? (itemAtual ? (itemAtual.equipadoAtaque ?? true) : true) : false,
      equipadoDefesa: usaDef ? (itemAtual ? (itemAtual.equipadoDefesa ?? true) : true) : false,
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
    renderPontos(ficha)
    salvar()
  }

  window.removerItem = (id) => {
    ficha.removerItem(id)
    _renderInventario()
    renderPontos(ficha)
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

  // Versatilidade de Profissão
  window.confirmarVersatilidade = (slotKey, tipo) => {
    const sel = document.getElementById(`versSelect_${slotKey}`)
    if (!ficha.versatilidade) ficha.versatilidade = { slot1: null, slot2: null }
    const v = ficha.versatilidade

    if (tipo === 'nivel5') {
      // Aprofundar: usa a profissão do slot1 no slot2
      const prof1 = v.slot1?.profissaoId
      if (!prof1) { toastErro("Slot 1 precisa estar preenchido para aprofundar."); return }
      v.slot2 = { profissaoId: prof1, nivel: 5 }
    } else {
      // Expandir: nivel 1 de nova profissão
      const profId = sel?.value
      if (!profId) { toastErro("Selecione uma profissão."); return }
      v[slotKey] = { profissaoId: profId, nivel: 1 }
    }
    renderAbaProfissao(ficha)
    salvar()
    toastSucesso("Versatilidade salva!")
  }

  window.converterVersatilidadeEmPT = (slotKey) => {
    if (!ficha.versatilidade) ficha.versatilidade = { slot1: null, slot2: null }
    ficha.versatilidade[slotKey] = { convertido: true }
    // Adiciona +1 PT de ficha
    ficha.pontos.offsetTotal = (ficha.pontos.offsetTotal ?? 0) + 1
    ficha._sincronizarNivel()
    ficha.calcularPontos()
    renderTudo()
    salvar()
    toastSucesso("+1 PT de ficha adicionado!")
  }

  window.resetarVersatilidade = (slotKey) => {
    if (!confirm(`Resetar o ${slotKey === 'slot1' ? 'Slot 1' : 'Slot 2'} de Versatilidade? ${ficha.versatilidade?.[slotKey]?.convertido ? "O +1 PT de ficha será removido." : ""}`)) return
    if (!ficha.versatilidade) ficha.versatilidade = { slot1: null, slot2: null }
    // Se era convertido em PT, desfaz
    if (ficha.versatilidade[slotKey]?.convertido) {
      ficha.pontos.offsetTotal = (ficha.pontos.offsetTotal ?? 0) - 1
      ficha._sincronizarNivel()
      ficha.calcularPontos()
    }
    ficha.versatilidade[slotKey] = null
    renderTudo()
    salvar()
    toastAviso("Versatilidade resetada.")
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
    if (val === 'equipamento') {
      _renderCatInfo()
      _renderEncantamentosItem()
      _renderRestricoesItem()
      _renderRestricaoAutoCategoria()
    }
  }
  window.toggleBonusAtaque = () => {
    const chk = document.getElementById('itemUsadoAtaque')
    document.getElementById('campoBonusAtaque').style.display = chk.checked ? 'block' : 'none'
  }
  window.toggleBonusDefesa = () => {
    const chk = document.getElementById('itemUsadoDefesa')
    document.getElementById('campoBonusDefesa').style.display = chk.checked ? 'block' : 'none'
    _atualizarPreviewPrioridade()
  }

  // Atualiza o display de defesa final conforme bônus bruto e prioridade
  function _atualizarPreviewPrioridade() {
    const el    = document.getElementById("defesaFinalDisplay")
    if (!el) return
    const bonus = +document.getElementById("itemBonusDefesa")?.value || 0
    const prio  = Math.max(1, +document.getElementById("itemPrioridadeDefesa")?.value || 1)
    const final = Math.trunc(bonus / prio)
    el.textContent = (final >= 0 ? "+" : "") + final
    el.style.color       = final < 0 ? "#f87171" : "#4ade80"
    el.style.borderColor = final < 0 ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.2)"
    el.style.background  = final < 0 ? "rgba(248,113,113,0.08)" : "rgba(74,222,128,0.08)"
  }
  // Expor para uso nos botões inline do HTML (módulo ES6 não expõe ao escopo global automaticamente)
  window._atualizarPreviewPrioridade = _atualizarPreviewPrioridade

  // ══════════════════════════════════════════════════════════
  //  SISTEMA DE ENCANTAMENTOS & CATEGORIA
  // ══════════════════════════════════════════════════════════

  const ENCANTAMENTOS_LISTA = [
    { id:"abencado",   emoji:"✨", nome:"Abençoado",   custo:1, repetivel:false, incompativel:[],
      desc:"Protege contra Paralisia e condições negativas. Ganho em Defesa e Resistência contra eles.", extra:null },
    { id:"acurado",    emoji:"🎯", nome:"Acurado",      custo:2, repetivel:false, incompativel:["macico"],
      desc:"Acerto crítico em testes de ataque com 5 ou 6. Incompatível com Maciço.", extra:null },
    { id:"alcance",    emoji:"📏", nome:"Alcance",      custo:1, repetivel:true,  incompativel:[],
      desc:"Permite escolher mais 1 categoria de distância como alcance ideal (aprovação do mestre).", extraLabel:"Categoria de distância adicional", extraPlaceholder:"Ex: Longo" },
    { id:"aprimorado", emoji:"💎", nome:"Aprimorado",   custo:1, repetivel:true,  incompativel:[],
      desc:"Aumenta um atributo em situações específicas. Não afeta ataque/defesa.", extraLabel:"Atributo / situação", extraPlaceholder:"Ex: Força ao escalar montanhas" },
    { id:"condutor",   emoji:"⚡", nome:"Condutor",     custo:2, repetivel:false, incompativel:[],
      desc:"Enquanto usa o equipamento, todas as suas vantagens custam metade dos PM.", extra:null },
    { id:"elemental",  emoji:"🔮", nome:"Elemental",    custo:1, repetivel:true,  incompativel:[],
      desc:"Ao acertar, teste Poder vs Resistência: +1D do tipo elemental por ponto investido.", extraLabel:"Tipo de dano elemental", extraPlaceholder:"Ex: Fogo" },
    { id:"encantado",  emoji:"✴️", nome:"Encantado",    custo:1, repetivel:true,  incompativel:[],
      desc:"+3 em testes de ataque (arma) ou +3 de Resistência na defesa (armadura). Empilhável até 3×.", extra:null },
    { id:"espiritual", emoji:"👻", nome:"Espiritual",   custo:2, repetivel:false, incompativel:[],
      desc:"A arma ataca o espírito. Causa dano em PM igual à metade do dano em PV.", extra:null },
    { id:"fortificada",emoji:"🏰", nome:"Fortificada",  custo:2, repetivel:false, incompativel:["leve"],
      desc:"Oponentes não conseguem críticos contra você (exceto com vantagens específicas). Incompatível com Leve.", extra:null },
    { id:"leve",       emoji:"🕊️", nome:"Leve",        custo:2, repetivel:false, incompativel:["fortificada"],
      desc:"Armadura leve e ágil. Acerto crítico com 5 ou 6 em testes de defesa. Incompatível com Fortificada.", extra:null },
    { id:"macico",     emoji:"🔨", nome:"Maciço",       custo:2, repetivel:false, incompativel:["acurado"],
      desc:"No primeiro acerto crítico, o Poder é somado três vezes ao dano. Incompatível com Acurado.", extra:null },
    { id:"obrapima",   emoji:"🎨", nome:"Obra-Prima",   custo:1, repetivel:false, incompativel:[],
      desc:"Escolha uma perícia. Gaste 3 PM para receber Ganho em testes com ela enquanto usa o equipamento.", extraLabel:"Perícia potencializada", extraPlaceholder:"Ex: Luta" },
    { id:"fruta",      emoji:"🍎", nome:"Fruta (Akuma no Mi)", custo:0, repetivel:false, incompativel:["__todos__"],
      desc:"O item 'come' uma Akuma no Mi. Ganha as habilidades da fruta, mas não aceita nenhum outro encantamento.", extra:null },
  ]

  const CAT_INFO = {
    1: { nome:"Comum",    req:"Sem requisitos de perícia.",  penalidade:"Nenhuma penalidade."                                      },
    2: { nome:"Incomum",  req:"Sem requisitos de perícia.",  penalidade:"Nenhuma penalidade."                                      },
    3: { nome:"Raro",     req:"Treinado na Perícia Alvo.",   penalidade:"Parcial: −50% do bônus sem Treinamento."                  },
    4: { nome:"Épico",    req:"Treinado na Perícia Alvo.",   penalidade:"Total: −100% do bônus sem Treinamento."                   },
    5: { nome:"Lendário", req:"Maestria na Perícia Alvo.",   penalidade:"Híbrida: −50% sem Maestria; −100% sem a Perícia."         },
    6: { nome:"Mítico",   req:"Maestria na Perícia Alvo.",   penalidade:"Total: −100% do bônus sem Maestria."                     },
  }

  // Estado temporário do modal
  let _itemEncantamentos  = []
  let _itemCategoria      = 1
  let _itemRestricoes     = []

  // ── Mini-modal de extra info (substitui prompt()) ─────────
  // Cria o mini-modal no DOM na primeira vez que for chamado
  function _criarMiniModalSeNecessario() {
    if (document.getElementById('miniModalEnc')) return
    const el = document.createElement('div')
    el.id = 'miniModalEnc'
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;
      display:flex;align-items:center;justify-content:center;
    `
    el.innerHTML = `
      <div style="background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:14px;padding:24px;width:min(380px,92vw);display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 60px rgba(0,0,0,0.6)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 id="miniModalEncTitulo" style="font-size:15px;color:#e2e8f0;margin:0"></h3>
          <button onclick="document.getElementById('miniModalEnc').style.display='none'" style="background:transparent;border:1px solid var(--border,#475569);color:#94a3b8;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px">✕</button>
        </div>
        <p id="miniModalEncDesc" style="font-size:12px;opacity:0.6;margin:0;line-height:1.5"></p>
        <div>
          <label id="miniModalEncLabel" style="font-size:12px;opacity:0.75;display:block;margin-bottom:6px"></label>
          <input id="miniModalEncInput" style="width:100%;padding:9px 12px;background:var(--bg-base,#0f172a);border:1px solid var(--border,#334155);border-radius:8px;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none" />
        </div>
        <div style="display:flex;gap:8px">
          <button id="miniModalEncConfirmar" style="flex:1;padding:10px;background:#22c55e;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">✅ Confirmar</button>
          <button onclick="document.getElementById('miniModalEnc').style.display='none'" style="flex:1;padding:10px;background:var(--bg-hover,#475569);border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
        </div>
      </div>
    `
    document.body.appendChild(el)
  }

  function _pedirExtraInfo(enc, callback) {
    _criarMiniModalSeNecessario()
    const modal = document.getElementById('miniModalEnc')
    document.getElementById('miniModalEncTitulo').textContent = `${enc.emoji} ${enc.nome}`
    document.getElementById('miniModalEncDesc').textContent    = enc.desc
    document.getElementById('miniModalEncLabel').textContent   = enc.extraLabel ?? 'Detalhe'
    const input = document.getElementById('miniModalEncInput')
    input.placeholder = enc.extraPlaceholder ?? ''
    input.value       = ''
    modal.style.display = 'flex'
    setTimeout(() => input.focus(), 50)

    const confirmar = document.getElementById('miniModalEncConfirmar')
    const novoConfirmar = confirmar.cloneNode(true)
    confirmar.parentNode.replaceChild(novoConfirmar, confirmar)
    novoConfirmar.onclick = () => {
      const val = input.value.trim()
      if (!val) { input.style.borderColor = '#ef4444'; return }
      input.style.borderColor = '#334155'
      modal.style.display = 'none'
      callback(val)
    }
    input.onkeydown = (e) => { if (e.key === 'Enter') novoConfirmar.click() }
  }

  // ── Mini-modal de restrição (substitui confirm()) ──────────
  function _criarMiniModalRestricaoSeNecessario() {
    if (document.getElementById('miniModalRestricao')) return
    const el = document.createElement('div')
    el.id = 'miniModalRestricao'
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;
      display:flex;align-items:center;justify-content:center;
    `
    el.innerHTML = `
      <div style="background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:14px;padding:24px;width:min(400px,92vw);display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 60px rgba(0,0,0,0.6)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="font-size:15px;color:#e2e8f0;margin:0">🔒 Nova Restrição</h3>
          <button onclick="document.getElementById('miniModalRestricao').style.display='none'" style="background:transparent;border:1px solid var(--border,#475569);color:#94a3b8;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div>
          <label style="font-size:12px;opacity:0.75;display:block;margin-bottom:6px">Descrição da restrição</label>
          <input id="restricaoTextoInput" placeholder="Ex: Requer bateria carregada para funcionar" style="width:100%;padding:9px 12px;background:var(--bg-base,#0f172a);border:1px solid var(--border,#334155);border-radius:8px;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none" />
        </div>
        <div>
          <label style="font-size:12px;opacity:0.75;display:block;margin-bottom:8px">Tipo de restrição</label>
          <div style="display:flex;gap:8px">
            <label id="restricaoParcialLabel" style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-base,#0f172a);border:1px solid var(--border,#334155);border-radius:8px;cursor:pointer;transition:all 0.15s;font-size:13px">
              <input type="radio" name="restricaoTipoModal" value="parcial" checked style="accent-color:#fbbf24;width:14px;height:14px">
              <span>🟡 Parcial <span style="opacity:0.55;font-size:11px">(−50%)</span></span>
            </label>
            <label id="restricaoTotalLabel" style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-base,#0f172a);border:1px solid var(--border,#334155);border-radius:8px;cursor:pointer;transition:all 0.15s;font-size:13px">
              <input type="radio" name="restricaoTipoModal" value="total" style="accent-color:#f87171;width:14px;height:14px">
              <span>🔴 Total <span style="opacity:0.55;font-size:11px">(−100%)</span></span>
            </label>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button id="restricaoConfirmarBtn" style="flex:1;padding:10px;background:#22c55e;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">✅ Adicionar</button>
          <button onclick="document.getElementById('miniModalRestricao').style.display='none'" style="flex:1;padding:10px;background:var(--bg-hover,#475569);border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
        </div>
      </div>
    `
    document.body.appendChild(el)
  }

  window.selecionarCatEquip = (cat) => {
    _itemCategoria = cat
    document.querySelectorAll('.cat-equip-btn').forEach(b => {
      b.classList.toggle('active', +b.dataset.cat === cat)
    })
    _renderCatInfo()
    _renderEncantamentosItem()
    _renderRestricaoAutoCategoria()
  }

  function _renderCatInfo() {
    const info = CAT_INFO[_itemCategoria]
    const el   = document.getElementById('catEquipInfo')
    if (!el) return
    el.innerHTML = `<strong>Cat. ${_itemCategoria} — ${info.nome}</strong> &nbsp;·&nbsp; ${info.req} &nbsp;·&nbsp; <span style="opacity:0.75">${info.penalidade}</span>`
    const contador = document.getElementById('encantamentosContador')
    if (contador) {
      contador.textContent = `${_itemEncantamentos.length} / ${_itemCategoria}`
      contador.style.color = _itemEncantamentos.length >= _itemCategoria ? '#f87171' : '#64748b'
    }
  }

  function _renderEncantamentosItem() {
    const lista = document.getElementById('listaEncantamentosItem')
    if (!lista) return
    lista.innerHTML = ''

    const temFruta = _itemEncantamentos.some(e => e.id === 'fruta')

    _itemEncantamentos.forEach((enc, idx) => {
      const chip = document.createElement('div')
      chip.className = 'encantamento-chip'
      chip.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="encantamento-chip-nome">${enc.emoji} ${enc.nome}</span>
            ${enc.custo > 0 ? `<span class="encantamento-chip-custo">+${enc.custo} PT</span>` : ''}
            ${enc.extra ? `<span style="font-size:11px;color:#94a3b8;background:#0f172a;border:1px solid #334155;padding:1px 6px;border-radius:4px">${enc.extra}</span>` : ''}
          </div>
          <div style="font-size:11px;opacity:0.5;margin-top:3px;line-height:1.4">${enc.desc}</div>
        </div>
        <button class="encantamento-chip-remover" onclick="_removerEncantamentoItem(${idx})" title="Remover">✕</button>
      `
      lista.appendChild(chip)
    })

    const btn = document.getElementById('btnAdicionarEncantamento')
    const podeAdicionar = !temFruta && _itemEncantamentos.length < _itemCategoria
    if (btn) btn.style.display = podeAdicionar ? 'block' : 'none'

    const contador = document.getElementById('encantamentosContador')
    if (contador) {
      contador.textContent = `${_itemEncantamentos.length} / ${_itemCategoria}`
      contador.style.color = _itemEncantamentos.length >= _itemCategoria ? '#f87171' : '#64748b'
    }
  }

  window._removerEncantamentoItem = (idx) => {
    _itemEncantamentos.splice(idx, 1)
    _renderEncantamentosItem()
    // Re-renderiza o seletor se estiver aberto
    const painel = document.getElementById('painelSeletorEncantamento')
    if (painel && painel.style.display !== 'none') _renderOpcoesEncantamento()
  }

  window.abrirSeletorEncantamento = () => {
    const painel = document.getElementById('painelSeletorEncantamento')
    if (!painel) return
    painel.style.display = 'block'
    _renderOpcoesEncantamento()
  }

  window.fecharSeletorEncantamento = () => {
    const painel = document.getElementById('painelSeletorEncantamento')
    if (painel) painel.style.display = 'none'
  }

  function _renderOpcoesEncantamento() {
    const lista = document.getElementById('listaOpcoesEncantamento')
    if (!lista) return
    lista.innerHTML = ''

    const temFruta     = _itemEncantamentos.some(e => e.id === 'fruta')
    const idsPresentes = _itemEncantamentos.map(e => e.id)
    const cheio        = _itemEncantamentos.length >= _itemCategoria

    ENCANTAMENTOS_LISTA.forEach(enc => {
      let bloqueado = false
      let motivo    = ''

      if (enc.id === 'fruta' && _itemEncantamentos.length > 0) {
        bloqueado = true; motivo = 'Remove todos os outros encantamentos ao adicionar'
      } else if (temFruta && enc.id !== 'fruta') {
        bloqueado = true; motivo = 'Item com Fruta não aceita outros encantamentos'
      } else if (!enc.repetivel && idsPresentes.includes(enc.id)) {
        bloqueado = true; motivo = 'Já adicionado (não repetível)'
      } else {
        const incompat = enc.incompativel.find(i => i !== '__todos__' && idsPresentes.includes(i))
        if (incompat) {
          const nomeInc = ENCANTAMENTOS_LISTA.find(e => e.id === incompat)?.nome ?? incompat
          bloqueado = true; motivo = `Incompatível com ${nomeInc}`
        }
      }
      if (cheio && !bloqueado) { bloqueado = true; motivo = 'Limite de encantamentos atingido (aumente a Categoria)' }

      const div = document.createElement('div')
      div.className = 'enc-opcao' + (bloqueado ? ' desabilitado' : '')
      div.innerHTML = `
        <div class="enc-opcao-header">
          <span class="enc-opcao-nome">${enc.emoji} ${enc.nome}</span>
          ${enc.custo > 0 ? `<span class="enc-opcao-custo">+${enc.custo} PT</span>` : `<span style="font-size:11px;color:#64748b">grátis</span>`}
        </div>
        <div class="enc-opcao-desc">${enc.desc}</div>
        ${bloqueado ? `<div class="enc-opcao-incompat">⛔ ${motivo}</div>` : ''}
      `
      if (!bloqueado) div.onclick = () => _selecionarEncantamento(enc)
      lista.appendChild(div)
    })
  }

  function _selecionarEncantamento(enc) {
    const _finalizar = (extra) => {
      if (enc.id === 'fruta') {
        _itemEncantamentos = [{ ...enc, extra }]
      } else {
        _itemEncantamentos.push({ ...enc, extra })
      }
      fecharSeletorEncantamento()
      _renderEncantamentosItem()
    }

    if (enc.extraLabel) {
      _pedirExtraInfo(enc, (val) => _finalizar(val))
    } else {
      _finalizar(null)
    }
  }

  // ── Restrições customizadas ────────────────────────────────
  window.adicionarRestricaoItem = () => {
    _criarMiniModalRestricaoSeNecessario()
    const modal = document.getElementById('miniModalRestricao')
    const input = document.getElementById('restricaoTextoInput')
    input.value = ''
    input.style.borderColor = '#334155'
    // Reset radio para parcial
    const radios = modal.querySelectorAll('input[name="restricaoTipoModal"]')
    if (radios[0]) radios[0].checked = true
    modal.style.display = 'flex'
    setTimeout(() => input.focus(), 50)

    const confirmar    = document.getElementById('restricaoConfirmarBtn')
    const novoConfirmar = confirmar.cloneNode(true)
    confirmar.parentNode.replaceChild(novoConfirmar, confirmar)
    novoConfirmar.onclick = () => {
      const texto = input.value.trim()
      if (!texto) { input.style.borderColor = '#ef4444'; return }
      const tipo = modal.querySelector('input[name="restricaoTipoModal"]:checked')?.value ?? 'parcial'
      _itemRestricoes.push({ tipo, texto })
      modal.style.display = 'none'
      _renderRestricoesItem()
    }
    input.onkeydown = (e) => { if (e.key === 'Enter') novoConfirmar.click() }
  }

  window._removerRestricaoItem = (idx) => {
    _itemRestricoes.splice(idx, 1)
    _renderRestricoesItem()
  }

  function _renderRestricoesItem() {
    const lista = document.getElementById('listaRestricoesItem')
    if (!lista) return
    lista.innerHTML = ''
    _itemRestricoes.forEach((r, idx) => {
      const chip = document.createElement('div')
      chip.className = 'restricao-chip'
      chip.innerHTML = `
        <div class="restricao-chip-header">
          <span class="${r.tipo === 'total' ? 'restricao-chip-tipo-total' : 'restricao-chip-tipo-parcial'}">
            ${r.tipo === 'total' ? '🔴 Restrição Total (−100% bônus)' : '🟡 Restrição Parcial (−50% bônus)'}
          </span>
          <button class="restricao-chip-remover" onclick="_removerRestricaoItem(${idx})" title="Remover">✕</button>
        </div>
        <div class="restricao-chip-texto">${r.texto}</div>
      `
      lista.appendChild(chip)
    })
  }

  function _renderRestricaoAutoCategoria() {
    const el   = document.getElementById('restricaoCategoriaAuto')
    const info = CAT_INFO[_itemCategoria]
    if (!el) return
    el.innerHTML = `📋 <strong>Requisito automático (Cat. ${_itemCategoria}):</strong> ${info.req} → <em>${info.penalidade}</em>`
  }

  function _resetItemEncantamentos() {
    _itemEncantamentos = []
    _itemCategoria     = 1
    _itemRestricoes    = []
    document.querySelectorAll('.cat-equip-btn').forEach(b => {
      b.classList.toggle('active', +b.dataset.cat === 1)
    })
    _renderCatInfo()
    _renderEncantamentosItem()
    _renderRestricoesItem()
    _renderRestricaoAutoCategoria()
    fecharSeletorEncantamento()
  }

  function _carregarItemEncantamentos(item) {
    _itemEncantamentos = item.encantamentos ? JSON.parse(JSON.stringify(item.encantamentos)) : []
    _itemCategoria     = item.catEquip ?? 1
    _itemRestricoes    = item.restricoes ? JSON.parse(JSON.stringify(item.restricoes)) : []
    document.querySelectorAll('.cat-equip-btn').forEach(b => {
      b.classList.toggle('active', +b.dataset.cat === _itemCategoria)
    })
    _renderCatInfo()
    _renderEncantamentosItem()
    _renderRestricoesItem()
    _renderRestricaoAutoCategoria()
    fecharSeletorEncantamento()
  }

  // Visibilidade
  window.toggleVisibilidade = (campo, valor) => {
    ficha[campo] = valor
    _renderVisibilidade()
    salvar()
    // Reinicia escuta: se tornou pública inicia listener, se privada cancela
    if (campo === "isPublic") {
      if (valor) _iniciarEscutaRealtime()
      else _pararEscutaRealtime()
    }
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