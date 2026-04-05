// ============================================================
//  ui/uiElementos.js — Renderização dos cards de elementos
// ============================================================

import { LISTA_PERICIAS } from "../dados/banco.js"

export function renderElementos(ficha, { onEditar, onRemover, onEditarFonte, onExpandirFonte }) {
  const containers = {
    vantagem:    document.getElementById("listaVantagens"),
    desvantagem: document.getElementById("listaDesvantagens"),
    tecnica:     document.getElementById("listaTecnicas"),
    fonte:       document.getElementById("listaFontes")
  }
  Object.values(containers).forEach(c => { if (c) c.innerHTML = "" })

  for (const e of ficha.elementos) {
    const card = e.tipo === "fonte"
      ? criarCardFonte(e, onEditarFonte, onExpandirFonte, onRemover)
      : criarCardSimples(e, onEditar, onRemover)
    const alvo = containers[e.tipo]
    if (alvo) alvo.appendChild(card)
  }
}

// ── CARD SIMPLES ──────────────────────────────────────────
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
function criarCardFonte(fonte, onEditarFonte, onExpandirFonte, onRemover) {
  const card = document.createElement("div")
  card.className = "card-elemento card-fonte"

  const PC_POR_ESCALA = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6 }
  const pcsGastos = fonte.pcsGastos ?? 0
  const pcsTotal  = fonte.pcs       ?? 0

  const listaCaract = fonte.caracteristicas?.length
    ? fonte.caracteristicas.map(c => `
        <div class="carac-item">
          <span>⚡ ${c.nome} <em style="opacity:0.5;font-size:11px">E${c.escala}</em></span>
          <span style="font-size:12px">${c.custoPM} PM</span>
        </div>`).join("")
    : "<p style='opacity:0.4;font-size:13px'>Nenhuma característica.</p>"

  let passivosHTML = ""
  if (fonte.subtipo === "zoan") {
    const res = fonte.passivos?.zoan_resistencias
    if (res?.length) passivosHTML += `<div class="passivo-tag">🛡️ Resist.: ${res.join(", ")}</div>`
  }
  if (fonte.subtipo === "logia" && fonte.passivos?.elemento) {
    passivosHTML += `<div class="passivo-tag">🌊 ${fonte.passivos.elemento}</div>`
    passivosHTML += `<div class="passivo-tag">✨ Imune a danos mundanos</div>`
  }

  card.innerHTML = `
    <div class="card-header">
      <strong>${fonte.nome}</strong>
      <span class="badge-subtipo">${fonte.subtipo ?? "geral"}</span>
    </div>
    <p style="margin:3px 0;opacity:0.6;font-size:13px"><i>${fonte.tema || "Sem tema"}</i></p>
    <div class="pcs-mini">${pcsGastos} / ${pcsTotal} PCs usados</div>
    ${passivosHTML}
    <div class="lista-caracts" style="margin-top:8px">${listaCaract}</div>
    <div class="card-actions" style="margin-top:10px">
      <button class="btn-expandir">🔍 Expandir</button>
      <button class="btn-editar">✏️ Editar</button>
      <button class="btn-remover">🗑️ Remover</button>
    </div>
  `

  card.querySelector(".btn-expandir").onclick = () => onExpandirFonte(fonte.id)
  card.querySelector(".btn-editar").onclick   = () => onEditarFonte(fonte.id)
  card.querySelector(".btn-remover").onclick  = () => onRemover(fonte.id)
  return card
}

// ── RENDER PERÍCIAS ───────────────────────────────────────
export function renderPericias(ficha, onToggle, onToggleMaestria) {
  const container = document.getElementById("listaPericias")
  if (!container) return

  container.innerHTML = `
    <div class="maestria-info">
      Maestrias: <strong>${ficha.totalMaestrias}</strong> / <strong>${ficha.maestraLimite}</strong>
      ${ficha.maestraLimite === 0 ? '<span style="opacity:0.5;font-size:12px">(disponível a partir do nível 3)</span>' : ""}
    </div>
  `

  for (const pericia of LISTA_PERICIAS) {
    const temPericia   = !!ficha.pericias[pericia.id]
    const temMaestria  = !!ficha.maestrias[pericia.id]
    const podeMaestria = temPericia && (temMaestria || ficha.totalMaestrias < ficha.maestraLimite)

    const row = document.createElement("div")
    row.className = "pericia-row"

    row.innerHTML = `
      <label class="pericia-label ${temPericia ? "ativa" : ""}">
        <input type="checkbox" class="chk-pericia" ${temPericia ? "checked" : ""}>
        <span>${pericia.nome}</span>
        <span class="pericia-custo">1 PT</span>
      </label>
      ${temPericia ? `
        <button class="btn-maestria ${temMaestria ? "ativa" : ""}" 
                title="${temMaestria ? "Remover maestria (recupera 2 PT)" : "Aplicar maestria (custa 2 PT)"}"
                ${!podeMaestria && !temMaestria ? "disabled" : ""}>
          ⭐
        </button>` : '<div class="btn-maestria-placeholder"></div>'}
    `

    row.querySelector(".chk-pericia").onchange = () => onToggle(pericia.id)
    if (temPericia) {
      const btnM = row.querySelector(".btn-maestria")
      if (btnM) btnM.onclick = () => onToggleMaestria(pericia.id)
    }

    container.appendChild(row)
  }
}
