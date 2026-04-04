// ============================================================
//  ui/uiElementos.js — Renderização dos cards de elementos
// ============================================================

import { LISTA_PERICIAS } from "../dados/banco.js"

/**
 * Renderiza todos os elementos da ficha nos containers corretos.
 * @param {import('../modelos/Ficha.js').Ficha} ficha
 * @param {{ onEditar: Function, onRemover: Function }} callbacks
 */
export function renderElementos(ficha, { onEditar, onRemover }) {
  const containers = {
    vantagem:    document.getElementById("listaVantagens"),
    desvantagem: document.getElementById("listaDesvantagens"),
    tecnica:     document.getElementById("listaTecnicas"),
    fonte:       document.getElementById("listaFontes")
  }

  // Limpa todos
  Object.values(containers).forEach(c => { if (c) c.innerHTML = "" })

  for (const e of ficha.elementos) {
    const card = e.tipo === "fonte"
      ? criarCardFonte(e, onRemover)
      : criarCardSimples(e, onEditar, onRemover)

    const alvo = containers[e.tipo]
    if (alvo) alvo.appendChild(card)
  }
}

// ── CARD SIMPLES (vantagem / desvantagem / técnica) ──────

function criarCardSimples(e, onEditar, onRemover) {
  const card = document.createElement("div")
  card.className = "card-elemento"

  const custoLabel = e.custo < 0
    ? `<span style="color:#22c55e">${e.custo} PT</span>`
    : `<span>${e.custo} PT</span>`

  card.innerHTML = `
    <div class="card-header">
      <strong>${e.nome}</strong>
      ${custoLabel}
    </div>
    <div class="card-body">
      <p>${e.descricao}</p>
      <small class="card-notas">${e.notas}</small>
    </div>
    <div class="card-actions">
      <button class="btn-editar">✏️ Editar</button>
      <button class="btn-remover">🗑️ Remover</button>
    </div>
  `

  card.querySelector(".btn-editar").onclick  = () => onEditar(e.id)
  card.querySelector(".btn-remover").onclick = () => onRemover(e.id)

  return card
}

// ── CARD FONTE DE PODER ───────────────────────────────────

function criarCardFonte(fonte, onRemover) {
  const card = document.createElement("div")
  card.className = "card-elemento card-fonte"

  const listaCaract = fonte.caracteristicas.map(c => `
    <div class="carac-item">
      <span>⚡ ${c.nome} <em style="opacity:0.5;font-size:11px">Escala ${c.escala}</em></span>
      <span style="font-size:12px">${c.custoPM} PM</span>
    </div>
  `).join("") || "<p style='opacity:0.4;font-size:13px'>Nenhuma característica.</p>"

  // Passivos por subtipo
  let passivosHTML = ""
  if (fonte.subtipo === "zoan" && fonte.passivos?.zoan_resistencias?.length) {
    passivosHTML += `<div class="passivo-tag">🛡️ Resistente: ${fonte.passivos.zoan_resistencias.join(", ")}</div>`
  }
  if (fonte.subtipo === "logia" && fonte.passivos?.elemento) {
    passivosHTML += `
      <div class="passivo-tag">🌊 Elemento: ${fonte.passivos.elemento}</div>
      <div class="passivo-tag">✨ Imune a danos mundanos (exceto Haki)</div>
    `
  }

  const pcsGastos = fonte.pcsGastos ?? 0
  const pcsTotal  = fonte.pcs ?? 0

  card.innerHTML = `
    <div class="card-header">
      <strong>${fonte.nome}</strong>
      <span class="badge-subtipo">${fonte.subtipo ?? "geral"}</span>
    </div>
    <p style="margin:3px 0;opacity:0.6;font-size:13px"><i>${fonte.tema || "Sem tema"}</i></p>
    <div class="pcs-mini">${pcsGastos} / ${pcsTotal} PCs usados</div>
    ${passivosHTML}
    <div class="lista-caracts" style="margin-top:8px">
      ${listaCaract}
    </div>
    <div class="card-actions">
      <button class="btn-remover">🗑️ Remover</button>
    </div>
  `

  card.querySelector(".btn-remover").onclick = () => onRemover(fonte.id)
  return card
}

// ── RENDER PERÍCIAS ───────────────────────────────────────

/**
 * Renderiza dinamicamente as checkboxes de perícia a partir do banco.
 * @param {import('../modelos/Ficha.js').Ficha} ficha
 * @param {Function} onToggle — recebe o id da perícia
 */
export function renderPericias(ficha, onToggle) {
  const container = document.getElementById("listaPericias")
  if (!container) return

  container.innerHTML = ""

  for (const pericia of LISTA_PERICIAS) {
    const label = document.createElement("label")
    label.innerHTML = `
      <input type="checkbox" ${ficha.pericias[pericia.id] ? "checked" : ""}>
      ${pericia.nome} <span style="opacity:0.6">(1 PT)</span>
    `
    label.querySelector("input").onchange = () => onToggle(pericia.id)
    container.appendChild(label)
  }
}
