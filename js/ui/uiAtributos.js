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
  document.getElementById("paMax").innerText = ficha.status.pa.max
  document.getElementById("pmMax").innerText = ficha.status.pm.max
  document.getElementById("pvMax").innerText = ficha.status.pv.max

  const paAtual = document.getElementById("paAtual")
  const pmAtual = document.getElementById("pmAtual")
  const pvAtual = document.getElementById("pvAtual")

  // Só preenche o atual se o campo estiver vazio (não sobrescreve edição do jogador)
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
  const gastos    = ficha.pontos.gastos
  const total     = ficha.pontos.total
  const restante  = total - gastos

  document.getElementById("usado").innerText    = gastos
  document.getElementById("restante").innerText = restante
  document.getElementById("restante").style.color = restante < 0 ? "#ef4444" : "white"
}
