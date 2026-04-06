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
      <label class="pericia-label ${temPericia ? "ativa" : ""} ${temMaestria ? "maestria" : ""}">
        <input type="checkbox" class="chk-pericia" ${temPericia ? "checked" : ""}>
        <span>${pericia.nome}</span>
        ${temMaestria ? '<span class="pericia-maestria-tag">★ Maestria</span>' : '<span class="pericia-custo">1 PT</span>'}
      </label>
      ${temPericia ? `
        <button class="btn-maestria ${temMaestria ? "ativa" : ""}" 
                title="${temMaestria ? "Maestria já aplicada (permanente)" : "Aplicar maestria (custa 2 PT)"}"
                ${(temMaestria || (!podeMaestria && !temMaestria)) ? "disabled" : ""}>
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

// ── RENDER CARACTERÍSTICAS ISOLADAS ──────────────────────
export function renderCaracteristicasIsoladas(ficha, { onEditar, onRemover }) {
  const container = document.getElementById("listaCaracteristicasIsoladas")
  if (!container) return
  container.innerHTML = ""

  const isoladas = ficha.caracteristicasIsoladas ?? []
  if (!isoladas.length) return

  const titulo = document.createElement("h3")
  titulo.textContent = "⚡ Características Isoladas"
  titulo.style.cssText = "font-size:14px;opacity:0.7;margin:16px 0 8px"
  container.appendChild(titulo)

  const LABELS = {
    potencia: 'Potência', pressao: 'Pressão', execucao: 'Execução',
    alcance: 'Alcance', duracao: 'Duração', area: 'Área',
    alvos: 'Alvos Adicionais', condicoes: 'Condições', descontos: 'Descontos'
  }

  isoladas.forEach((c, i) => {
    const card = document.createElement("div")
    card.className = "card-elemento"
    card.style.borderColor = "#7c3aed"

    // Resumo das escolhas das tabelas
    const escolhas = c.escolhas ?? {}
    const resumoLinhas = []
    for (const [chave, lista] of Object.entries(escolhas)) {
      if (!lista?.length) continue
      const contagem = {}
      for (const item of lista) {
        const k = item.nome ?? `+${item.valor}`
        contagem[k] = (contagem[k] ?? 0) + 1
      }
      const valStr = Object.entries(contagem).map(([n, q]) => q > 1 ? `${n} ×${q}` : n).join(", ")
      resumoLinhas.push(`<div class="carac-resumo-row"><span class="carac-resumo-label">${LABELS[chave] ?? chave}:</span><span>${valStr}</span></div>`)
    }
    const resumoHTML = resumoLinhas.length
      ? `<div class="carac-resumo">${resumoLinhas.join("")}</div>`
      : ""

    const custoPTHTML = c.custoPT
      ? `<span style="background:#1e3a5f;padding:1px 7px;border-radius:4px;font-size:11px;color:#93c5fd">${c.custoPT} PT</span>`
      : ""

    card.innerHTML = `
      <div class="card-header">
        <strong>⚡ ${c.nome}</strong>
        <div style="display:flex;gap:6px;font-size:12px;align-items:center;flex-wrap:wrap">
          ${custoPTHTML}
          <span style="opacity:0.6">Escala ${c.escala}</span>
          <span style="opacity:0.6">${c.custoPM} PM</span>
        </div>
      </div>
      ${c.origem ? `<p style="font-size:12px;opacity:0.55;margin:3px 0;font-style:italic">📍 ${c.origem}</p>` : ""}
      ${resumoHTML}
      ${c.descricao ? `<p class="carac-descricao">${c.descricao}</p>` : ""}
      <div class="card-actions" style="margin-top:8px">
        <button class="btn-editar">✏️ Editar</button>
        <button class="btn-remover">🗑️ Remover</button>
      </div>
    `
    card.querySelector(".btn-editar").onclick  = () => onEditar(i)
    card.querySelector(".btn-remover").onclick = () => onRemover(i)
    container.appendChild(card)
  })
}
