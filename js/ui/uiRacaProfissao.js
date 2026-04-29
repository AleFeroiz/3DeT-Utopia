// ============================================================
//  ui/uiRacaProfissao.js — Raça / Profissão (com Mestiço e Modificado)
// ============================================================

import { RACAS      } from "../dados/racas.js"
import { PROFISSOES } from "../dados/profissoes.js"

let _onSalvar = null
export function registrarCallbackRacaProf(fn) { _onSalvar = fn }

// ── Formata texto de desc de raça: "• Nome: texto" → HTML estruturado ──
export function _formatarDescRaca(desc) {
  if (!desc) return ''
  // Escapa HTML básico
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')

  const linhas = desc.split('\n')
  let html = ''
  let intro = []
  let itens = []

  function flushIntro() {
    if (!intro.length) return
    html += `<span class="raca-desc-intro">${intro.map(fmt).join(' ')}</span>`
    intro = []
  }
  function flushItens() {
    if (!itens.length) return
    html += `<ul class="raca-desc-lista">${itens.join('')}</ul>`
    itens = []
  }

  for (const l of linhas) {
    const linha = l.trim()
    if (!linha) continue

    if (linha.startsWith('•')) {
      flushIntro()
      const conteudo = linha.slice(1).trim()
      // "Nome: texto" → nome em bold
      const m = conteudo.match(/^([^:]{1,50}?)\s*:\s*(.+)/s)
      if (m && m[1].split(' ').length <= 6) {
        itens.push(`<li><strong>${fmt(m[1])}</strong>: ${fmt(m[2].trim())}</li>`)
      } else {
        itens.push(`<li>${fmt(conteudo)}</li>`)
      }
    } else {
      flushItens()
      intro.push(linha)
    }
  }
  flushIntro()
  flushItens()
  return html
}

// ─── Helpers ──────────────────────────────────────────────
const racaPorId = (id) => RACAS.find(r => r.id === id)

// ─────────────────────────────────────────────────────────
//  SIDEBAR
// ─────────────────────────────────────────────────────────
export function renderSidebarRacaProf(ficha) {
  const racaBtn = document.getElementById("btnRaca")
  const profBtn = document.getElementById("btnProfissao")
  if (!racaBtn || !profBtn) return
  const raca = racaPorId(ficha.racaId)
  const prof = PROFISSOES.find(p => p.id === ficha.profissaoId)
  racaBtn.textContent = raca ? `${raca.emoji} ${raca.nome}` : "🧬 Escolher Raça"
  profBtn.textContent = prof ? `${prof.emoji} ${prof.nome}` : "⚒️ Escolher Profissão"
}

// ─────────────────────────────────────────────────────────
//  ABA RAÇA — dispatch por tipo
// ─────────────────────────────────────────────────────────
export function renderAbaRaca(ficha) {
  const container = document.getElementById("conteudoRaca")
  if (!container) return
  if (!ficha.racaId) {
    container.innerHTML = `<div class="aba-vazia"><p>Nenhuma raça selecionada.</p>
      <button onclick="abrirModalRaca()" class="btn-acao">🧬 Escolher Raça</button></div>`
    return
  }
  if (ficha.racaId === "mestico")   { _renderAbaMestico(ficha, container);   return }
  if (ficha.racaId === "modificado"){ _renderAbaModificado(ficha, container); return }
  _renderAbaRacaNormal(ficha, container)
}

// ── Raça Normal ────────────────────────────────────────────
function _renderAbaRacaNormal(ficha, container) {
  const raca  = racaPorId(ficha.racaId)
  if (!raca) return
  const nivel = ficha.nivel
  const desbloq = raca.evolucoes.filter(e => e.nivel === null || e.nivel <= nivel)
  const bloq    = raca.evolucoes.filter(e => e.nivel !== null && e.nivel > nivel)
  container.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">${raca.emoji}</span>
      <div><h2>${raca.nome}</h2>${raca.custo > 0 ? `<span class="badge-custo">${raca.custo} PT</span>` : ""}</div>
      <button onclick="abrirModalRaca()" class="btn-trocar">Trocar</button>
    </div>
    <div class="secao-info"><h3>✨ Extras</h3>
      ${raca.extras.map(e => `<div class="tag-extra">${e}</div>`).join("")}</div>
    <div class="secao-info"><h3>👍 Vantagens</h3>
      ${raca.vantagens.map(v => `<div class="card-info"><strong>${v.nome}</strong><div class="raca-desc">${_formatarDescRaca(v.desc)}</div></div>`).join("")}</div>
    <div class="secao-info"><h3>👎 Desvantagens</h3>
      ${raca.desvantagens.map(d => `<div class="card-info desvantagem"><strong>${d.nome}</strong><div class="raca-desc">${_formatarDescRaca(d.desc)}</div></div>`).join("")}</div>
    <div class="secao-info"><h3>⬆️ Evoluções</h3>
      ${desbloq.map(e => `<div class="card-info desbloqueado">${e.nivel ? `<span class="badge-nivel">Nível ${e.nivel}</span>` : ""}<strong>${e.nome}</strong><div class="raca-desc">${_formatarDescRaca(e.desc)}</div></div>`).join("")}
      ${bloq.map(e => `<div class="card-info bloqueado"><span class="badge-nivel bloqueado">Nível ${e.nivel} 🔒</span><strong>${e.nome}</strong><div class="raca-desc">${_formatarDescRaca(e.desc)}</div></div>`).join("")}
    </div>`
}

// ── Mestiço — exibe dados salvos ───────────────────────────
function _renderAbaMestico(ficha, container) {
  const d = ficha.racaDados
  if (!d?.racas?.length) {
    container.innerHTML = `<div class="aba-vazia">
      <p>🧬 Mestiço — configure as raças base.</p>
      <button onclick="abrirModalMestico()" class="btn-acao">⚙️ Configurar Mestiço</button></div>`
    return
  }
  const r1    = racaPorId(d.racas[0])
  const r2    = racaPorId(d.racas[1])
  const nivel = ficha.nivel

  // Organiza dados por raça para exibição lado a lado
  const extraR1  = d.extras?.find(e => e.racaId === d.racas[0])
  const extraR2  = d.extras?.find(e => e.racaId === d.racas[1])
  const vantR1   = d.vantagens?.find(v => v.racaId === d.racas[0])
  const vantR2   = d.vantagens?.find(v => v.racaId === d.racas[1])
  const desvR1   = d.desvantagens?.find(v => v.racaId === d.racas[0])
  const desvR2   = d.desvantagens?.find(v => v.racaId === d.racas[1])

  const renderEvolCard = (ev) => {
    const desbloq = ev.nivel === null || ev.nivel <= nivel
    const rEvol   = racaPorId(ev.racaId)
    return `<div class="card-info ${desbloq ? "desbloqueado" : "bloqueado"}">
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:3px">
        ${ev.nivel ? `<span class="badge-nivel ${desbloq ? "" : "bloqueado"}">Nível ${ev.nivel}${desbloq ? "" : " 🔒"}</span>` : ""}
        <span class="badge-raca-mini">${rEvol?.emoji ?? "?"} ${rEvol?.nome ?? ev.racaId}</span>
        <strong>${ev.nome}</strong>
      </div>
      <div class="raca-desc">${_formatarDescRaca(ev.desc)}</div></div>`
  }

  const renderPar = (itemR1, itemR2, tipo) => {
    const cor1 = '#1e3a5f'; const cor2 = '#1a2e1a'
    const renderItem = (item, raca, cor) => item
      ? `<div class="card-info mestico-par-card" style="border-color:${cor}55">
          <div class="mestico-par-raca">${raca?.emoji ?? ""} ${raca?.nome ?? ""}</div>
          <strong>${item.nome ?? item.texto ?? item}</strong>
          ${item.desc ? `<p>${item.desc}</p>` : ""}
        </div>`
      : `<div class="card-info mestico-par-card mestico-par-vazio" style="border-color:${cor}33"><span style="opacity:0.3">—</span></div>`
    return `<div class="mestico-par-grid">
      ${renderItem(itemR1, r1, cor1)}
      ${renderItem(itemR2, r2, cor2)}
    </div>`
  }

  container.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">🧬</span>
      <div><h2>Mestiço</h2><span class="badge-custo">1 PT</span></div>
      <button onclick="abrirModalMestico()" class="btn-trocar">Editar</button>
    </div>

    <div class="mestico-racas-banner">
      <div class="mestico-banner-lado" style="color:#93c5fd">${r1?.emoji ?? "?"} ${r1?.nome ?? d.racas[0]}</div>
      <span class="mestico-x">✚</span>
      <div class="mestico-banner-lado" style="color:#86efac">${r2?.emoji ?? "?"} ${r2?.nome ?? d.racas[1]}</div>
    </div>

    <div class="secao-info">
      <h3>✨ Extras</h3>
      ${renderPar(extraR1 ? { texto: extraR1.texto } : null, extraR2 ? { texto: extraR2.texto } : null)}
    </div>

    <div class="secao-info">
      <h3>👍 Vantagens</h3>
      ${renderPar(vantR1, vantR2)}
    </div>

    <div class="secao-info">
      <h3>👎 Desvantagens</h3>
      ${renderPar(desvR1, desvR2, true)}
    </div>

    <div class="secao-info">
      <h3>⬆️ Evoluções <span style="font-size:12px;opacity:0.5;font-weight:400">(${(d.evolucoes ?? []).length}/3)</span></h3>
      ${(d.evolucoes ?? []).length ? (d.evolucoes ?? []).map(renderEvolCard).join("") : "<p style='opacity:0.4'>Nenhuma.</p>"}
    </div>`
}

// ── Modificado — exibe dados salvos ────────────────────────
function _renderAbaModificado(ficha, container) {
  const d = ficha.racaDados
  if (!d?.racaBase) {
    container.innerHTML = `<div class="aba-vazia">
      <p>⚙️ Modificado — configure a raça base e modificações.</p>
      <button onclick="abrirModalModificado()" class="btn-acao">⚙️ Configurar Modificado</button></div>`
    return
  }
  const rBase = racaPorId(d.racaBase)
  const nivel  = ficha.nivel

  const renderEvolCard = (ev) => {
    const desbloq = !ev.nivel || ev.nivel <= nivel
    return `<div class="card-info ${desbloq ? "desbloqueado" : "bloqueado"}">
      ${ev.nivel ? `<span class="badge-nivel ${desbloq ? "" : "bloqueado"}">Nível ${ev.nivel}${desbloq ? "" : " 🔒"}</span>` : ""}
      <strong>${ev.nome}</strong><div class="raca-desc">${_formatarDescRaca(ev.desc)}</div></div>`
  }

  container.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">⚙️</span>
      <div><h2>Modificado</h2><span class="badge-custo">1 PT</span></div>
      <button onclick="abrirModalModificado()" class="btn-trocar">Editar</button>
    </div>
    <p class="modificado-base-label">Base: ${rBase?.emoji ?? "?"} <strong>${rBase?.nome ?? d.racaBase}</strong></p>
    <div class="secao-info"><h3>✨ Extras</h3>
      ${d.extraBase ? `<div class="tag-extra">${rBase?.emoji ?? ""} ${d.extraBase}</div>` : ""}
      ${d.extraManual ? `<div class="tag-extra mod-manual">⚙️ ${d.extraManual}</div>` : ""}
    </div>
    <div class="secao-info"><h3>👍 Vantagens</h3>
      ${d.vantagemBase?.nome ? `<div class="card-info"><span class="badge-raca-mini">${rBase?.emoji ?? ""} Base</span><strong> ${d.vantagemBase.nome}</strong><div class="raca-desc">${_formatarDescRaca(d.vantagemBase.desc)}</div></div>` : ""}
      ${d.vantagemManual?.nome ? `<div class="card-info mod-manual"><span class="badge-raca-mini">⚙️ Manual</span><strong> ${d.vantagemManual.nome}</strong><div class="raca-desc">${_formatarDescRaca(d.vantagemManual.desc)}</div></div>` : ""}
    </div>
    <div class="secao-info"><h3>👎 Desvantagens</h3>
      ${d.desvantagemBase?.nome ? `<div class="card-info desvantagem"><span class="badge-raca-mini">${rBase?.emoji ?? ""} Base</span><strong> ${d.desvantagemBase.nome}</strong><div class="raca-desc">${_formatarDescRaca(d.desvantagemBase.desc)}</div></div>` : ""}
      ${d.desvantagemManual?.nome ? `<div class="card-info desvantagem mod-manual"><span class="badge-raca-mini">⚙️ Manual</span><strong> ${d.desvantagemManual.nome}</strong><div class="raca-desc">${_formatarDescRaca(d.desvantagemManual.desc)}</div></div>` : ""}
    </div>
    <div class="secao-info"><h3>⬆️ Evoluções</h3>
      ${(d.evolucoes ?? []).length ? (d.evolucoes ?? []).map(renderEvolCard).join("") : "<p style='opacity:0.4'>Nenhuma definida.</p>"}
    </div>`
}

// ─────────────────────────────────────────────────────────
//  MODAL ESCOLHER RAÇA
// ─────────────────────────────────────────────────────────
export function abrirModalRaca(ficha) {
  const modal = document.getElementById("modalEscolhaRaca")
  const lista = document.getElementById("listaRacas")
  if (!modal || !lista) return
  lista.innerHTML = ""
  RACAS.forEach(raca => {
    const div = document.createElement("div")
    div.className = "item-lista" + (ficha.racaId === raca.id ? " selecionado" : "")
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${raca.emoji} ${raca.nome}</strong>
        ${raca.custo > 0 ? `<span class="badge-custo">${raca.custo} PT</span>` : '<span style="opacity:0.5;font-size:12px">Grátis</span>'}
      </div>
      <p style="font-size:12px;opacity:0.6;margin-top:4px">${Array.isArray(raca.extras) ? raca.extras.join(" • ") : raca.extras}</p>`
    div.onclick = () => {
      document.getElementById("modalEscolhaRaca").classList.add("hidden")
      if (raca.id === "mestico")    { window.abrirModalMestico?.();    return }
      if (raca.id === "modificado") { window.abrirModalModificado?.(); return }
      _onSalvar?.({ racaId: raca.id, racaDados: null })
    }
    lista.appendChild(div)
  })
  modal.classList.remove("hidden")
}

// ─────────────────────────────────────────────────────────
//  MODAL PROFISSÃO (inalterado)
// ─────────────────────────────────────────────────────────
export function abrirModalProfissao(ficha) {
  const modal = document.getElementById("modalEscolhaProfissao")
  const lista = document.getElementById("listaProfissoes")
  if (!modal || !lista) return
  lista.innerHTML = ""
  PROFISSOES.forEach(prof => {
    const div = document.createElement("div")
    div.className = "item-lista" + (ficha.profissaoId === prof.id ? " selecionado" : "")
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${prof.emoji} ${prof.nome}</strong>
        <span style="opacity:0.5;font-size:12px">Req: ${prof.requisito}</span>
      </div>`
    div.onclick = () => {
      _onSalvar?.({ profissaoId: prof.id })
      document.getElementById("modalEscolhaProfissao").classList.add("hidden")
    }
    lista.appendChild(div)
  })
  modal.classList.remove("hidden")
}

// ─────────────────────────────────────────────────────────
//  ABA PROFISSÃO (inalterado)
// ─────────────────────────────────────────────────────────
export function renderAbaProfissao(ficha) {
  const container = document.getElementById("conteudoProfissao")
  if (!container) return
  if (!ficha.profissaoId) {
    container.innerHTML = `<div class="aba-vazia"><p>Nenhuma profissão selecionada.</p>
      <button onclick="abrirModalProfissao()" class="btn-acao">⚒️ Escolher Profissão</button></div>`
    return
  }
  const prof = PROFISSOES.find(p => p.id === ficha.profissaoId)
  if (!prof) return
  const nivelFicha    = ficha.nivel ?? 1
  const habilsDesbloq = prof.habilidades.filter(h => h.nivel <= nivelFicha)
  const habilsBloc    = prof.habilidades.filter(h => h.nivel >  nivelFicha)
  const renderHab = (h, desbloqueada) => `
    <div class="card-info ${desbloqueada ? "desbloqueado" : "bloqueado"}">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <span class="badge-nivel ${desbloqueada ? "" : "bloqueado"}">Nível de Prof. ${h.nivel}${desbloqueada ? "" : " 🔒"}</span>
        <strong>${h.nome}</strong>
      </div>
      <div class="raca-desc">${_formatarDescRaca(h.desc)}</div>
    </div>`

  container.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">${prof.emoji}</span>
      <div><h2>${prof.nome}</h2><span style="opacity:0.6;font-size:13px">Requisito: ${prof.requisito}</span></div>
      <button onclick="abrirModalProfissao()" class="btn-trocar">Trocar</button>
    </div>
    <div class="nivel-prof-badge">Personagem nível <strong>${nivelFicha}</strong>
      <span style="opacity:0.5;font-size:12px"> — ${habilsDesbloq.length}/${prof.habilidades.length} habilidades</span>
    </div>
    <div class="secao-info"><h3>✅ Habilidades desbloqueadas</h3>
      ${habilsDesbloq.map(h => renderHab(h, true)).join("")}
      ${habilsBloc.length ? `<h3 style="margin-top:12px;opacity:0.6">🔒 Próximas</h3>${habilsBloc.map(h => renderHab(h, false)).join("")}` : ""}
    </div>
    <div id="secaoVersatilidade"></div>`

  _renderVersatilidade(ficha)
}

// ─── Versatilidade de Profissão ───────────────────────────
function _renderVersatilidade(ficha) {
  const container = document.getElementById("secaoVersatilidade")
  if (!container) return

  const nivel = ficha.nivel ?? 1
  const v     = ficha.versatilidade ?? { slot1: null, slot2: null }
  const NIVEL_SLOT1 = 7
  const NIVEL_SLOT2 = 14

  // Slot bloqueado (antes do nível mínimo)
  const renderBloqueado = (nivelReq) => `
    <div class="vers-slot vers-bloqueado">
      <div class="vers-slot-header">
        <span class="vers-icone">⚗️</span>
        <div>
          <strong>Versatilidade</strong>
          <span class="vers-requisito">🔒 Disponível no nível ${nivelReq}</span>
        </div>
      </div>
      <p class="vers-desc">Ao atingir o nível ${nivelReq}, você poderá escolher uma habilidade de nível 1 de outra profissão.</p>
    </div>`

  // Slot disponível mas vazio
  const renderVazio = (slotKey, opcoes) => {
    const optsHtml = opcoes.map(p =>
      `<option value="${p.id}">${p.emoji} ${p.nome}</option>`
    ).join("")
    return `
      <div class="vers-slot vers-disponivel">
        <div class="vers-slot-header">
          <span class="vers-icone">⚗️</span>
          <div>
            <strong>Versatilidade — Slot disponível</strong>
            <span class="vers-requisito vers-ok">✅ Desbloqueado no nível ${slotKey === "slot1" ? NIVEL_SLOT1 : NIVEL_SLOT2}</span>
          </div>
        </div>
        <p class="vers-desc">Escolha o nível 1 de uma profissão diferente da sua, ou converta este ponto em +1 PT de ficha.</p>
        <div class="vers-acoes">
          <select class="vers-select" id="versSelect_${slotKey}">
            <option value="">— escolha uma profissão —</option>
            ${optsHtml}
          </select>
          <button class="btn-acao vers-btn-confirmar" onclick="confirmarVersatilidade('${slotKey}','nivel1')">
            Expandir (Nível 1)
          </button>
          <button class="btn-acao vers-btn-pt" onclick="converterVersatilidadeEmPT('${slotKey}')">
            🎲 +1 PT de Ficha
          </button>
        </div>
      </div>`
  }

  // Slot 2 com opção de aprofundar (se slot1 existe)
  const renderVazio2ComAprofundar = (slot1Prof) => {
    const profSlot1 = PROFISSOES.find(p => p.id === slot1Prof?.profissaoId)
    const podeAprofundar = !!(slot1Prof && profSlot1)
    // Profissões disponíveis: todas exceto a principal e a do slot1
    const opcoes = PROFISSOES.filter(p => p.id !== ficha.profissaoId && p.id !== slot1Prof?.profissaoId)
    const optsHtml = opcoes.map(p =>
      `<option value="${p.id}">${p.emoji} ${p.nome}</option>`
    ).join("")
    const aprofundarBtn = podeAprofundar ? `
      <button class="btn-acao vers-btn-aprofundar" onclick="confirmarVersatilidade('slot2','nivel5')">
        ⬆️ Aprofundar ${profSlot1.emoji} ${profSlot1.nome} (Nível 5)
      </button>` : ""
    return `
      <div class="vers-slot vers-disponivel">
        <div class="vers-slot-header">
          <span class="vers-icone">⚗️</span>
          <div>
            <strong>Versatilidade — Slot 2 disponível</strong>
            <span class="vers-requisito vers-ok">✅ Desbloqueado no nível ${NIVEL_SLOT2}</span>
          </div>
        </div>
        <p class="vers-desc">Expanda para outra profissão (Nível 1), aprofunde a profissão do Slot 1 (Nível 5), ou converta em +1 PT.</p>
        <div class="vers-acoes">
          <select class="vers-select" id="versSelect_slot2">
            <option value="">— escolha uma profissão —</option>
            ${optsHtml}
          </select>
          <button class="btn-acao vers-btn-confirmar" onclick="confirmarVersatilidade('slot2','nivel1')">
            Expandir (Nível 1)
          </button>
          ${aprofundarBtn}
          <button class="btn-acao vers-btn-pt" onclick="converterVersatilidadeEmPT('slot2')">
            🎲 +1 PT de Ficha
          </button>
        </div>
      </div>`
  }

  // Slot preenchido
  const renderPreenchido = (slotKey, slot) => {
    const profVers = PROFISSOES.find(p => p.id === slot.profissaoId)
    if (!profVers) return ""
    const hab = profVers.habilidades.find(h => h.nivel === slot.nivel)
    return `
      <div class="vers-slot vers-preenchido">
        <div class="vers-slot-header">
          <span class="vers-icone">⚗️</span>
          <div>
            <strong>Versatilidade — ${slotKey === "slot1" ? "Slot 1" : "Slot 2"}</strong>
            <span class="vers-requisito vers-ok">✅ ${profVers.emoji} ${profVers.nome} — Nível ${slot.nivel}</span>
          </div>
          <button class="btn-trocar" onclick="resetarVersatilidade('${slotKey}')">Resetar</button>
        </div>
        ${hab ? `<div class="card-info desbloqueado" style="margin-top:8px">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
            <span class="badge-nivel">Nível de Prof. ${hab.nivel}</span>
            <strong>${hab.nome}</strong>
          </div>
          <p>${hab.desc}</p>
        </div>` : ""}
      </div>`
  }

  // Profissões disponíveis para slot1: todas exceto a principal
  const opcoes1 = PROFISSOES.filter(p => p.id !== ficha.profissaoId)

  let html = `<div class="secao-info"><h3>⚗️ Versatilidade de Profissão</h3>`

  // Slot 1
  if (nivel < NIVEL_SLOT1) {
    html += renderBloqueado(NIVEL_SLOT1)
  } else if (!v.slot1 || v.slot1.convertido) {
    if (v.slot1?.convertido) {
      html += `<div class="vers-slot vers-convertido">
        <div class="vers-slot-header"><span class="vers-icone">🎲</span>
          <div><strong>Versatilidade Slot 1</strong>
            <span class="vers-requisito vers-ok">Convertido em +1 PT de ficha</span>
          </div>
          <button class="btn-trocar" onclick="resetarVersatilidade('slot1')">Resetar</button>
        </div></div>`
    } else {
      html += renderVazio("slot1", opcoes1)
    }
  } else {
    html += renderPreenchido("slot1", v.slot1)
  }

  // Slot 2
  if (nivel < NIVEL_SLOT2) {
    html += renderBloqueado(NIVEL_SLOT2)
  } else if (!v.slot2 || v.slot2.convertido) {
    if (v.slot2?.convertido) {
      html += `<div class="vers-slot vers-convertido">
        <div class="vers-slot-header"><span class="vers-icone">🎲</span>
          <div><strong>Versatilidade Slot 2</strong>
            <span class="vers-requisito vers-ok">Convertido em +1 PT de ficha</span>
          </div>
          <button class="btn-trocar" onclick="resetarVersatilidade('slot2')">Resetar</button>
        </div></div>`
    } else {
      html += renderVazio2ComAprofundar(v.slot1)
    }
  } else {
    html += renderPreenchido("slot2", v.slot2)
  }

  html += `</div>`
  container.innerHTML = html
}