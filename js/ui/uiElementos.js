// ============================================================
//  ui/uiElementos.js — Renderização dos cards de elementos
// ============================================================

import { LISTA_PERICIAS } from "../dados/banco.js"

// ── Helper: HTML das variantes para cards ──────────────────
function _htmlVariantesCardIso(c) {
  const renderV = (v, tipo) => {
    if (!v) return ''
    const amp   = tipo === 'amplificada'
    const icone = amp ? '⬆️' : '⬇️'
    const label = amp ? 'Amplificada' : 'Reduzida'
    const cor   = amp ? '#f59e0b' : '#60a5fa'
    // v tem { custoPM, chave, label, valor, destaque } — formato direto
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
          <span>⚡ ${c.nome} <em style="opacity:0.5;font-size:11px">E${c.escala}</em>${c.gratuita ? ' <span style="font-size:10px;background:#14532d;color:#86efac;padding:0 4px;border-radius:3px">GRÁTIS</span>' : ''}</span>
          <span style="font-size:12px">${c.custoPM} PM</span>
        </div>`).join("")
    : "<p style='opacity:0.4;font-size:13px'>Nenhuma característica.</p>"

  let passivosHTML = ""
  if (fonte.subtipo === "zoan") {
    const resH = fonte.passivos?.zoan_res_hibrida
    const resC = fonte.passivos?.zoan_res_completa
    passivosHTML += `<div class="passivo-tag">🐺 Híbrida (3 PM)${resH?.length ? ` · 🛡️ ${resH.join(", ")}` : ""}</div>`
    passivosHTML += `<div class="passivo-tag">🦖 Completa (6 PM)${resC?.length ? ` · 🛡️ ${resC.join(", ")}` : ""}</div>`
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
export function renderPericias(ficha, onToggle, onToggleMaestria, somenteLeitura = false) {
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
    const temMaestria = !!ficha.maestrias[pericia.id]

    const row = document.createElement("div")
    row.className = "pericia-row"

    row.innerHTML = `
      <label class="pericia-label ${temPericia ? "ativa" : ""} ${temMaestria ? "maestria" : ""}">
        <input type="checkbox" class="chk-pericia" ${temPericia ? "checked" : ""}>
        <span class="pericia-nome-btn" title="Ver descrição">${pericia.emoji ?? ""} ${pericia.nome}</span>
        ${temMaestria ? '<span class="pericia-maestria-tag">★ Maestria</span>' : '<span class="pericia-custo">1 PT</span>'}
      </label>
      ${temPericia ? `
        <button class="btn-maestria ${temMaestria ? "ativa" : ""}"
                title="${temMaestria ? "Clique para remover maestria" : "Aplicar maestria (2 PT)"}">
          ⭐
        </button>` : '<div class="btn-maestria-placeholder"></div>'}
    `

    // Tooltip de descrição ao clicar no nome
    if (pericia.desc) {
      const nomeBtn = row.querySelector(".pericia-nome-btn")
      nomeBtn.style.cursor = "help"
      nomeBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        // Remove tooltip anterior se existir
        const existente = document.getElementById("pericia-tooltip")
        if (existente) {
          existente.remove()
          if (existente.dataset.periciaId === pericia.id) return  // toggle: fecha se clicou no mesmo
        }
        const tip = document.createElement("div")
        tip.id = "pericia-tooltip"
        tip.dataset.periciaId = pericia.id
        tip.className = "pericia-tooltip"
        tip.innerHTML = `
          <div class="pericia-tooltip-header">
            <strong>${pericia.emoji ?? ""} ${pericia.nome}</strong>
            <button class="pericia-tooltip-fechar" onclick="document.getElementById('pericia-tooltip')?.remove()">✕</button>
          </div>
          <p>${pericia.desc}</p>
        `
        row.appendChild(tip)
      }
    }

    row.querySelector(".chk-pericia").onchange = () => { if (!somenteLeitura) onToggle(pericia.id) }
    if (somenteLeitura) {
      row.querySelector(".chk-pericia").disabled = true
    }
    if (temPericia) {
      const btnM = row.querySelector(".btn-maestria")
      if (btnM) {
        if (somenteLeitura) btnM.disabled = true
        else btnM.onclick = () => onToggleMaestria(pericia.id)
      }
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
    const BASES_PADRAO = {
      execucao: 'Padrão', alcance: 'Pessoal', duracao: 'Instantânea',
      area: '1 alvo', alvos: '1 alvo'
    }
    const todasChaves = new Set([...Object.keys(escolhas), ...Object.keys(BASES_PADRAO)])
    for (const chave of todasChaves) {
      const lista = escolhas[chave] ?? []
      const itensExibir = lista.filter(i => !i.gratuita)
      if (itensExibir.length === 0) {
        if (BASES_PADRAO[chave]) {
          resumoLinhas.push(`<div class="carac-resumo-row"><span class="carac-resumo-label">${LABELS[chave] ?? chave}:</span><span style="opacity:0.45;font-style:italic">${BASES_PADRAO[chave]} (padrão)</span></div>`)
        }
        continue
      }
      const contagem = {}
      let total = 0
      for (const item of itensExibir) {
        const k = item.nome ?? `+${item.valor}`
        contagem[k] = (contagem[k] ?? 0) + 1
        if (item.valor !== undefined) total += item.valor * 1
      }
      const valStr = Object.entries(contagem).map(([n, q]) => q > 1 ? `${n} ×${q}` : n).join(", ")
      const totalStr = total > 0 ? ` <span style="opacity:0.45">= ${total}</span>` : ""
      resumoLinhas.push(`<div class="carac-resumo-row"><span class="carac-resumo-label">${LABELS[chave] ?? chave}:</span><span>${valStr}${totalStr}</span></div>`)
    }
    const resumoHTML = resumoLinhas.length
      ? `<div class="carac-resumo">${resumoLinhas.join("")}</div>`
      : ""

    const custoPTHTML = c.custoPT
      ? `<span style="background:#1e3a5f;padding:1px 7px;border-radius:4px;font-size:11px;color:#93c5fd">${c.custoPT} PT</span>`
      : ""

    // Variantes amplificada / reduzida
    const variantesHTML = _htmlVariantesCardIso(c)

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
      ${variantesHTML}
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