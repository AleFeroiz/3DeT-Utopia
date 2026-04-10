// ============================================================
//  ui/uiAtributos.js — Atributos, barras de status e pontos
// ============================================================

/** @param {import('../modelos/Ficha.js').Ficha} ficha */
export function sincronizarAtributosParaFicha(ficha) {
  ficha.atributos.poder       = +document.getElementById("poder").value       || 0
  ficha.atributos.habilidade  = +document.getElementById("habilidade").value  || 0
  ficha.atributos.resistencia = +document.getElementById("resistencia").value || 0
}

/** @param {import('../modelos/Ficha.js').Ficha} ficha */
export function renderAtributos(ficha) {
  document.getElementById("poder").value       = ficha.atributos.poder
  document.getElementById("habilidade").value  = ficha.atributos.habilidade
  document.getElementById("resistencia").value = ficha.atributos.resistencia
}

/** @param {import('../modelos/Ficha.js').Ficha} ficha */
export function renderStatus(ficha) {
  // Atualiza spans de max (contenteditable) — só se não tiver foco
  const setMax = (id, chave) => {
    const el = document.getElementById(id)
    if (!el || document.activeElement === el) return
    const offset = ficha.status[chave].offset ?? 0
    el.innerText  = ficha.status[chave].max
    // destaque visual: amarelo se tiver offset, normal se não tiver
    el.style.color = offset !== 0 ? "#fbbf24" : ""
    el.title       = offset !== 0
      ? `Auto: ${ficha.status[chave].auto} + offset: ${offset > 0 ? "+" : ""}${offset}`
      : "Clique para editar o máximo"
  }
  setMax("paMax", "pa")
  setMax("pmMax", "pm")
  setMax("pvMax", "pv")

  const paAtual = document.getElementById("paAtual")
  const pmAtual = document.getElementById("pmAtual")
  const pvAtual = document.getElementById("pvAtual")

  if (!paAtual.value) paAtual.value = ficha.status.pa.atual
  if (!pmAtual.value) pmAtual.value = ficha.status.pm.atual
  if (!pvAtual.value) pvAtual.value = ficha.status.pv.atual

  atualizarBarras(ficha)
}

/** Recalcula a largura das barras visuais */
export function atualizarBarras(ficha) {
  const paAtual = +document.getElementById("paAtual").value || 0
  const pmAtual = +document.getElementById("pmAtual").value || 0
  const pvAtual = +document.getElementById("pvAtual").value || 0

  const paMax = ficha.status.pa.max || 1
  const pmMax = ficha.status.pm.max || 1
  const pvMax = ficha.status.pv.max || 1

  _setBarraStatus("paFill", "paBackground", paAtual, paMax,
    { normal: "linear-gradient(90deg,#1d4ed8,#3b82f6)", over: "linear-gradient(90deg,#38bdf8,#bfdbfe)" })
  _setBarraStatus("pmFill", "pmBackground", pmAtual, pmMax,
    { normal: "linear-gradient(90deg,#7e22ce,#a855f7)", over: "linear-gradient(90deg,#e879f9,#f5d0fe)" })
  _setBarraStatus("pvFill", "pvBackground", pvAtual, pvMax,
    { normal: "linear-gradient(90deg,#991b1b,#ef4444)", over: "linear-gradient(90deg,#fb923c,#fde68a)" })

  // Teste de morte: aparece quando PV = 0
  _atualizarTesteMorte(pvAtual, ficha)
}

function _setBarraStatus(fillId, bgId, atual, max, colors) {
  const fill = document.getElementById(fillId)
  const bg   = document.getElementById(bgId)
  if (!fill) return

  const over  = atual > max
  const ratio = over ? 1 : (atual / max)
  fill.style.width      = Math.min(ratio * 100, 100).toFixed(1) + "%"
  fill.style.background = over ? colors.over : colors.normal

  if (over) {
    fill.style.boxShadow = "0 0 6px 1px rgba(255,255,255,0.18)"
    fill.style.filter    = "brightness(1.1)"
    if (bg) {
      bg.style.outline    = "1px solid rgba(255,255,255,0.18)"
      bg.style.borderRadius = "6px"
    }
  } else {
    fill.style.boxShadow = ""
    fill.style.filter    = ""
    if (bg) {
      bg.style.outline = ""
    }
  }

  // Estiliza o input numérico dentro da barra
  const inputId = bgId.replace("Background", "Atual")
  const input   = document.getElementById(inputId)
  if (input) {
    if (over) {
      input.classList.add("status-over")
    } else {
      input.classList.remove("status-over")
    }
  }
}

/** Atualiza o contador de pontos no topo */
export function renderPontos(ficha) {
  const gastos   = ficha.pontos.gastos
  const total    = ficha.pontos.total
  const restante = total - gastos

  // "usado" (gastos) — contenteditable com offset
  const usadoEl = document.getElementById("usado")
  if (usadoEl && document.activeElement !== usadoEl) {
    usadoEl.innerText = gastos
    const offsetG = ficha.pontos.offsetGastos ?? 0
    usadoEl.style.color = offsetG !== 0 ? "#fbbf24" : ""
    usadoEl.title       = offsetG !== 0
      ? `Auto: ${ficha.pontos.gastosAuto} + offset: ${offsetG > 0 ? "+" : ""}${offsetG}`
      : "Clique para editar pontos gastos"
  }

  // Indicador de offset nos gastos
  const gastosOffEl = document.getElementById("gastosOffset")
  if (gastosOffEl) {
    const off = ficha.pontos.offsetGastos ?? 0
    gastosOffEl.textContent = off !== 0 ? `(base ${ficha.pontos.gastosAuto} ${off > 0 ? "+" : ""}${off})` : ""
  }

  // "total" — contenteditable com offset
  const totalEl = document.getElementById("total")
  if (totalEl && document.activeElement !== totalEl) {
    totalEl.innerText  = total
    const offset = ficha.pontos.offsetTotal ?? 0
    totalEl.style.color = offset !== 0 ? "#fbbf24" : ""
    totalEl.title       = offset !== 0
      ? `Auto (nível ${ficha.nivel}): ${ficha.pontos.totalAuto} ${offset > 0 ? "+" : ""}${offset}`
      : "Clique para editar o total de pontos"
  }

  document.getElementById("restante").innerText   = restante
  document.getElementById("restante").style.color = restante < 0 ? "#ef4444" : "white"
}

// ── Teste de Morte (PV = 0) ───────────────────────────────
export function _atualizarTesteMorte(pvAtual, ficha) {
  const container = document.getElementById("testeMorteContainer")
  if (!container) return

  if (pvAtual > 0) {
    container.style.display = "none"
    return
  }

  container.style.display = "block"
  const marcadores = ficha?.status?.pv?.testeMorte ?? [false, false, false]

  container.innerHTML = `
    <div class="teste-morte-label">💀 Testes de Morte</div>
    <div class="teste-morte-bolinhas">
      ${marcadores.map((marcado, i) => `
        <button class="bolinha-morte ${marcado ? 'marcada' : ''}"
          onclick="marcarTesteMorte(${i})"
          title="${marcado ? 'Falha marcada' : 'Clique para marcar falha'}">
          ${marcado ? '💀' : '○'}
        </button>`).join('')}
    </div>
    ${marcadores.filter(Boolean).length >= 3 ? '<div class="teste-morte-aviso">⚠️ Personagem morto!</div>' : ''}
  `
}
