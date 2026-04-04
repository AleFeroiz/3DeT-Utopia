// ============================================================
//  ui/uiModal.js — Controle de todos os modais
// ============================================================

import { BANCO_ELEMENTOS              } from "../dados/banco.js"
import { TABELAS, ORCAMENTO_POR_ESCALA } from "../dados/bancoCaracteristicas.js"
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

const TIPOS_DANO = [
  "Corte","Perfuração","Pancada","Veneno","Ácido",
  "Água","Fogo","Lava","Ar","Gás","Terra","Areia",
  "Eletricidade","Luz","Gelo","Fuligem","Sombras","Haki"
]

// ── Registro ──────────────────────────────────────────────
export function registrarCallbacks({ onSalvarElemento, onSalvarFonte }) {
  _onSalvarElemento = onSalvarElemento
  _onSalvarFonte    = onSalvarFonte
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
export function abrirCriarFonte() {
  _fonteTemp = new FonteDePoder({ id: crypto.randomUUID() })
  document.getElementById("fonteNome").value    = ""
  document.getElementById("fonteTema").value    = ""
  document.getElementById("fonteCusto").value   = 0
  document.getElementById("fonteSubtipo").value = "geral"
  _atualizarPCsDisplay()
  _renderPassivosConfig()
  _renderCaracteristicasFonteModal()
  abrirModal("modalFonte")
}

export function atualizarCustoFonte() {
  _fonteTemp.atualizarCusto(+document.getElementById("fonteCusto").value || 0)
  _atualizarPCsDisplay()
}

export function atualizarSubtipoFonte() {
  _fonteTemp.subtipo = document.getElementById("fonteSubtipo").value
  _renderPassivosConfig()
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

  if (subtipo === "zoan") {
    container.innerHTML = `
      <div class="passivo-bloco">
        <p>🐾 <strong>Zoan</strong> — Escolha 2 tipos de dano para RESISTÊNCIA passiva:</p>
        <div class="tipos-dano-grid" id="tiposDanoZoan"></div>
        <p style="font-size:12px;opacity:0.5;margin-top:4px">Uma característica de Escala 3 gratuita será adicionada automaticamente.</p>
      </div>`
    _renderSeletorDano("tiposDanoZoan", 2, "zoan_resistencias")
  } else if (subtipo === "logia") {
    container.innerHTML = `
      <div class="passivo-bloco">
        <p>🌊 <strong>Logia</strong> — Escolha o elemento da sua fruta:</p>
        <select id="logiaElemento" style="width:100%;margin-top:6px;padding:8px;border-radius:8px;background:#0f172a;color:white;border:1px solid #334155">
          ${TIPOS_DANO.map(t => `<option value="${t}">${t}</option>`).join("")}
        </select>
        <p style="font-size:12px;opacity:0.6;margin-top:8px">→ Imune ao elemento escolhido<br>→ Imune a danos mundanos (exceto Haki)</p>
      </div>`
  }
}

function _renderSeletorDano(containerId, max, chave) {
  const container = document.getElementById(containerId)
  if (!container) return
  const sel = _fonteTemp.passivos[chave] ?? []
  container.innerHTML = ""
  TIPOS_DANO.forEach(tipo => {
    const btn = document.createElement("button")
    btn.className = "btn-tipo-dano" + (sel.includes(tipo) ? " selecionado" : "")
    btn.textContent = tipo
    btn.onclick = () => {
      const atual = _fonteTemp.passivos[chave] ?? []
      _fonteTemp.passivos[chave] = atual.includes(tipo)
        ? atual.filter(t => t !== tipo)
        : atual.length < max ? [...atual, tipo] : atual
      _renderSeletorDano(containerId, max, chave)
    }
    container.appendChild(btn)
  })
}

export function confirmarSalvarFonte() {
  _fonteTemp.nome    = document.getElementById("fonteNome").value
  _fonteTemp.tema    = document.getElementById("fonteTema").value
  _fonteTemp.subtipo = document.getElementById("fonteSubtipo").value

  if (_fonteTemp.subtipo === "logia") {
    const el = document.getElementById("logiaElemento")
    if (el) _fonteTemp.passivos.elemento = el.value
  }

  if (_fonteTemp.subtipo === "zoan" && !_fonteTemp.passivos.caracGratuitaConcedida) {
    _fonteTemp.caracteristicas.unshift(new Caracteristica({
      nome: "Forma Zoan (Gratuita)", descricao: "Característica gratuita de Escala 3 concedida pela Zoan.",
      escala: 3, custo: 0, custoPM: 6
    }))
    _fonteTemp.passivos.caracGratuitaConcedida = true
  }

  _onSalvarFonte?.(_fonteTemp)
  fecharModal("modalFonte")
}

// ── Modal: Criar/Editar Característica ───────────────────
export function abrirCriarCaracteristica(editIndex = null) {
  if (!_fonteTemp) return
  _caracEditIndex = editIndex
  const ex = editIndex !== null ? _fonteTemp.caracteristicas[editIndex] : null

  _caracTemp = {
    escala:   ex?.escala ?? 1,
    escolhas: Object.fromEntries(Object.keys(TABELAS).map(k => [k, []]))
  }

  document.getElementById("caracNome").value      = ex?.nome      ?? ""
  document.getElementById("caracDescricao").value = ex?.descricao ?? ""
  document.getElementById("caracEscala").value    = _caracTemp.escala
  document.getElementById("modalCaracTitulo").innerText =
    editIndex !== null ? "✏️ Editar Característica" : "⚡ Nova Característica"

  _atualizarLimiteEscalaCarac()
  for (const chave of Object.keys(TABELAS)) renderTabelaCarac(chave)
  trocarAbaCarac(0)
  atualizarPreviewCarac()
  abrirModal("modalCaracteristica")
}

export function atualizarEscala() {
  const nova = +document.getElementById("caracEscala").value || 1
  const pcsNec = PC_POR_ESCALA[nova] ?? nova
  const pcsLivres = _fonteTemp.pcsDisponiveis + (_caracEditIndex !== null ? (PC_POR_ESCALA[_caracTemp.escala] ?? _caracTemp.escala) : 0)
  if (pcsNec > pcsLivres) {
    alert(`PCs insuficientes! Escala ${nova} requer ${pcsNec} PC(s), mas há ${_fonteTemp.pcsDisponiveis} disponível.`)
    document.getElementById("caracEscala").value = _caracTemp.escala
    return
  }
  _caracTemp.escala = nova
  _atualizarLimiteEscalaCarac()
  atualizarPreviewCarac()
}

function _atualizarLimiteEscalaCarac() {
  const pcsLivres = _fonteTemp.pcsDisponiveis + (_caracEditIndex !== null ? (PC_POR_ESCALA[_caracTemp.escala] ?? _caracTemp.escala) : 0)
  const escalaMax = Object.entries(PC_POR_ESCALA).filter(([,pc]) => pc <= pcsLivres).map(([e]) => +e).pop() ?? 1
  document.getElementById("caracEscala").max = escalaMax
  const info = document.getElementById("escalaMaxInfo")
  if (info) info.innerText = `(máx. ${escalaMax} · ${_fonteTemp.pcsDisponiveis} PC disponível)`
}

export function confirmarCriarCaracteristica() {
  const gasto  = calcularGastoCarac()
  const limite = ORCAMENTO_POR_ESCALA[_caracTemp.escala]
  if (gasto > limite) { alert(`Orçamento ultrapassado! Máx: ${limite}, Gasto: ${gasto}`); return }

  const pcsNec   = PC_POR_ESCALA[_caracTemp.escala] ?? _caracTemp.escala
  const pcsLivres = _fonteTemp.pcsDisponiveis + (_caracEditIndex !== null ? pcsNec : 0)
  if (_caracEditIndex === null && pcsNec > _fonteTemp.pcsDisponiveis) {
    alert(`PCs insuficientes! Esta escala requer ${pcsNec} PC(s).`); return
  }

  const dados = {
    nome:      document.getElementById("caracNome").value || "Característica",
    descricao: document.getElementById("caracDescricao").value,
    escala:    _caracTemp.escala,
    escolhas:  _caracTemp.escolhas,
    custo:     gasto,
    custoPM:   calcularPMCarac()
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
  container.innerHTML = `<p style="opacity:0.6;font-size:13px;margin-bottom:8px">${config.descricao}</p>`

  const empilhavel = config.tipo === "empilhavel"
  const tabela = document.createElement("table")
  tabela.className = "tabela-sistema"
  tabela.innerHTML = `<thead><tr>
    <th>${config.label}</th><th>Orç.</th><th>PM</th>
    ${empilhavel ? "<th>Qtd</th>" : ""}
  </tr></thead>`

  const tbody = document.createElement("tbody")

  for (const item of config.dados) {
    const estado = { qtd: 0 }
    const tr     = document.createElement("tr")
    const tdNome = item.valor !== undefined ? `+${item.valor}` : item.nome
    const tdPm   = item.pm !== undefined ? (item.pm < 0 ? item.pm : `+${item.pm}`) : "-"

    tr.innerHTML = `
      <td>${tdNome}</td><td>${item.orcamento}</td><td>${tdPm}</td>
      ${empilhavel ? `<td><span class="qtd">0</span></td>` : ""}
    `

    if (empilhavel) {
      tr.style.cursor = "pointer"
      tr.addEventListener("click", e => {
        e.preventDefault()
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
        const idx = [..._caracTemp.escolhas[chave]].map(i => i.orcamento).lastIndexOf(item.orcamento)
        if (idx !== -1) _caracTemp.escolhas[chave].splice(idx, 1)
        tr.querySelector(".qtd").innerText = estado.qtd
        _flashRow(tr, "vermelho")
        atualizarPreviewCarac()
      })
    } else {
      tr.style.cursor = "pointer"
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
  if (empilhavel) {
    const dica = document.createElement("p")
    dica.style.cssText = "font-size:11px;opacity:0.4;margin-top:4px"
    dica.innerText = "Clique esquerdo: adicionar • Clique direito: remover"
    container.appendChild(dica)
  }
}

function _flashRow(tr, cor) {
  const bg = cor === "verde" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"
  tr.style.transition = "background 0s"
  tr.style.background = bg
  setTimeout(() => { tr.style.transition = "background 0.7s"; tr.style.background = "" }, 30)
}

// ── Render lista de características na modal de fonte ────
function _renderCaracteristicasFonteModal() {
  const container = document.getElementById("listaCaracteristicas")
  if (!container || !_fonteTemp) return
  container.innerHTML = ""

  if (!_fonteTemp.caracteristicas.length) {
    container.innerHTML = "<p style='opacity:0.4;font-size:13px;margin-top:8px'>Nenhuma característica ainda.</p>"
    return
  }

  _fonteTemp.caracteristicas.forEach((c, i) => {
    const isGratuita = c.custo === 0 && c.nome.includes("Gratuita")
    const div = document.createElement("div")
    div.className = "card-elemento"
    div.style.marginTop = "8px"
    div.innerHTML = `
      <div class="card-header">
        <strong>${c.nome}</strong>
        <span style="opacity:0.7;font-size:12px">Escala ${c.escala} · ${PC_POR_ESCALA[c.escala] ?? c.escala} PC · ${c.custoPM} PM</span>
      </div>
      ${c.descricao ? `<p style="font-size:13px;opacity:0.65;margin:4px 0">${c.descricao}</p>` : ""}
      <div class="card-actions" style="margin-top:8px">
        ${!isGratuita ? `<button class="btn-editar">✏️ Editar</button>` : ""}
        <button class="btn-remover">🗑️ Remover</button>
      </div>
    `
    if (!isGratuita) div.querySelector(".btn-editar").onclick = () => abrirCriarCaracteristica(i)
    div.querySelector(".btn-remover").onclick = () => {
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
  for (const lista of Object.values(_caracTemp.escolhas)) for (const item of lista) t += item.orcamento ?? 0
  return t
}

function calcularPMCarac() {
  let t = 0
  for (const lista of Object.values(_caracTemp.escolhas)) for (const item of lista) t += item.pm ?? 0
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
