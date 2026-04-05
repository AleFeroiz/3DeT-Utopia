// ============================================================
//  ui/uiRacaProfissao.js — Seleção e exibição de Raça/Profissão
// ============================================================

import { RACAS      } from "../dados/racas.js"
import { PROFISSOES } from "../dados/profissoes.js"

let _onSalvar = null

export function registrarCallbackRacaProf(fn) { _onSalvar = fn }

// ─────────────────────────────────────────────────────────
//  SIDEBAR: botões de seleção rápida
// ─────────────────────────────────────────────────────────

export function renderSidebarRacaProf(ficha) {
  const racaBtn = document.getElementById("btnRaca")
  const profBtn = document.getElementById("btnProfissao")
  if (!racaBtn || !profBtn) return

  const raca = RACAS.find(r => r.id === ficha.racaId)
  const prof = PROFISSOES.find(p => p.id === ficha.profissaoId)

  racaBtn.textContent = raca ? `${raca.emoji} ${raca.nome}` : "🧬 Escolher Raça"
  profBtn.textContent = prof ? `${prof.emoji} ${prof.nome}` : "⚒️ Escolher Profissão"
}

// ─────────────────────────────────────────────────────────
//  ABA RAÇA
// ─────────────────────────────────────────────────────────

export function renderAbaRaca(ficha) {
  const container = document.getElementById("conteudoRaca")
  if (!container) return

  if (!ficha.racaId) {
    container.innerHTML = `
      <div class="aba-vazia">
        <p>Nenhuma raça selecionada.</p>
        <button onclick="abrirModalRaca()" class="btn-acao">🧬 Escolher Raça</button>
      </div>`
    return
  }

  const raca = RACAS.find(r => r.id === ficha.racaId)
  if (!raca) return

  const nivel = ficha.nivel
  const evolsDesbloqueadas = raca.evolucoes.filter(e => e.nivel === null || e.nivel <= nivel)
  const evolsBloqueadas    = raca.evolucoes.filter(e => e.nivel !== null && e.nivel > nivel)

  container.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">${raca.emoji}</span>
      <div>
        <h2>${raca.nome}</h2>
        ${raca.custo > 0 ? `<span class="badge-custo">${raca.custo} PT</span>` : ""}
      </div>
      <button onclick="abrirModalRaca()" class="btn-trocar">Trocar</button>
    </div>

    <div class="secao-info">
      <h3>✨ Extras</h3>
      ${raca.extras.map(e => `<div class="tag-extra">${e}</div>`).join("")}
    </div>

    <div class="secao-info">
      <h3>👍 Vantagens</h3>
      ${raca.vantagens.map(v => `
        <div class="card-info">
          <strong>${v.nome}</strong>
          <p>${v.desc}</p>
        </div>`).join("")}
    </div>

    <div class="secao-info">
      <h3>👎 Desvantagens</h3>
      ${raca.desvantagens.map(d => `
        <div class="card-info desvantagem">
          <strong>${d.nome}</strong>
          <p>${d.desc}</p>
        </div>`).join("")}
    </div>

    <div class="secao-info">
      <h3>⬆️ Evoluções</h3>
      ${evolsDesbloqueadas.map(e => `
        <div class="card-info desbloqueado">
          ${e.nivel ? `<span class="badge-nivel">Nível ${e.nivel}</span>` : ""}
          <strong>${e.nome}</strong>
          <p>${e.desc}</p>
        </div>`).join("")}
      ${evolsBloqueadas.map(e => `
        <div class="card-info bloqueado">
          <span class="badge-nivel bloqueado">Nível ${e.nivel} 🔒</span>
          <strong>${e.nome}</strong>
          <p>${e.desc}</p>
        </div>`).join("")}
    </div>
  `
}

// ─────────────────────────────────────────────────────────
//  ABA PROFISSÃO
// ─────────────────────────────────────────────────────────

export function renderAbaProfissao(ficha) {
  const container = document.getElementById("conteudoProfissao")
  if (!container) return

  if (!ficha.profissaoId) {
    container.innerHTML = `
      <div class="aba-vazia">
        <p>Nenhuma profissão selecionada.</p>
        <button onclick="abrirModalProfissao()" class="btn-acao">⚒️ Escolher Profissão</button>
      </div>`
    return
  }

  const prof = PROFISSOES.find(p => p.id === ficha.profissaoId)
  if (!prof) return

  // nivel da habilidade = nivel real da ficha (1, 5, 10, 15)
  const nivelFicha = ficha.nivel ?? 1

  const habilsDesbloq = prof.habilidades.filter(h => h.nivel <= nivelFicha)
  const habilsBloc    = prof.habilidades.filter(h => h.nivel >  nivelFicha)

  const renderHab = (h, desbloqueada) => `
    <div class="card-info ${desbloqueada ? "desbloqueado" : "bloqueado"}">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <span class="badge-nivel ${desbloqueada ? "" : "bloqueado"}">
          Nível de Prof. ${h.nivel}${desbloqueada ? "" : " 🔒"}
        </span>
        <strong>${h.nome}</strong>
      </div>
      <p>${h.desc}</p>
    </div>`

  container.innerHTML = `
    <div class="raca-header">
      <span class="raca-emoji">${prof.emoji}</span>
      <div>
        <h2>${prof.nome}</h2>
        <span style="opacity:0.6;font-size:13px">Requisito: ${prof.requisito}</span>
      </div>
      <button onclick="abrirModalProfissao()" class="btn-trocar">Trocar</button>
    </div>

    <div class="nivel-prof-badge">
      Personagem nível <strong>${nivelFicha}</strong>
      <span style="opacity:0.5;font-size:12px">— habilidades desbloqueadas: ${habilsDesbloq.length}/${prof.habilidades.length}</span>
    </div>

    <div class="secao-info">
      <h3>✅ Habilidades desbloqueadas (${habilsDesbloq.length})</h3>
      ${habilsDesbloq.map(h => renderHab(h, true)).join("")}
      ${habilsBloc.length ? `<h3 style="margin-top:12px;opacity:0.6">🔒 Próximas habilidades</h3>
      ${habilsBloc.map(h => renderHab(h, false)).join("")}` : ""}
    </div>
  `
}

// ─────────────────────────────────────────────────────────
//  MODAL: ESCOLHER RAÇA
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
      <p style="font-size:12px;opacity:0.6;margin-top:4px">${raca.extras.join(" • ")}</p>
    `
    div.onclick = () => {
      _onSalvar?.({ racaId: raca.id })
      document.getElementById("modalEscolhaRaca").classList.add("hidden")
    }
    lista.appendChild(div)
  })

  modal.classList.remove("hidden")
}

// ─────────────────────────────────────────────────────────
//  MODAL: ESCOLHER PROFISSÃO
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
      </div>
    `
    div.onclick = () => {
      _onSalvar?.({ profissaoId: prof.id })
      document.getElementById("modalEscolhaProfissao").classList.add("hidden")
    }
    lista.appendChild(div)
  })

  modal.classList.remove("hidden")
}
