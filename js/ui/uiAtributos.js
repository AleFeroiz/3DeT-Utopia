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

  setBarraLargura("paFill", paAtual / paMax)
  setBarraLargura("pmFill", pmAtual / pmMax)
  setBarraLargura("pvFill", pvAtual / pvMax)
}

function setBarraLargura(id, ratio) {
  const pct = Math.min(Math.max(ratio * 100, 0), 100).toFixed(1)
  document.getElementById(id).style.width = pct + "%"
}

/** Atualiza o contador de pontos no topo */
export function renderPontos(ficha) {
  const gastos   = ficha.pontos.gastos
  const total    = ficha.pontos.total
  const restante = total - gastos

  document.getElementById("usado").innerText = gastos

  // Total é contenteditable — só atualiza se não estiver em foco
  const totalEl = document.getElementById("total")
  if (totalEl && document.activeElement !== totalEl) {
    totalEl.innerText  = total
    const offset = ficha.pontos.offsetTotal ?? 0
    totalEl.style.color = offset !== 0 ? "#fbbf24" : ""
    totalEl.title       = offset !== 0
      ? `Auto (nível ${ficha.nivel}): ${ficha.pontos.totalAuto} + offset: ${offset > 0 ? "+" : ""}${offset}`
      : "Clique para editar o total de pontos"
  }

  document.getElementById("restante").innerText   = restante
  document.getElementById("restante").style.color = restante < 0 ? "#ef4444" : "white"
}
