// ============================================================
//  ui/uiModal.js — Controle de todos os modais
// ============================================================

import { BANCO_ELEMENTOS              } from "../dados/banco.js"
import { toastErro, toastSucesso, toastAviso } from "./uiToast.js" 
import { TABELAS, ORCAMENTO_POR_ESCALA } from "../dados/bancoCaracteristicas.js"
import { computarVarianteAba, abasDisponiveis } from "../dados/amplificacao.js"
import { ElementoFicha                } from "../modelos/Elemento.js"
import { FonteDePoder, PC_POR_ESCALA  } from "../modelos/Fonte.js"
import { Caracteristica               } from "../modelos/Caracteristica.js"

// ── Estado interno ────────────────────────────────────────
let _tipoCriacao      = null
let _elementoEditando = null
let _fonteTemp        = null
let _caracTemp        = null
let _caracEditIndex   = null   // null = criar, número = editar

let _onSalvarElemento = null
let _onSalvarFonte    = null
let _fonteEditandoId  = null   // null = criar nova, string = editar existente
let _getFicha         = null   // callback para obter ficha atual

// ── Escolhas iniciais com bases gratuitas pré-selecionadas ─
function _escolhasIniciais() {
  const result = {}
  for (const [chave, cfg] of Object.entries(TABELAS)) {
    const base = cfg.dados.find(d => d.gratuita)
    if (base) {
      result[chave] = [{ ...base }]
    } else {
      result[chave] = []
    }
  }
  return result
}

// ── Resumo legível das escolhas ──────────────────────────
function _resumoEscolhas(escolhas) {
  if (!escolhas) return {}
  const LABELS = {
    potencia: 'Potência', pressao: 'Pressão', execucao: 'Execução',
    alcance: 'Alcance', duracao: 'Duração', area: 'Área',
    alvos: 'Alvos Adicionais', condicoes: 'Condições', descontos: 'Descontos'
  }
  // Bases padrão a exibir quando nenhuma escolha extra foi feita
  const BASES_PADRAO = {
    execucao: 'Padrão',
    alcance:  'Pessoal',
    duracao:  'Instantânea',
    area:     '1 alvo',
    alvos:    '1 alvo'
  }
  const result = {}

  // Reúne todas as chaves possíveis (escolhas + bases)
  const todasChaves = new Set([...Object.keys(escolhas), ...Object.keys(BASES_PADRAO)])

  for (const chave of todasChaves) {
    const lista = escolhas[chave] ?? []
    const itensExtra = lista.filter(i => !i.gratuita)

    if (itensExtra.length === 0) {
      // Sem escolha extra — mostra base padrão se existir
      if (BASES_PADRAO[chave]) {
        result[LABELS[chave] ?? chave] = `<span style="opacity:0.45;font-style:italic">${BASES_PADRAO[chave]} (padrão)</span>`
      }
      continue
    }

    const contagem = {}
    let total = 0
    for (const item of itensExtra) {
      const k = item.nome ?? `+${item.valor}`
      contagem[k] = (contagem[k] ?? 0) + 1
      if (item.valor !== undefined) total += item.valor * 1
    }
    const partes = Object.entries(contagem)
      .map(([nome, qtd]) => qtd > 1 ? `${nome} ×${qtd}` : nome)
      .join(', ')
    const totalStr = total > 0 ? ` <span style="opacity:0.5">= ${total}</span>` : ''
    result[LABELS[chave] ?? chave] = partes + totalStr
  }
  return result
}

const TIPOS_DANO = [
  "Corte","Perfuração","Pancada","Veneno","Ácido",
  "Água","Fogo","Lava","Ar","Gás","Terra","Areia",
  "Eletricidade","Luz","Gelo","Fuligem","Sombras","Haki"
]

// ── Registro ──────────────────────────────────────────────
export function registrarCallbacks({ onSalvarElemento, onSalvarFonte, getFicha }) {
  _onSalvarElemento = onSalvarElemento
  _onSalvarFonte    = onSalvarFonte
  _getFicha         = getFicha
}

// ── Modal: Lista do Livro ─────────────────────────────────
export function abrirListaLivro(tipo) {
  document.getElementById("modalTitulo").innerText = `Escolher ${tipo} do Livro`
  const lista = document.getElementById("modalLista")
  lista.innerHTML = ""
  const itens = BANCO_ELEMENTOS.filter(e => e.tipo === tipo)
  if (!itens.length) {
    lista.innerHTML = "<p style='opacity:0.5'>Nenhum item disponível.</p>"
  }
  for (const item of itens) {
    const div = document.createElement("div")
    div.className = "item-lista"
    div.innerHTML = `<strong>${item.nome}</strong> <span style="opacity:0.6">(${item.custo > 0 ? "+" : ""}${item.custo} PT)</span><p>${item.descricao}</p>`
    div.onclick = () => { _onSalvarElemento?.(new ElementoFicha(item)); fecharModal("modal") }
    lista.appendChild(div)
  }
  abrirModal("modal")
}

// ── Modal: Criar/Editar Elemento Simples ──────────────────
export function abrirCriarElemento(tipo, elementoExistente = null) {
  _tipoCriacao      = tipo
  _elementoEditando = elementoExistente
  document.getElementById("modalCriarTitulo").innerText = elementoExistente ? `Editar ${tipo}` : `Criar ${tipo}`
  document.getElementById("novoNome").value      = elementoExistente?.nome      ?? ""
  document.getElementById("novoCusto").value     = elementoExistente?.custo     ?? 0
  window.syncStepper?.("novoCusto")
  document.getElementById("novoDescricao").value = elementoExistente?.descricao ?? ""
  document.getElementById("novoNotas").value     = elementoExistente?.notas     ?? ""
  abrirModal("modalCriar")
}

export function confirmarCriacaoElemento() {
  const dados = {
    id:        _elementoEditando?.id ?? crypto.randomUUID(),
    nome:      document.getElementById("novoNome").value,
    tipo:      _tipoCriacao,
    custo:     +document.getElementById("novoCusto").value,
    descricao: document.getElementById("novoDescricao").value,
    notas:     document.getElementById("novoNotas").value
  }
  if (_elementoEditando) { Object.assign(_elementoEditando, dados); _onSalvarElemento?.(null) }
  else { _onSalvarElemento?.(new ElementoFicha(dados)) }
  fecharModal("modalCriar")
}

// ── Modal: Fonte de Poder ─────────────────────────────────
export function abrirCriarFonte(fonteExistente = null) {
  _fonteEditandoId = fonteExistente?.id ?? null

  if (fonteExistente) {
    _fonteTemp = FonteDePoder.fromJSON(JSON.parse(JSON.stringify(fonteExistente)))
  } else {
    _fonteTemp = new FonteDePoder({ id: crypto.randomUUID() })
  }

  document.getElementById("fonteNome").value    = _fonteTemp.nome !== "Nova Fonte" ? _fonteTemp.nome : ""
  document.getElementById("fonteTema").value    = _fonteTemp.tema ?? ""
  document.getElementById("fonteSubtipo").value = _fonteTemp.subtipo ?? "geral"
  document.getElementById("modalFonteTitulo").innerText = fonteExistente ? "✏️ Editar Fonte de Poder" : "🍎 Criar Fonte de Poder"

  // _renderPassivosConfig primeiro para criar os elementos do custo no DOM
  _renderPassivosConfig()
  _aplicarCustoMinimo()
  _atualizarPCsDisplay()
  _renderCaracteristicasFonteModal()
  abrirModal("modalFonte")

  // Garantir scroll no topo após renderização
  requestAnimationFrame(() => {
    const mc = document.getElementById("modalFonte")?.querySelector(".modal-content")
    if (mc) mc.scrollTop = 0
  })
}

const CUSTO_MINIMO_SUBTIPO = { geral: 1, paramecia: 1, zoan: 2, logia: 3 }

function _aplicarCustoMinimo() {
  const subtipo = _fonteTemp.subtipo ?? "geral"
  const min = CUSTO_MINIMO_SUBTIPO[subtipo] ?? 1
  const custoAtual = _fonteTemp.custo ?? 0
  const custoFinal = Math.max(min, custoAtual)
  _fonteTemp.atualizarCusto(custoFinal)
  // Os elementos do custo são renderizados por _renderPassivosConfig()
  // mas podem já existir se a função for chamada depois
  const inputEl = document.getElementById("fonteCusto")
  const hintEl  = document.getElementById("fonteCustoMin")
  if (inputEl) { inputEl.value = custoFinal; inputEl.min = min; window.syncStepper?.("fonteCusto") }
  if (hintEl)  hintEl.innerText = `(mínimo: ${min} PT)`
}

export function atualizarCustoFonte() {
  const subtipo = _fonteTemp.subtipo ?? "geral"
  const min = CUSTO_MINIMO_SUBTIPO[subtipo] ?? 1
  const val = Math.max(min, +document.getElementById("fonteCusto").value || 0)
  document.getElementById("fonteCusto").value = val
  window.syncStepper?.("fonteCusto")
  _fonteTemp.atualizarCusto(val)
  _atualizarPCsDisplay()
}

export function atualizarSubtipoFonte() {
  _fonteTemp.subtipo = document.getElementById("fonteSubtipo").value
  _renderPassivosConfig()
  _aplicarCustoMinimo()
  _atualizarPCsDisplay()
}

function _atualizarPCsDisplay() {
  document.getElementById("fontePCsTotal").innerText    = _fonteTemp.pcs
  document.getElementById("fontePCsGastos").innerText   = _fonteTemp.pcsGastos
  const rest = _fonteTemp.pcsDisponiveis
  const el   = document.getElementById("fontePCsRestantes")
  if (el) { el.innerText = rest; el.style.color = rest < 0 ? "#ef4444" : "#22c55e" }
}

function _renderPassivosConfig() {
  const container = document.getElementById("passivosConfig")
  if (!container) return
  const subtipo = document.getElementById("fonteSubtipo").value
  container.innerHTML = ""

  const inputStyle = "width:100%;margin-top:6px;padding:8px;border-radius:8px;background:#0f172a;color:white;border:1px solid #334155;font-family:inherit;font-size:13px"
  const labelStyle = "font-size:12px;opacity:0.6;margin-top:10px;display:block"

  // ── Bloco de custo (sempre visível para todos os subtipos) ──
  const min = CUSTO_MINIMO_SUBTIPO[subtipo] ?? 1
  const custoAtual = Math.max(min, _fonteTemp.custo ?? 0)
  const custoBloco = document.createElement("div")
  custoBloco.innerHTML = `
    <label style="font-size:13px;opacity:0.75;margin-top:4px">
      Pontos Investidos (PT)
      <span id="fonteCustoMin" style="opacity:0.5;font-size:12px;margin-left:4px">(mínimo: ${min} PT)</span>
    </label>
    <div class="num-stepper">
      <button type="button" class="step-btn" onclick="stepperDec('fonteCusto',1,0,999);atualizarCustoFonte()">‹</button>
      <input type="number" id="fonteCusto" value="${custoAtual}" min="${min}" max="999" style="display:none">
      <span class="step-val" id="step_val_fonteCusto">${custoAtual}</span>
      <button type="button" class="step-btn" onclick="stepperInc('fonteCusto',1,0,999);atualizarCustoFonte()">›</button>
    </div>`
  container.appendChild(custoBloco)

  // Sincroniza o modelo com o valor renderizado
  _fonteTemp.atualizarCusto(custoAtual)

  if (subtipo === "zoan") {
    const resHibrida  = (_fonteTemp.passivos?.zoan_res_hibrida  ?? []).join(", ")
    const resCompleta = (_fonteTemp.passivos?.zoan_res_completa ?? []).join(", ")

    container.innerHTML = `
      <div class="passivo-bloco">
        <p>🐾 <strong>Zoan</strong> — Regras fixas do sistema:</p>

        <div class="zoan-regra-bloco">
          <p class="zoan-regra-titulo">⚙️ Regra de Transformação</p>
          <p class="zoan-regra-texto">Mudar de forma custa uma <strong>Ação Completa</strong>. Durante a rodada de transição você é considerado <strong>Indefeso</strong>.</p>
        </div>

        <div class="zoan-forma-bloco">
          <p class="zoan-forma-titulo">🧍 Forma Humana (Normal)</p>
          <ul class="zoan-lista">
            <li><strong>Custo:</strong> Nenhum.</li>
            <li><strong>Limitação:</strong> Apenas características de Escala de Poder 1 da fruta.</li>
          </ul>
        </div>

        <div class="zoan-forma-bloco zoan-hibrida">
          <p class="zoan-forma-titulo">🐺 Forma Híbrida</p>
          <ul class="zoan-lista">
            <li><strong>Custo:</strong> 3 PM.</li>
            <li><strong>Vontade Mista:</strong> Receba (5 × Resistência) e (5 × Habilidade) em PV e PM temporários.</li>
            <li><strong>Limitação:</strong> Libera Escalas 1 e 2 da fruta + ficha normal completa.</li>
          </ul>
          <span style="${labelStyle}">Resistência desta forma (1 tipo de dano):</span>
          <input id="zoanResHibrida" placeholder="Ex: Corte"
            value="${resHibrida}" style="${inputStyle}"
            oninput="_salvarZoan('zoan_res_hibrida', this.value)">
        </div>

        <div class="zoan-forma-bloco zoan-completa">
          <p class="zoan-forma-titulo">🦖 Forma Zoan (Animal)</p>
          <ul class="zoan-lista">
            <li><strong>Custo:</strong> 6 PM.</li>
            <li><strong>Ataque Básico:</strong> Crie um ataque conceituado no animal (conta como Escala 2).</li>
            <li><strong>Vontade Animalesca:</strong> Receba (10 × Resistência) e (10 × Habilidade) em PV e PM temporários.</li>
            <li><strong>Limitação:</strong> Libera todas as escalas da fruta, mas ficha normal fica indisponível.</li>
          </ul>
          <span style="${labelStyle}">Resistências desta forma (2 tipos de dano):</span>
          <input id="zoanResCompleta" placeholder="Ex: Corte, Pancada"
            value="${resCompleta}" style="${inputStyle}"
            oninput="_salvarZoan('zoan_res_completa', this.value)">
        </div>

        <p style="font-size:11px;opacity:0.4;margin-top:8px">✦ Uma característica Escala 3 gratuita será concedida automaticamente.</p>
      </div>`
  } else if (subtipo === "logia") {
    const elAtual = _fonteTemp.passivos?.elemento ?? ""
    container.innerHTML = `
      <div class="passivo-bloco">
        <p>🌊 <strong>Logia</strong> — Elemento da sua fruta:</p>
        <input id="logiaElemento" placeholder="Ex: Fogo, Gelo, Eletricidade..."
          value="${elAtual}" style="${inputStyle}"
          oninput="_salvarElementoLogia(this.value)">
        <p style="font-size:12px;opacity:0.6;margin-top:8px">→ Imune ao elemento escolhido<br>→ Imune a danos mundanos (exceto Haki)</p>
      </div>`
  }
}

window._salvarResistenciasZoan = (val) => {
  _fonteTemp.passivos.zoan_resistencias = val.split(",").map(s => s.trim()).filter(Boolean)
}
window._salvarZoan = (campo, val) => {
  if (!_fonteTemp?.passivos) return
  if (campo === 'zoan_res_hibrida' || campo === 'zoan_res_completa') {
    _fonteTemp.passivos[campo] = val.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    _fonteTemp.passivos[campo] = val
  }
}
window._salvarElementoLogia = (val) => {
  _fonteTemp.passivos.elemento = val.trim()
}

export function confirmarSalvarFonte() {
  const nome = document.getElementById("fonteNome").value?.trim()
  if (!nome) { toastErro("Digite um nome para a Fonte de Poder."); return }

  _fonteTemp.nome    = nome
  _fonteTemp.tema    = document.getElementById("fonteTema").value
  _fonteTemp.subtipo = document.getElementById("fonteSubtipo").value

  // Zoan: gratuita de escala 3
  if (_fonteTemp.subtipo === "zoan" && !_fonteTemp.passivos.caracGratuitaConcedida) {
    _fonteTemp.caracteristicas.unshift(new Caracteristica({
      nome: "Forma Zoan (Gratuita)", descricao: "Característica gratuita de Escala 3 concedida pela Zoan.",
      escala: 3, custo: 0, custoPM: 6, gratuita: true
    }))
    _fonteTemp.passivos.caracGratuitaConcedida = true
  }

  _onSalvarFonte?.(_fonteTemp, _fonteEditandoId)
  fecharModal("modalFonte")
}

// ── Modal: Criar/Editar Característica ───────────────────
export function abrirCriarCaracteristica(editIndex = null) {
  if (!_fonteTemp) return
  _caracEditIndex = editIndex
  const ex = editIndex !== null ? _fonteTemp.caracteristicas[editIndex] : null

  // Restaura escolhas salvas (deep copy) ou inicializa vazio
  const escolhasSalvas = ex?.escolhas
    ? Object.fromEntries(Object.keys(TABELAS).map(k => [k, [...(ex.escolhas[k] ?? [])]]))
    : _escolhasIniciais()

  _caracTemp = {
    escala:      ex?.escala ?? 1,
    escolhas:    escolhasSalvas,
    amplificada: ex?.amplificada ?? null,
    reduzida:    ex?.reduzida    ?? null
  }

  document.getElementById("caracNome").value      = ex?.nome      ?? ""
  document.getElementById("caracDescricao").value = ex?.descricao ?? ""
  document.getElementById("caracEscala").value    = _caracTemp.escala
  window.syncStepper?.("caracEscala")
  const chkGrat = document.getElementById("caracGratuita")
  if (chkGrat) chkGrat.checked = ex?.gratuita ?? false
  document.getElementById("modalCaracTitulo").innerText =
    editIndex !== null ? "✏️ Editar Característica" : "⚡ Nova Característica"

  _atualizarLimiteEscalaCarac()
  for (const chave of Object.keys(TABELAS)) renderTabelaCarac(chave)
  trocarAbaCarac(0)
  atualizarPreviewCarac()
  abrirModal("modalCaracteristica")
}

export function atualizarEscala() {
  const nova  = +document.getElementById("caracEscala").value || 1
  const ficha = _getFicha?.()

  if (ficha && nova > ficha.escalaMax) {
    toastErro(`Sua escala máxima é ${ficha.escalaMax} (nível ${ficha.nivel}). Suba de nível para desbloquear.`)
    document.getElementById("caracEscala").value = _caracTemp.escala
  window.syncStepper?.("caracEscala")
    return
  }

  const isGratuita = document.getElementById("caracGratuita")?.checked ?? false
  if (!isGratuita) {
    const pcsNec    = PC_POR_ESCALA[nova] ?? nova
    const pcsLivres = _fonteTemp.pcsDisponiveis + (_caracEditIndex !== null ? (PC_POR_ESCALA[_caracTemp.escala] ?? _caracTemp.escala) : 0)
    if (pcsNec > pcsLivres) {
      toastErro(`PCs insuficientes! Escala ${nova} requer ${pcsNec} PC(s), mas há ${_fonteTemp.pcsDisponiveis} disponíveis.`)
      document.getElementById("caracEscala").value = _caracTemp.escala
  window.syncStepper?.("caracEscala")
      return
    }
  }

  _caracTemp.escala = nova
  _atualizarLimiteEscalaCarac()
  atualizarPreviewCarac()
}

export function atualizarLimiteEscala() {
  _atualizarLimiteEscalaCarac()
}

function _atualizarLimiteEscalaCarac() {
  const ficha          = _getFicha?.()
  const escalaMaxFicha = ficha?.escalaMax ?? 6
  const isGratuita     = document.getElementById("caracGratuita")?.checked ?? false

  let escalaMax
  if (isGratuita) {
    // Característica gratuita: não limita por PCs, só pelo nível
    escalaMax = escalaMaxFicha
    const info = document.getElementById("escalaMaxInfo")
    if (info) info.innerText = `(máx. ${escalaMax} pelo nível — grátis em PCs)`
  } else {
    const pcsLivres = _fonteTemp.pcsDisponiveis + (_caracEditIndex !== null ? (PC_POR_ESCALA[_caracTemp.escala] ?? _caracTemp.escala) : 0)
    const escalaMaxPC = Object.entries(PC_POR_ESCALA).filter(([,pc]) => pc <= pcsLivres).map(([e]) => +e).pop() ?? 1
    escalaMax = Math.min(escalaMaxPC, escalaMaxFicha)
    const info = document.getElementById("escalaMaxInfo")
    if (info) info.innerText = `(máx. ${escalaMax} · ${_fonteTemp.pcsDisponiveis} PC · nível libera até ${escalaMaxFicha})`
  }

  document.getElementById("caracEscala").max = escalaMax
}

export function confirmarCriarCaracteristica() {
  const gasto  = calcularGastoCarac()
  const limite = ORCAMENTO_POR_ESCALA[_caracTemp.escala]
  if (gasto > limite) { toastErro(`Orçamento ultrapassado! Máx: ${limite}, Gasto: ${gasto}`); return }

  const gratuita = document.getElementById("caracGratuita")?.checked ?? false
  const pcsNec   = PC_POR_ESCALA[_caracTemp.escala] ?? _caracTemp.escala
  if (!gratuita && _caracEditIndex === null && pcsNec > _fonteTemp.pcsDisponiveis) {
    toastErro(`PCs insuficientes! Esta escala requer ${pcsNec} PC(s).`); return
  }
  const dados = {
    nome:        document.getElementById("caracNome").value || "Característica",
    descricao:   document.getElementById("caracDescricao").value,
    escala:      _caracTemp.escala,
    gratuita,
    escolhas:    _caracTemp.escolhas,
    custo:       gasto,
    custoPM:     calcularPMCarac(),
    amplificada: _caracTemp.amplificada ?? null,
    reduzida:    _caracTemp.reduzida    ?? null
  }

  if (_caracEditIndex !== null) _fonteTemp.editarCaracteristica(_caracEditIndex, dados)
  else _fonteTemp.adicionarCaracteristica(new Caracteristica(dados))

  _atualizarPCsDisplay()
  _renderCaracteristicasFonteModal()
  fecharModal("modalCaracteristica")
}

// ── Tabela com stack e right-click ────────────────────────
export function renderTabelaCarac(chave) {
  const config    = TABELAS[chave]
  const container = document.getElementById(`aba_${chave}`)
  if (!container) return

  const tipo = config.tipo  // "empilhavel" | "empilhavel_mono" | "unico"
  const grupoExclusivo = config.grupoExclusivo ?? null  // ex: "infligir"

  container.innerHTML = `<p style="opacity:0.6;font-size:13px;margin-bottom:8px">${config.descricao}</p>`

  // ── Linha de BASE GRATUITA ────────────────────────────────
  if (config.base !== undefined) {
    const baseRow = document.createElement("div")
    baseRow.className = "base-gratuita"
    baseRow.innerHTML = `<span>Base (gratuita):</span> <span>${config.base}</span>`
    container.appendChild(baseRow)
  }

  const mostraQtd = tipo === "empilhavel" || tipo === "empilhavel_mono"
  const tabela = document.createElement("table")
  tabela.className = "tabela-sistema"
  tabela.innerHTML = `<thead><tr>
    <th>${config.label}</th><th>Orç.</th><th>PM</th>
    ${mostraQtd ? "<th>Qtd</th>" : ""}
  </tr></thead>`

  const tbody = document.createElement("tbody")
  const trPorItem = new Map()  // item → tr (para empilhavel_mono re-render)

  for (const item of config.dados) {
    const chaveItem = item.nome ?? `+${item.valor}`  // identificador único da linha
    const estado = { qtd: 0 }
    const tr     = document.createElement("tr")
    trPorItem.set(chaveItem, { tr, estado, item })

    const tdNome = item.valor !== undefined ? `+${item.valor}` : item.nome
    const tdPm   = item.pm !== undefined ? (item.pm < 0 ? String(item.pm) : `+${item.pm}`) : "-"
    const tdOrc  = item.gratuita ? `<span style="opacity:0.4;font-size:11px">grátis</span>` : item.orcamento

    // ── Restaura estado salvo ─────────────────────────────
    const salvo = _caracTemp.escolhas[chave] ?? []
    if (tipo === "empilhavel") {
      estado.qtd = salvo.filter(i => (i.nome ?? `+${i.valor}`) === chaveItem).length
    } else if (tipo === "empilhavel_mono") {
      estado.qtd = salvo.filter(i => (i.nome ?? `+${i.valor}`) === chaveItem).length
    } else if (tipo === "unico") {
      if (salvo.length && (salvo[0].nome ?? `+${salvo[0].valor}`) === chaveItem) {
        tr.classList.add("selecionado")
      }
    }

    tr.innerHTML = `
      <td>${tdNome}${item.gratuita ? ' <span style="font-size:10px;opacity:0.5;color:#22c55e">(base)</span>' : ""}</td><td>${tdOrc}</td><td>${tdPm}</td>
      ${mostraQtd ? `<td><span class="qtd">${estado.qtd}</span></td>` : ""}
    `
    // Itens gratuitos: aparência bloqueada, não são clicáveis
    if (item.gratuita) {
      tr.style.cursor  = "default"
      tr.style.opacity = "0.6"
      tr.style.background = "rgba(34,197,94,0.07)"
      continue
    }
    tr.style.cursor = "pointer"

    // ── EMPILHAVEL normal ─────────────────────────────────
    if (tipo === "empilhavel") {
      tr.addEventListener("click", e => {
        e.preventDefault()
        // Grupo exclusivo: limpa a outra chave do grupo
        if (grupoExclusivo) _limparGrupoExclusivo(grupoExclusivo, chave)
        estado.qtd++
        _caracTemp.escolhas[chave].push({ ...item })
        tr.querySelector(".qtd").innerText = estado.qtd
        _flashRow(tr, "verde")
        atualizarPreviewCarac()
      })
      tr.addEventListener("contextmenu", e => {
        e.preventDefault()
        if (estado.qtd <= 0) return
        estado.qtd--
        const idx = _caracTemp.escolhas[chave].map(i => i.nome ?? `+${i.valor}`).lastIndexOf(chaveItem)
        if (idx !== -1) _caracTemp.escolhas[chave].splice(idx, 1)
        tr.querySelector(".qtd").innerText = estado.qtd
        _flashRow(tr, "vermelho")
        atualizarPreviewCarac()
      })
    }

    // ── EMPILHAVEL_MONO: só empilha o mesmo tipo ──────────
    else if (tipo === "empilhavel_mono") {
      tr.addEventListener("click", e => {
        e.preventDefault()
        const atualChave = _caracTemp.escolhas[chave]?.[0]
          ? (_caracTemp.escolhas[chave][0].nome ?? `+${_caracTemp.escolhas[chave][0].valor}`)
          : null

        // Troca de linha: zera estado de todas as linhas e reseta escolhas
        if (atualChave && atualChave !== chaveItem) {
          _caracTemp.escolhas[chave] = []
          trPorItem.forEach(({ tr: outraTr, estado: outroEstado }) => {
            outroEstado.qtd = 0
            const q = outraTr.querySelector(".qtd")
            if (q) q.innerText = 0
            outraTr.classList.remove("selecionado")
          })
          _flashRow(tr, "vermelho")  // sinaliza descarte
        }

        // Empilha esta linha
        estado.qtd++
        _caracTemp.escolhas[chave].push({ ...item })
        tr.querySelector(".qtd").innerText = estado.qtd
        tr.classList.add("selecionado")
        _flashRow(tr, "verde")
        atualizarPreviewCarac()
      })
      tr.addEventListener("contextmenu", e => {
        e.preventDefault()
        if (estado.qtd <= 0) return
        estado.qtd--
        _caracTemp.escolhas[chave].pop()
        tr.querySelector(".qtd").innerText = estado.qtd
        if (estado.qtd === 0) tr.classList.remove("selecionado")
        _flashRow(tr, "vermelho")
        atualizarPreviewCarac()
      })
      // Marca como selecionada se tem itens
      if (estado.qtd > 0) tr.classList.add("selecionado")
    }

    // ── UNICO ─────────────────────────────────────────────
    else {
      tr.addEventListener("click", () => {
        _caracTemp.escolhas[chave] = [{ ...item }]
        tbody.querySelectorAll("tr").forEach(l => l.classList.remove("selecionado"))
        tr.classList.add("selecionado")
        atualizarPreviewCarac()
      })
    }

    tbody.appendChild(tr)
  }

  tabela.appendChild(tbody)
  container.appendChild(tabela)

  if (mostraQtd) {
    const dica = document.createElement("p")
    dica.style.cssText = "font-size:11px;opacity:0.4;margin-top:4px"
    dica.innerText = tipo === "empilhavel_mono"
      ? "Clique: adicionar stack • Clique direito: remover • Trocar linha descarta stack"
      : "Clique esquerdo: adicionar • Clique direito: remover"
    container.appendChild(dica)
  }

  if (grupoExclusivo) {
    const aviso = document.createElement("p")
    aviso.style.cssText = "font-size:11px;opacity:0.55;margin-top:4px;color:#fbbf24"
    aviso.innerText = "⚠️ Mutuamente exclusivo com a outra aba do grupo"
    container.appendChild(aviso)
  }
}

// Limpa todas as chaves do mesmo grupo exclusivo, exceto a atual
function _limparGrupoExclusivo(grupo, chaveAtiva) {
  for (const [k, cfg] of Object.entries(TABELAS)) {
    if (k !== chaveAtiva && cfg.grupoExclusivo === grupo) {
      if (_caracTemp.escolhas[k]?.length) {
        _caracTemp.escolhas[k] = []
        // Re-renderiza a aba afetada para atualizar qtd visualmente
        renderTabelaCarac(k)
        toastAviso("Stack de '" + cfg.label + "' descartado (mutuamente exclusivo).")
      }
    }
  }
}

function _flashRow(tr, cor) {
  const bg = cor === "verde" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"
  tr.style.transition = "background 0s"
  tr.style.background = bg
  setTimeout(() => { tr.style.transition = "background 0.7s"; tr.style.background = "" }, 30)
}

// ── Render lista de características na modal de fonte ────
// ── HTML das variantes para cards ─────────────────────────
function _htmlVariantesCard(c) {
  const renderV = (v, tipo) => {
    if (!v) return ''
    const amp   = tipo === 'amplificada'
    const icone = amp ? '⬆️' : '⬇️'
    const label = amp ? 'Amplificada' : 'Reduzida'
    const cor   = amp ? '#f59e0b' : '#60a5fa'
    // v tem { custoPM, chave, label, valor, destaque } — um único item
    const corDetalhe = v.destaque === 'amp' ? '#fbbf24'
      : v.destaque === 'red' ? '#93c5fd'
      : 'rgba(255,255,255,0.45)'
    const linhaDetalhe = v.label && v.valor
      ? `<span style="color:${corDetalhe};font-size:11px">${v.label}: <strong>${v.valor}</strong></span>`
      : ''
    return `<div style="border:1px solid ${cor}55;border-radius:6px;padding:5px 8px;margin-top:5px;background:${amp ? 'rgba(245,158,11,0.06)' : 'rgba(96,165,250,0.06)'}">
      <span style="font-size:11px;font-weight:600;color:${cor}">${icone} ${label} — ${v.custoPM} PM</span>
      ${linhaDetalhe ? `<div style="margin-top:3px">${linhaDetalhe}</div>` : ''}
    </div>`
  }

  const ha = renderV(c.amplificada, 'amplificada')
  const hr = renderV(c.reduzida,    'reduzida')
  if (!ha && !hr) return ''
  return `<div style="margin-top:4px">${ha}${hr}</div>`
}

function _renderCaracteristicasFonteModal() {
  const container = document.getElementById("listaCaracteristicas")
  if (!container || !_fonteTemp) return
  container.innerHTML = ""

  if (!_fonteTemp.caracteristicas.length) {
    container.innerHTML = "<p style='opacity:0.4;font-size:13px;margin-top:8px'>Nenhuma característica ainda.</p>"
    return
  }

  _fonteTemp.caracteristicas.forEach((c, i) => {
    const div = document.createElement("div")
    div.className = "card-elemento"
    div.style.marginTop = "8px"
    if (c.gratuita) div.style.borderColor = "#22c55e"

    const resumo = _resumoEscolhas(c.escolhas)
    const resumoHTML = Object.entries(resumo).map(([label, val]) =>
      `<div class="carac-resumo-row"><span class="carac-resumo-label">${label}:</span> <span>${val}</span></div>`
    ).join("")

    const gratuitaBadge = c.gratuita
      ? `<span style="font-size:10px;background:#14532d;color:#86efac;padding:1px 6px;border-radius:4px;margin-left:4px">GRÁTIS em PCs</span>`
      : ""

    const variantesHTML = _htmlVariantesCard(c)

    div.innerHTML = `
      <div class="card-header">
        <strong>${c.nome}${gratuitaBadge}</strong>
        <div style="display:flex;gap:8px;font-size:12px;opacity:0.7">
          <span>Escala ${c.escala}</span>
          <span>|</span>
          ${c.gratuita ? '<span style="color:#86efac">0 PC</span>' : `<span>Orç. ${c.custo}</span>`}
          <span>|</span>
          <span>${c.custoPM} PM</span>
        </div>
      </div>
      ${resumoHTML ? `<div class="carac-resumo">${resumoHTML}</div>` : ""}
      ${variantesHTML}
      ${c.descricao ? `<p class="carac-descricao">${c.descricao}</p>` : ""}
      <div class="card-actions" style="margin-top:8px">
        <button class="btn-editar">✏️ Editar</button>
        ${c.gratuita ? "" : `<button class="btn-remover">🗑️ Remover</button>`}
      </div>
    `
    div.querySelector(".btn-editar").onclick = () => abrirCriarCaracteristica(i)
    const btnRemover = div.querySelector(".btn-remover")
    if (btnRemover) btnRemover.onclick = () => {
      _fonteTemp.removerCaracteristica(i)
      _atualizarPCsDisplay()
      _renderCaracteristicasFonteModal()
    }
    container.appendChild(div)
  })
}

export function renderCaracteristicasFonte() { _renderCaracteristicasFonteModal() }

// ── Cálculos ──────────────────────────────────────────────
function calcularGastoCarac() {
  let t = 0
  for (const lista of Object.values(_caracTemp.escolhas))
    for (const item of lista)
      if (!item.gratuita) t += item.orcamento ?? 0
  // Amplificar e Reduzir custam 4 de orçamento cada
  if (_caracTemp.amplificada) t += 4
  if (_caracTemp.reduzida)    t += 4
  return t
}

function calcularPMCarac() {
  let t = 0
  for (const lista of Object.values(_caracTemp.escolhas))
    for (const item of lista) t += item.pm ?? 0
  return Math.max(2, t)
}

export function atualizarPreviewCarac() {
  const limite = ORCAMENTO_POR_ESCALA[_caracTemp?.escala ?? 1]
  const gasto  = calcularGastoCarac()
  const pm     = calcularPMCarac()
  document.getElementById("orcamentoTotal").innerText = limite
  document.getElementById("orcamentoGasto").innerText = gasto
  document.getElementById("orcamentoPM").innerText    = pm
  document.getElementById("orcamentoGasto").style.color = gasto > limite ? "#ef4444" : "#22c55e"
  _renderPainelVariantes()
}

// ── Painel de Variantes (Amplificada / Reduzida) ──────────
// Cada variante armazena: { chave, label, valor, custoPM, destaque } | null

function _renderPainelVariantes() {
  const container = document.getElementById("painelVariantes")
  if (!container || !_caracTemp) return

  const abas = abasDisponiveis(_caracTemp.escolhas)

  const renderBloco = (tipo) => {
    const amp     = tipo === 'amplificada'
    const icone   = amp ? '⬆️' : '⬇️'
    const label   = amp ? 'Amplificada' : 'Reduzida'
    const cor     = amp ? '#f59e0b' : '#60a5fa'
    const corBg   = amp ? 'rgba(245,158,11,0.07)' : 'rgba(96,165,250,0.07)'
    const variant = _caracTemp[tipo]

    // Seletor de abas (select)
    const optsHTML = abas.map(a =>
      `<option value="${a.chave}" ${variant?.chave === a.chave ? 'selected' : ''}>${a.label}</option>`
    ).join('')
    const selectHTML = `<select onchange="selecionarAbaVariante('${tipo}', this.value)"
      style="background:#0f172a;color:${cor};border:1px solid ${cor}55;border-radius:5px;padding:2px 6px;font-size:12px;cursor:pointer">
      ${optsHTML}
    </select>`

    if (!variant) {
      return `<div class="variante-bloco" style="border-color:${cor}30">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
          <span style="font-size:12px;opacity:0.6">${icone} Forma ${label}</span>
          <div style="display:flex;gap:6px;align-items:center">
            ${abas.length ? selectHTML : ''}
            <button onclick="toggleVariante('${tipo}')"
              style="background:${cor}22;border:1px solid ${cor}55;color:${cor};padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px">
              + Adicionar
            </button>
          </div>
        </div>
      </div>`
    }

    const corDetalhe = variant.destaque === 'amp' ? '#fbbf24' : variant.destaque === 'red' ? '#93c5fd' : 'rgba(255,255,255,0.5)'

    return `<div class="variante-bloco" style="border-color:${cor};background:${corBg}">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:600;color:${cor}">${icone} Forma ${label} — ${variant.custoPM} PM</span>
        <div style="display:flex;gap:6px;align-items:center">
          ${abas.length ? selectHTML : ''}
          <button onclick="toggleVariante('${tipo}')"
            style="background:transparent;border:1px solid #475569;color:#94a3b8;padding:3px 8px;border-radius:5px;cursor:pointer;font-size:11px">
            ✕ Remover
          </button>
        </div>
      </div>
      <span style="color:${corDetalhe};font-size:12px">${variant.label}: <strong>${variant.valor}</strong></span>
    </div>`
  }

  container.innerHTML = `
    <div style="font-size:11px;opacity:0.45;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Formas Alternativas</div>
    ${renderBloco('amplificada')}
    ${renderBloco('reduzida')}
  `
}

export function selecionarAbaVariante(tipo, chave) {
  if (!_caracTemp) return
  const variant = _caracTemp[tipo]
  if (!variant) return  // só muda a aba se já tiver sido adicionada
  const novo = computarVarianteAba(_caracTemp.escolhas, chave, tipo)
  if (!novo) { toastErro(`Não é possível ${tipo === 'amplificada' ? 'amplificar' : 'reduzir'} a aba ${chave}.`); return }
  _caracTemp[tipo] = novo
  _renderPainelVariantes()
}

export function toggleVariante(tipo) {
  if (!_caracTemp) return
  if (_caracTemp[tipo]) {
    _caracTemp[tipo] = null
    toastAviso(`Forma ${tipo} removida.`)
    atualizarPreviewCarac()
    return
  }
  // Pega a aba do select correspondente
  const selId = tipo === 'amplificada' ? 0 : 1
  const sels  = document.getElementById("painelVariantes")?.querySelectorAll("select")
  const chave = sels?.[selId]?.value ?? abasDisponiveis(_caracTemp.escolhas)[0]?.chave
  if (!chave) { toastErro('Nenhuma aba disponível.'); return }
  const computed = computarVarianteAba(_caracTemp.escolhas, chave, tipo)
  if (!computed) { toastErro(`Não é possível ${tipo === 'amplificada' ? 'amplificar' : 'reduzir'} a aba selecionada.`); return }
  _caracTemp[tipo] = computed
  toastSucesso(`Forma ${tipo} adicionada!`)
  atualizarPreviewCarac()
}

// ── Abas ──────────────────────────────────────────────────
export function trocarAbaCarac(i) {
  document.querySelectorAll(".tab-carac").forEach(t => t.classList.remove("active"))
  document.querySelectorAll(".conteudo-carac").forEach(c => c.classList.remove("active"))
  document.querySelectorAll(".tab-carac")[i]?.classList.add("active")
  document.querySelectorAll(".conteudo-carac")[i]?.classList.add("active")
}

export function abrirModal(id) { document.getElementById(id)?.classList.remove("hidden") }
export function fecharModal(id) { document.getElementById(id)?.classList.add("hidden") }

// ─────────────────────────────────────────────────────────
//  CARACTERÍSTICA ISOLADA (sem fonte de poder)
// ─────────────────────────────────────────────────────────

let _onSalvarIsolada  = null
let _isoladaEditIndex = null
let _isoladaTemp      = null

export function registrarCallbackIsolada(fn) { _onSalvarIsolada = fn }

export function abrirCriarCaracteristicaIsolada(editIndex = null, existente = null) {
  _isoladaEditIndex = editIndex
  _isoladaTemp = {
    escala:   existente?.escala ?? 1,
    escolhas: Object.fromEntries(
      Object.keys(TABELAS).map(k => [k, existente?.escolhas?.[k] ? [...existente.escolhas[k]] : []])
    )
  }

  document.getElementById("isoladaNome").value      = existente?.nome      ?? ""
  document.getElementById("isoladaDescricao").value = existente?.descricao ?? ""
  document.getElementById("isoladaOrigem").value    = existente?.origem    ?? ""
  document.getElementById("isoladaEscala").value    = _isoladaTemp.escala
  window.syncStepper?.("isoladaEscala")
  document.getElementById("isoladaCustoPT").value   = existente?.custoPT   ?? 0
  window.syncStepper?.("isoladaCustoPT")

  const ficha     = _getFicha?.()
  const escalaMax = ficha?.escalaMax ?? 6
  const info      = document.getElementById("isoladaEscalaInfo")
  if (info) info.innerText = `(máx. ${escalaMax} pelo nível)`
  document.getElementById("isoladaEscala").max = escalaMax

  const titulo = document.getElementById("modalIsoladaTitulo")
  if (titulo) titulo.innerText = editIndex !== null ? "✏️ Editar Característica Isolada" : "⚡ Criar Característica Isolada"

  _atualizarPreviewIsolada()
  abrirModal("modalCaracIsolada")
}

export function atualizarEscalaIsolada() {
  const nova  = +document.getElementById("isoladaEscala").value || 1
  const ficha = _getFicha?.()
  if (ficha && nova > ficha.escalaMax) {
    toastErro(`Escala máxima pelo nível: ${ficha.escalaMax}`)
    document.getElementById("isoladaEscala").value = _isoladaTemp?.escala ?? 1
  window.syncStepper?.("isoladaEscala")
    return
  }
  if (_isoladaTemp) {
    _isoladaTemp.escala  = nova
    // Reseta escolhas ao trocar escala para não ultrapassar orçamento
    _isoladaTemp.escolhas = _escolhasIniciais()
  }
  _atualizarPreviewIsolada()
}

function _atualizarPreviewIsolada() {
  const escala = _isoladaTemp?.escala ?? 1
  const limite = ORCAMENTO_POR_ESCALA[escala] ?? 10
  const gasto  = _calcularGastoIsolada()
  const pm     = _calcularPMIsolada()

  const elMax   = document.getElementById("isoladaOrcMax")
  const elGasto = document.getElementById("isoladaOrcGasto")
  const elPM    = document.getElementById("isoladaOrcPM")
  const elInfo  = document.getElementById("isoladaEscalaInfo")

  if (elMax)   elMax.innerText  = limite
  if (elGasto) { elGasto.innerText = gasto; elGasto.style.color = gasto > limite ? "#ef4444" : "#22c55e" }
  if (elPM)    elPM.innerText   = pm
  if (elInfo)  {
    const ficha = _getFicha?.()
    elInfo.innerText = `(máx. ${ficha?.escalaMax ?? 6} pelo nível)`
  }
}

function _calcularGastoIsolada() {
  if (!_isoladaTemp?.escolhas) return 0
  let t = 0
  for (const lista of Object.values(_isoladaTemp.escolhas))
    for (const item of lista)
      if (!item.gratuita) t += item.orcamento ?? 0
  // Amplificar e Reduzir custam 4 de orçamento cada
  if (_isoladaTemp.amplificada) t += 4
  if (_isoladaTemp.reduzida)    t += 4
  return t
}

function _calcularPMIsolada() {
  if (!_isoladaTemp?.escolhas) return 2
  let t = 0
  for (const lista of Object.values(_isoladaTemp.escolhas)) for (const item of lista) t += item.pm ?? 0
  return Math.max(2, t)
}

export function confirmarCaracIsolada() {
  const nome = document.getElementById("isoladaNome").value?.trim()
  if (!nome) { toastErro("Digite um nome para a característica."); return }

  const escala  = +document.getElementById("isoladaEscala").value  || 1
  const custoPT = +document.getElementById("isoladaCustoPT").value || 0
  const ficha   = _getFicha?.()
  if (ficha && escala > ficha.escalaMax) {
    toastErro(`Escala máxima pelo nível: ${ficha.escalaMax}`)
    return
  }

  const gasto  = _calcularGastoIsolada()
  const limite = ORCAMENTO_POR_ESCALA[escala]
  if (gasto > limite) {
    toastErro(`Orçamento ultrapassado! Máx: ${limite}, Gasto: ${gasto}. Ajuste as tabelas.`)
    return
  }

  const c = new Caracteristica({
    nome,
    descricao:   document.getElementById("isoladaDescricao").value,
    origem:      document.getElementById("isoladaOrigem").value,
    escala,
    custoPT,
    escolhas:    _isoladaTemp?.escolhas    ?? {},
    amplificada: _isoladaTemp?.amplificada ?? null,
    reduzida:    _isoladaTemp?.reduzida    ?? null,
    custo:       gasto,
    custoPM:     _calcularPMIsolada()
  })

  _onSalvarIsolada?.(c, _isoladaEditIndex)
  fecharModal("modalCaracIsolada")
  toastSucesso(_isoladaEditIndex !== null ? "Característica atualizada!" : "Característica isolada criada!")
}

// ═══════════════════════════════════════════════════════════
//  LOJINHA ISOLADA — lógica COMPLETAMENTE separada da fonte
//  Usa seus próprios elementos DOM (iso_aba_*, isoOrc*, etc.)
// ═══════════════════════════════════════════════════════════

let _isoEscolhas    = {}   // estado interno das escolhas da lojinha isolada
let _isoEscala      = 1    // escala corrente
let _isoAmplificada = null // variante amplificada da lojinha isolada
let _isoReduzida    = null // variante reduzida da lojinha isolada

// ── Abas ────────────────────────────────────────────────────
export function trocarAbaIso(i) {
  document.querySelectorAll(".tab-iso").forEach(t => t.classList.remove("active"))
  document.querySelectorAll(".conteudo-iso").forEach(c => c.classList.remove("active"))
  document.querySelectorAll(".tab-iso")[i]?.classList.add("active")
  document.querySelectorAll(".conteudo-iso")[i]?.classList.add("active")
}

// ── Preview de orçamento ────────────────────────────────────
function _isoAtualizarPreview() {
  const limite = ORCAMENTO_POR_ESCALA[_isoEscala] ?? 10
  let gasto = 0, pm = 0
  for (const lista of Object.values(_isoEscolhas)) {
    for (const item of lista) {
      if (!item.gratuita) gasto += item.orcamento ?? 0
      pm += item.pm ?? 0
    }
  }
  // Amplificar e Reduzir custam 4 de orçamento cada
  if (_isoAmplificada) gasto += 4
  if (_isoReduzida)    gasto += 4
  pm = Math.max(2, pm)

  const elTotal = document.getElementById("isoOrcTotal")
  const elGasto = document.getElementById("isoOrcGasto")
  const elPM    = document.getElementById("isoOrcPM")
  if (elTotal) elTotal.innerText = limite
  if (elGasto) { elGasto.innerText = gasto; elGasto.style.color = gasto > limite ? "#ef4444" : "#22c55e" }
  if (elPM)    elPM.innerText    = pm
  _renderPainelVariantesIso()
}

// ── Render de uma aba da lojinha isolada ────────────────────
function _isoRenderAba(chave) {
  const config    = TABELAS[chave]
  const container = document.getElementById(`iso_aba_${chave}`)
  if (!container || !config) return

  const tipo           = config.tipo
  const grupoExclusivo = config.grupoExclusivo ?? null

  container.innerHTML = `<p style="opacity:0.6;font-size:13px;margin-bottom:8px">${config.descricao}</p>`

  if (config.base !== undefined) {
    const baseRow = document.createElement("div")
    baseRow.className = "base-gratuita"
    baseRow.innerHTML = `<span>Base (gratuita):</span><span>${config.base}</span>`
    container.appendChild(baseRow)
  }

  const mostraQtd = tipo === "empilhavel" || tipo === "empilhavel_mono"
  const tabela = document.createElement("table")
  tabela.className = "tabela-sistema"
  tabela.innerHTML = `<thead><tr>
    <th>${config.label}</th><th>Orç.</th><th>PM</th>
    ${mostraQtd ? "<th>Qtd</th>" : ""}
  </tr></thead>`

  const tbody     = document.createElement("tbody")
  const trPorItem = new Map()

  if (!_isoEscolhas[chave]) _isoEscolhas[chave] = []

  for (const item of config.dados) {
    const chaveItem = item.nome ?? `+${item.valor}`
    const estado    = { qtd: 0 }
    const tr        = document.createElement("tr")
    trPorItem.set(chaveItem, { tr, estado, item })

    const tdNome = item.valor !== undefined ? `+${item.valor}` : item.nome
    const tdPm   = item.pm !== undefined ? (item.pm < 0 ? String(item.pm) : `+${item.pm}`) : "-"
    const tdOrc  = item.gratuita ? `<span style="opacity:0.4;font-size:11px">grátis</span>` : item.orcamento

    const salvo = _isoEscolhas[chave]
    if (tipo === "empilhavel" || tipo === "empilhavel_mono") {
      estado.qtd = salvo.filter(i => (i.nome ?? `+${i.valor}`) === chaveItem).length
    } else if (tipo === "unico") {
      if (salvo.length && (salvo[0].nome ?? `+${salvo[0].valor}`) === chaveItem) {
        tr.classList.add("selecionado")
      }
    }

    tr.innerHTML = `
      <td>${tdNome}${item.gratuita ? ' <span style="font-size:10px;opacity:0.5;color:#22c55e">(base)</span>' : ""}</td><td>${tdOrc}</td><td>${tdPm}</td>
      ${mostraQtd ? `<td><span class="qtd">${estado.qtd}</span></td>` : ""}
    `

    if (item.gratuita) {
      tr.style.cursor     = "default"
      tr.style.opacity    = "0.6"
      tr.style.background = "rgba(34,197,94,0.07)"
      continue
    }
    tr.style.cursor = "pointer"

    if (tipo === "empilhavel") {
      tr.addEventListener("click", e => {
        e.preventDefault()
        if (grupoExclusivo) _isoLimparGrupo(grupoExclusivo, chave)
        estado.qtd++
        _isoEscolhas[chave].push({ ...item })
        tr.querySelector(".qtd").innerText = estado.qtd
        _isoFlash(tr, "verde")
        _isoAtualizarPreview()
      })
      tr.addEventListener("contextmenu", e => {
        e.preventDefault()
        if (estado.qtd <= 0) return
        estado.qtd--
        const idx = _isoEscolhas[chave].map(i => i.nome ?? `+${i.valor}`).lastIndexOf(chaveItem)
        if (idx !== -1) _isoEscolhas[chave].splice(idx, 1)
        tr.querySelector(".qtd").innerText = estado.qtd
        _isoFlash(tr, "vermelho")
        _isoAtualizarPreview()
      })
    } else if (tipo === "empilhavel_mono") {
      tr.addEventListener("click", e => {
        e.preventDefault()
        const atualChave = _isoEscolhas[chave]?.[0]
          ? (_isoEscolhas[chave][0].nome ?? `+${_isoEscolhas[chave][0].valor}`)
          : null
        if (atualChave && atualChave !== chaveItem) {
          _isoEscolhas[chave] = []
          trPorItem.forEach(({ tr: outra, estado: outroEst }) => {
            outroEst.qtd = 0
            const q = outra.querySelector(".qtd"); if (q) q.innerText = 0
            outra.classList.remove("selecionado")
          })
          _isoFlash(tr, "vermelho")
        }
        estado.qtd++
        _isoEscolhas[chave].push({ ...item })
        tr.querySelector(".qtd").innerText = estado.qtd
        tr.classList.add("selecionado")
        _isoFlash(tr, "verde")
        _isoAtualizarPreview()
      })
      tr.addEventListener("contextmenu", e => {
        e.preventDefault()
        if (estado.qtd <= 0) return
        estado.qtd--
        _isoEscolhas[chave].pop()
        tr.querySelector(".qtd").innerText = estado.qtd
        if (estado.qtd === 0) tr.classList.remove("selecionado")
        _isoFlash(tr, "vermelho")
        _isoAtualizarPreview()
      })
      if (estado.qtd > 0) tr.classList.add("selecionado")
    } else {
      tr.addEventListener("click", () => {
        _isoEscolhas[chave] = [{ ...item }]
        tbody.querySelectorAll("tr").forEach(l => l.classList.remove("selecionado"))
        tr.classList.add("selecionado")
        _isoAtualizarPreview()
      })
    }

    tbody.appendChild(tr)
  }

  tabela.appendChild(tbody)
  container.appendChild(tabela)

  if (mostraQtd) {
    const dica = document.createElement("p")
    dica.style.cssText = "font-size:11px;opacity:0.4;margin-top:4px"
    dica.innerText = tipo === "empilhavel_mono"
      ? "Clique: adicionar stack • Clique direito: remover • Trocar linha descarta stack"
      : "Clique esquerdo: adicionar • Clique direito: remover"
    container.appendChild(dica)
  }

  if (grupoExclusivo) {
    const aviso = document.createElement("p")
    aviso.style.cssText = "font-size:11px;opacity:0.55;margin-top:4px;color:#fbbf24"
    aviso.innerText = "⚠️ Mutuamente exclusivo com a outra aba do grupo"
    container.appendChild(aviso)
  }
}

function _isoLimparGrupo(grupo, chaveAtiva) {
  for (const [k, cfg] of Object.entries(TABELAS)) {
    if (k !== chaveAtiva && cfg.grupoExclusivo === grupo) {
      if (_isoEscolhas[k]?.length) {
        _isoEscolhas[k] = []
        _isoRenderAba(k)
        toastAviso("Stack de '" + cfg.label + "' descartado (mutuamente exclusivo).")
      }
    }
  }
}

function _isoFlash(tr, cor) {
  const bg = cor === "verde" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"
  tr.style.transition = "background 0s"
  tr.style.background = bg
  setTimeout(() => { tr.style.transition = "background 0.7s"; tr.style.background = "" }, 30)
}

// ── Painel de Variantes da Lojinha Isolada ──────────────────
function _renderPainelVariantesIso() {
  const container = document.getElementById("painelVariantesIso")
  if (!container) return
  const abas = abasDisponiveis(_isoEscolhas)

  const renderBloco = (tipo) => {
    const amp     = tipo === 'amplificada'
    const icone   = amp ? '⬆️' : '⬇️'
    const label   = amp ? 'Amplificada' : 'Reduzida'
    const cor     = amp ? '#f59e0b' : '#60a5fa'
    const corBg   = amp ? 'rgba(245,158,11,0.07)' : 'rgba(96,165,250,0.07)'
    const variant = amp ? _isoAmplificada : _isoReduzida

    const optsHTML = abas.map(a =>
      `<option value="${a.chave}" ${variant?.chave === a.chave ? 'selected' : ''}>${a.label}</option>`
    ).join('')
    const selectHTML = `<select onchange="selecionarAbaVarianteIso('${tipo}', this.value)"
      style="background:#0f172a;color:${cor};border:1px solid ${cor}55;border-radius:5px;padding:2px 6px;font-size:12px;cursor:pointer">
      ${optsHTML}
    </select>`

    if (!variant) {
      return `<div class="variante-bloco" style="border-color:${cor}30">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
          <span style="font-size:12px;opacity:0.6">${icone} Forma ${label}</span>
          <div style="display:flex;gap:6px;align-items:center">
            ${abas.length ? selectHTML : ''}
            <button onclick="toggleVarianteIso('${tipo}')"
              style="background:${cor}22;border:1px solid ${cor}55;color:${cor};padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px">
              + Adicionar
            </button>
          </div>
        </div>
      </div>`
    }

    const corDet = variant.destaque === 'amp' ? '#fbbf24' : '#93c5fd'
    return `<div class="variante-bloco" style="border-color:${cor};background:${corBg}">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:600;color:${cor}">${icone} Forma ${label} — ${variant.custoPM} PM</span>
        <div style="display:flex;gap:6px;align-items:center">
          ${abas.length ? selectHTML : ''}
          <button onclick="toggleVarianteIso('${tipo}')"
            style="background:transparent;border:1px solid #475569;color:#94a3b8;padding:3px 8px;border-radius:5px;cursor:pointer;font-size:11px">
            ✕ Remover
          </button>
        </div>
      </div>
      <span style="color:${corDet};font-size:12px">${variant.label}: <strong>${variant.valor}</strong></span>
    </div>`
  }

  container.innerHTML = `
    <div style="font-size:11px;opacity:0.45;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Formas Alternativas</div>
    ${renderBloco('amplificada')}
    ${renderBloco('reduzida')}
  `
}

export function selecionarAbaVarianteIso(tipo, chave) {
  const amp = tipo === 'amplificada'
  const v   = amp ? _isoAmplificada : _isoReduzida
  if (!v) return
  const novo = computarVarianteAba(_isoEscolhas, chave, tipo)
  if (!novo) { toastErro('Não é possível aplicar essa variante na aba selecionada.'); return }
  if (amp) _isoAmplificada = novo; else _isoReduzida = novo
  _renderPainelVariantesIso()
}

export function toggleVarianteIso(tipo) {
  const amp = tipo === 'amplificada'
  if (amp ? _isoAmplificada : _isoReduzida) {
    if (amp) _isoAmplificada = null; else _isoReduzida = null
    toastAviso(`Forma ${tipo} removida.`)
    _isoAtualizarPreview()
    return
  }
  const sels  = document.getElementById("painelVariantesIso")?.querySelectorAll("select")
  const selIdx = amp ? 0 : 1
  const chave = sels?.[selIdx]?.value ?? abasDisponiveis(_isoEscolhas)[0]?.chave
  if (!chave) { toastErro('Nenhuma aba disponível.'); return }
  const computed = computarVarianteAba(_isoEscolhas, chave, tipo)
  if (!computed) { toastErro('Não é possível aplicar essa variante.'); return }
  if (amp) _isoAmplificada = computed; else _isoReduzida = computed
  toastSucesso(`Forma ${tipo} adicionada!`)
  _isoAtualizarPreview()
}

// ── Abrir lojinha isolada ────────────────────────────────────
export function abrirLojinhaIsoladaModal(existente = null) {
  const nome   = document.getElementById("isoladaNome")?.value ?? ""
  const escala = +document.getElementById("isoladaEscala")?.value || 1

  _isoEscala   = escala
  _isoEscolhas = existente?.escolhas
    ? JSON.parse(JSON.stringify(existente.escolhas))
    : _escolhasIniciais()
  if (_isoladaTemp?.escolhas) {
    _isoEscolhas = JSON.parse(JSON.stringify(_isoladaTemp.escolhas))
  }
  // Carrega variantes salvas
  _isoAmplificada = _isoladaTemp?.amplificada ?? null
  _isoReduzida    = _isoladaTemp?.reduzida    ?? null

  const ficha     = _getFicha?.()
  const escalaMax = ficha?.escalaMax ?? 6

  const elNome   = document.getElementById("isoLojNome")
  const elEscala = document.getElementById("isoLojEscala")
  const elInfo   = document.getElementById("isoLojEscalaInfo")
  if (elNome)   elNome.value     = nome
  if (elEscala) elEscala.value   = escala
  if (elInfo)   elInfo.innerText = `(máx. ${escalaMax} pelo nível)`

  for (const chave of Object.keys(TABELAS)) _isoRenderAba(chave)
  trocarAbaIso(0)
  _isoAtualizarPreview()
  abrirModal("modalIsoladaLojinha")
}

// ── Confirmar (salva escolhas + variantes de volta ao _isoladaTemp) ──
export function confirmarIsoladaLojinha() {
  let gasto = Object.values(_isoEscolhas).flat().reduce((s, i) => i.gratuita ? s : s + (i.orcamento ?? 0), 0)
  // Amplificar e Reduzir custam 4 de orçamento cada
  if (_isoAmplificada) gasto += 4
  if (_isoReduzida)    gasto += 4
  const limite = ORCAMENTO_POR_ESCALA[_isoEscala] ?? 10
  if (gasto > limite) {
    toastErro(`Orçamento ultrapassado! Máx: ${limite}, Gasto: ${gasto}`)
    return
  }
  if (_isoladaTemp) {
    _isoladaTemp.escolhas    = JSON.parse(JSON.stringify(_isoEscolhas))
    _isoladaTemp.amplificada = _isoAmplificada
    _isoladaTemp.reduzida    = _isoReduzida
  }
  _atualizarPreviewIsolada()
  fecharModal("modalIsoladaLojinha")
  toastSucesso("Tabelas configuradas!")
}
