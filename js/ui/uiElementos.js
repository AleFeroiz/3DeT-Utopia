// ============================================================
//  ui/uiElementos.js — Renderização dos cards de elementos
// ============================================================

import { LISTA_PERICIAS } from "../dados/banco.js?v=600000"

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

export function renderElementos(ficha, { onEditar, onRemover, onEditarFonte, onExpandirFonte }, somenteLeitura = false) {
  const containers = {
    vantagem:    document.getElementById("listaVantagens"),
    desvantagem: document.getElementById("listaDesvantagens"),
    tecnica:     document.getElementById("listaTecnicas"),
    fonte:       document.getElementById("listaFontes")
  }
  Object.values(containers).forEach(c => { if (c) c.innerHTML = "" })

  for (const e of ficha.elementos) {
    const card = e.tipo === "fonte"
      ? criarCardFonte(e, onEditarFonte, onExpandirFonte, onRemover, somenteLeitura)
      : criarCardSimples(e, onEditar, onRemover, somenteLeitura)
    const alvo = containers[e.tipo]
    if (alvo) alvo.appendChild(card)
  }
}

// ── PARSER DE DESCRIÇÃO (formato livro) ─────────────────────────────────────
export function _parsearDescricao(descricao) {
  if (!descricao) return ''

  // ── Técnica especial: começa com [Requisito: X] ───────────
  const mReq = descricao.trim().match(/^\[([^\]]+)\]\s*(.+)/s)
  if (mReq) {
    const requisito = mReq[1].trim()
    const efeito    = mReq[2].trim()
    return `<div class="tecnica-requisito">${_esc(requisito)}</div>` +
           `<div class="tecnica-efeito">${_fmt(efeito)}</div>`
  }

  // Headers de seção — match exato (ou prefixo) da linha
  const SECAO_MAP = [
    ['tipo-efeito', /^(Efeitos? e Custos?|Efeitos? e Punição|Efeito e Custo|Efeito e Condição|Efeito e Punição|Efeito e Descoberta|Efeitos?|Custos?)$/i],
    ['tipo-funcao', /^(Funções? e Custos?|Gatilhos?,?\s*Efeitos?|Insanidades?\s+Disponíveis?).*$/i],
    ['tipo-limite', /^(Níveis?\s+de\s+Frequência.*|Níveis?\s+da\s+Maldição|Efeitos?\s+por\s+Nível)$/i],
    ['tipo-nota',   /^(Regra\s+Geral|Definição\s+e\s+Efeito)$/i],
  ]

  // Sub-labels inline que geram bloco colorido próprio
  const SUBLABEL_MAP = [
    ['tipo-limite', /^Limite\s*:/i,              'Limite'],
    ['tipo-reset',  /^Condição\s+de\s+Reset\s*:/i,'Condição de Reset'],
    ['tipo-nota',   /^Atenção\s*:/i,             'Atenção'],
  ]

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }
  function _fmt(s) {
    return _esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
  }

  function renderItem(nome, texto) {
    if (nome) return `<div class="card-secao-item"><span><span class="card-item-nome">${_fmt(nome)}</span>&nbsp;${_fmt(texto)}</span></div>`
    return `<div class="card-secao-item"><span>${_fmt(texto)}</span></div>`
  }

  function renderSubLabel(tipo, label, texto) {
    return `<div class="card-sublabel ${tipo}"><span class="card-sublabel-nome">${_esc(label)}:</span> <span>${_fmt(texto)}</span></div>`
  }

  // Estado
  const linhas = descricao.split('\n').map(l => l.trim())
  let intro = []
  let secaoTipo = null
  let secaoLabel = ''
  let corpo = []          // array de strings HTML já renderizadas
  let textoAcum = []      // texto corrido antes de itens, a ser fechado antes de bullets
  let modoIntro = true
  let resultHTML = ''

  function flushTexto() {
    if (!textoAcum.length) return
    corpo.push(`<div class="card-secao-body">${textoAcum.map(_fmt).join('<br>')}</div>`)
    textoAcum = []
  }

  function fecharSecao() {
    flushTexto()
    if (!secaoTipo && !corpo.length) return
    const bodyHTML = corpo.join('')
    if (!bodyHTML) { secaoTipo = null; secaoLabel = ''; corpo = []; return }
    if (secaoTipo) {
      resultHTML += `<div class="card-secao"><div class="card-secao-header ${secaoTipo}">${_esc(secaoLabel)}</div>${bodyHTML}</div>`
    } else {
      resultHTML += `<div class="card-secao card-secao-sem-header">${bodyHTML}</div>`
    }
    secaoTipo = null; secaoLabel = ''; corpo = []
  }

  for (const linha of linhas) {
    if (!linha) continue

    // ── Header de seção? ──────────────────────────────────────────────────
    let ehHeader = false
    for (const [tipo, re] of SECAO_MAP) {
      if (re.test(linha)) {
        fecharSecao()
        modoIntro = false
        secaoTipo = tipo
        secaoLabel = linha
        ehHeader = true
        break
      }
    }
    if (ehHeader) continue

    // ── Modo intro ─────────────────────────────────────────────────────────
    if (modoIntro) {
      if (/^\(/.test(linha) && /\)\.?$/.test(linha)) {
        intro.push(`<em class="card-intro-nota">${_fmt(linha)}</em>`)
      } else {
        intro.push(_fmt(linha))
      }
      continue
    }

    // ── Dentro de seção ────────────────────────────────────────────────────

    // Sub-label: "Limite:", "Condição de Reset:", "Atenção:"
    let ehSub = false
    for (const [tipo, re, nome] of SUBLABEL_MAP) {
      if (re.test(linha)) {
        flushTexto()
        const conteudo = linha.replace(re, '').replace(/^[\s:]+/, '').trim()
        corpo.push(renderSubLabel(tipo, nome, conteudo))
        ehSub = true
        break
      }
    }
    if (ehSub) continue

    // Nota entre parênteses dentro de seção
    if (/^\(/.test(linha) && /\)\.?$/.test(linha)) {
      flushTexto()
      corpo.push(`<div class="card-nota-inline">${_fmt(linha)}</div>`)
      continue
    }

    // Item "–N PT: texto" ou "–N PT — Nome: texto"
    const mCustoNeg = linha.match(/^(–\s*\d+\s*PT)\s*[:\s—–]\s*(.+)/i)
    if (mCustoNeg) {
      flushTexto()
      corpo.push(`<div class="card-secao-item card-item-custo-var"><span class="card-item-badge-custo">${_esc(mCustoNeg[1])}</span><span>${_fmt(mCustoNeg[2].trim())}</span></div>`)
      continue
    }

    // Item "+N PT — Nome:" ou "N PT — Nome:" (Expansão)
    const mCustoPos = linha.match(/^(\+?\d+\s*PT\s*[—–]\s*)(.+)/)
    if (mCustoPos) {
      flushTexto()
      corpo.push(`<div class="card-secao-item card-item-custo-var"><span class="card-item-badge-custo positivo">${_fmt(mCustoPos[1].trim())}</span><span>${_fmt(mCustoPos[2].trim())}</span></div>`)
      continue
    }

    // Item "1º/2º/..." texto
    if (/^\d+[ºª°]/.test(linha)) {
      flushTexto()
      corpo.push(renderItem(null, linha))
      continue
    }

    // Item "...e assim por diante."
    if (/^\.\.\./.test(linha)) {
      flushTexto()
      corpo.push(`<div class="card-secao-item card-item-continuacao"><span>${_fmt(linha)}</span></div>`)
      continue
    }

    // Item "Nome (XPM): texto" ou "Nome: texto" com nome ≤ 6 palavras
    // Evitar false-positives com linhas longas
    const mItem = linha.match(/^([^:\n]{1,60}?)\s*:\s*(.+)/s)
    if (mItem) {
      const nome = mItem[1].trim()
      const texto = mItem[2].trim()
      const palavrasNome = nome.split(/\s+/).length
      // É um item se: nome curto E texto não está vazio E nome não começa com pronome de frase longa
      if (palavrasNome <= 7 && texto.length > 0 && !/^(Você|Ao|Quando|Se |O |A |Em |No |Na |Que |Qualquer|Sempre|Apenas|Para |Por |Toda|Todo|Com |Sem |Tente|Pode |Faça|Este|Essa)/.test(nome)) {
        flushTexto()
        corpo.push(renderItem(nome, texto))
        continue
      }
    }

    // Tudo mais → texto corrido
    textoAcum.push(linha)
  }

  fecharSecao()

  let result = ''
  if (intro.length) result += `<div class="card-intro">${intro.join(' ')}</div>`
  result += resultHTML
  return result
}

// ── CARD SIMPLES ──────────────────────────────────────────
function criarCardSimples(e, onEditar, onRemover, somenteLeitura = false) {
  const card = document.createElement("div")
  card.className = "card-elemento"

  const negativo = e.custo < 0
  const custoLabel = `<span class="card-custo-badge ${negativo ? 'negativo' : ''}">${e.custo > 0 ? '+' : ''}${e.custo} PT</span>`

  const conteudoDesc = _parsearDescricao(e.descricao)
  const notasHTML = e.notas
    ? `<small class="card-notas">${e.notas}</small>`
    : ''

  card.innerHTML = `
    <div class="card-header">
      <strong>${e.nome}</strong>
      ${custoLabel}
    </div>
    ${conteudoDesc}
    ${notasHTML}
    ${somenteLeitura ? "" : `
    <div class="card-actions">
      <button class="btn-editar">✏️ Editar</button>
      <button class="btn-remover">🗑️ Remover</button>
    </div>`}
  `
  if (!somenteLeitura) {
    card.querySelector(".btn-editar").onclick  = () => onEditar(e.id)
    card.querySelector(".btn-remover").onclick = () => onRemover(e.id)
  }
  return card
}

// ── CARD FONTE DE PODER ───────────────────────────────────
function criarCardFonte(fonte, onEditarFonte, onExpandirFonte, onRemover, somenteLeitura = false) {
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
      ${somenteLeitura ? "" : `
      <button class="btn-editar">✏️ Editar</button>
      <button class="btn-remover">🗑️ Remover</button>`}
    </div>
  `

  card.querySelector(".btn-expandir").onclick = () => onExpandirFonte(fonte.id)
  if (!somenteLeitura) {
    card.querySelector(".btn-editar").onclick  = () => onEditarFonte(fonte.id)
    card.querySelector(".btn-remover").onclick = () => onRemover(fonte.id)
  }
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
export function renderCaracteristicasIsoladas(ficha, { onEditar, onRemover }, somenteLeitura = false) {
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
      ${somenteLeitura ? "" : `
      <div class="card-actions" style="margin-top:8px">
        <button class="btn-editar">✏️ Editar</button>
        <button class="btn-remover">🗑️ Remover</button>
      </div>`}
    `
    if (!somenteLeitura) {
      card.querySelector(".btn-editar").onclick  = () => onEditar(i)
      card.querySelector(".btn-remover").onclick = () => onRemover(i)
    }
    container.appendChild(card)
  })
}