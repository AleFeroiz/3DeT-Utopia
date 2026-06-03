// ============================================================
//  veiculo.js — Lógica completa da Ficha de Veículo
// ============================================================

import { inicializar, getUser, onAuthChange, login, logout } from './firebase.js'

// ── TABELAS DE REGRA ──────────────────────────────────────
const ESCALA = {
  pequena: { modPorPod: 1, passosPorHab: 3, hpPorRes: 40, inventarioBase: 50,  nivelMax: 2, defensaMult: 4,  label: 'Pequena' },
  media:   { modPorPod: 3, passosPorHab: 2, hpPorRes: 60, inventarioBase: 80,  nivelMax: 3, defensaMult: 6,  label: 'Média'   },
  grande:  { modPorPod: 2, passosPorHab: 1, hpPorRes: 80, inventarioBase: 100, nivelMax: 4, defensaMult: 8,  label: 'Grande'  },
}

// Bônus por nível de modificação
const BONUS_NIVEL = {
  ofensiva:   { 1: '12–18', 2: '18–24', 3: '24–30', 4: '30–36' },
  defensiva:  { 1: '12–18', 2: '18–24', 3: '24–30', 4: '30–36' },
  mobilidade: { 1: '1 Passo', 2: '2 Passos', 3: '3 Passos', 4: '4 Passos' },
  suporte:    { 1: '+3 em Perícia', 2: '+6 em Perícia', 3: '+9 em Perícia', 4: '+12 em Perícia' },
  inventario: { 1: '+50% do inventário base', 2: '+50% do inventário base', 3: '+50% do inventário base', 4: '+50% do inventário base' },
}

const ALCANCE_NIVEL = { 1: 'Perto', 2: 'Longe', 3: 'Muito Longe', 4: 'Fora de Alcance*' }

// Cor por tipo de modificação
const COR_TIPO = {
  ofensiva:   '#ef4444',
  defensiva:  '#3b82f6',
  mobilidade: '#22c55e',
  suporte:    '#f59e0b',
  inventario: '#8b5cf6',
}

const LABEL_TIPO = {
  ofensiva:   '⚔️ Ofensiva',
  defensiva:  '🛡️ Defensiva',
  mobilidade: '💨 Mobilidade',
  suporte:    '🔭 Suporte',
  inventario: '📦 +Inventário',
}

// ── ESTADO DO VEÍCULO ─────────────────────────────────────
// Threshold em % do HP máximo
const THRESH_AVARIADO = 0.50  // abaixo disso → avariado
const THRESH_CRITICO  = 0.15  // abaixo disso → crítico

// Nível de modificação para com % de HP restante
const FALHA_NIVEL = { 1: 0.75, 2: 0.50, 3: 0.25, 4: 0 }

// ── DADOS DO VEÍCULO ──────────────────────────────────────
let veiculo = _novoVeiculo()
let _editandoModifId = null  // id da modif em edição
let _estadoForçado = null    // 'normal'|'avariado'|'critico'|null
let _saving = false

function _novoVeiculo() {
  return {
    id:          crypto.randomUUID(),
    nome:        '',
    escala:      'media',
    atribs:      { pod: 0, hab: 0, res: 0 },
    hpAtual:     0,
    modificacoes: [],  // { id, nome, tipo, nivel, pontos, desc, desativadaManual }
    _estadoForcado: null,
  }
}

// ── DERIVADOS ────────────────────────────────────────────
function derivados() {
  const e  = ESCALA[veiculo.escala]
  const { pod, hab, res } = veiculo.atribs

  // Atrib 0 fornece metade do bônus de 1 (arredondado para cima)
  const ef = (val, mult) => val === 0 ? Math.ceil(mult / 2) : val * mult

  const modifDisp  = ef(pod, e.modPorPod)
  const passos     = ef(hab, e.passosPorHab)
  const hpMax      = ef(res, e.hpPorRes)
  const defesa     = ef(res, e.defensaMult)
  const inventario = e.inventarioBase

  // Pontos de modificação gastos
  const ptosUsados = veiculo.modificacoes.reduce((s, m) => s + (m.pontos || 1), 0)

  // Inventário extra de mods tipo inventario
  const modInv = veiculo.modificacoes
    .filter(m => m.tipo === 'inventario' && !_modDesativada(m))
    .reduce((s) => s + Math.ceil(inventario * 0.5), 0)

  return {
    modifDisp,
    passos,
    hpMax,
    defesa,
    inventario: inventario + modInv,
    ptosUsados,
    ptosRestantes: modifDisp - ptosUsados,
    nivelMax: e.nivelMax,
  }
}

function estadoAtual() {
  if (veiculo._estadoForcado) return veiculo._estadoForcado
  const { hpMax } = derivados()
  if (hpMax === 0) return 'normal'
  const pct = veiculo.hpAtual / hpMax
  if (pct < THRESH_CRITICO)  return 'critico'
  if (pct < THRESH_AVARIADO) return 'avariado'
  return 'normal'
}

function limiteHpPorEstado(estado) {
  const { hpMax } = derivados()
  // Com estado forçado, não há limite inferior
  if (veiculo._estadoForcado) return { min: 0, max: hpMax }
  if (estado === 'critico')  return { min: 0,                          max: Math.ceil(hpMax * THRESH_CRITICO)  - 1 }
  if (estado === 'avariado') return { min: Math.ceil(hpMax * THRESH_CRITICO), max: Math.ceil(hpMax * THRESH_AVARIADO) - 1 }
  return { min: Math.ceil(hpMax * THRESH_AVARIADO), max: hpMax }
}

function _modDesativada(m) {
  if (m.desativadaManual) return true
  // Regra de integridade: para de funcionar com % de HP
  const { hpMax } = derivados()
  if (hpMax === 0 || m.tipo === 'inventario') return false
  const pct = veiculo.hpAtual / hpMax
  const threshold = FALHA_NIVEL[m.nivel] ?? 0
  return pct <= threshold
}

// ── PERSISTÊNCIA ─────────────────────────────────────────
const _chave = () => `veiculo_${veiculo.id}`

async function salvar() {
  vSalvoLabel.classList.remove('visivel')
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(async () => {
    try {
      localStorage.setItem(_chave(), JSON.stringify(veiculo))
      // Salvar índice de veículos
      const indice = JSON.parse(localStorage.getItem('veiculos_indice') || '[]')
      const idx = indice.findIndex(v => v.id === veiculo.id)
      const meta = { id: veiculo.id, nome: veiculo.nome || 'Sem Nome', escala: veiculo.escala }
      if (idx >= 0) indice[idx] = meta; else indice.push(meta)
      localStorage.setItem('veiculos_indice', JSON.stringify(indice))
      vSalvoLabel.classList.add('visivel')
      setTimeout(() => vSalvoLabel.classList.remove('visivel'), 2000)
    } catch(e) { console.error('Erro ao salvar:', e) }
  }, 600)
}
let _saveTimer = null

function carregar(id) {
  const raw = localStorage.getItem(`veiculo_${id}`)
  if (!raw) return false
  try {
    veiculo = JSON.parse(raw)
    return true
  } catch { return false }
}

// ── RENDER PRINCIPAL ──────────────────────────────────────
function renderTudo() {
  renderNome()
  renderEscala()
  renderAtribs()
  renderStatus()
  renderHp()
  renderModifs()
  renderModifResumo()
}

function renderNome() {
  const el = document.getElementById('vNome')
  if (el && document.activeElement !== el) el.value = veiculo.nome || ''
}

function renderEscala() {
  document.querySelectorAll('.v-escala-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.escala === veiculo.escala)
  })
  const e = ESCALA[veiculo.escala]
  document.getElementById('vEscalaInfo').innerHTML =
    `Modif/POD: <b>${e.modPorPod}</b> &nbsp;·&nbsp; Passos/HAB: <b>${e.passosPorHab}</b> &nbsp;·&nbsp; HP/RES: <b>${e.hpPorRes}</b><br>
     Inventário base: <b>${e.inventarioBase}</b> &nbsp;·&nbsp; Nível máx. modif.: <b>${e.nivelMax}</b> &nbsp;·&nbsp; Defesa: <b>${e.defensaMult}×RES</b>`
}

function renderAtribs() {
  const total = veiculo.atribs.pod + veiculo.atribs.hab + veiculo.atribs.res
  document.getElementById('vPod').textContent = veiculo.atribs.pod
  document.getElementById('vHab').textContent = veiculo.atribs.hab
  document.getElementById('vRes').textContent = veiculo.atribs.res
  document.getElementById('vPontosGastos').textContent = total
  document.getElementById('vPontosRestantes').textContent = 5 - total
}

function renderStatus() {
  const d = derivados()
  document.getElementById('vModifDisp').textContent  = d.modifDisp
  document.getElementById('vModifMax').textContent   = `Nv.${d.nivelMax}`
  document.getElementById('vPassos').textContent     = d.passos
  document.getElementById('vDefesa').textContent     = d.defesa
  document.getElementById('vInventario').textContent = d.inventario
}

function renderHp() {
  const { hpMax } = derivados()
  const hpAtual = Math.max(0, Math.min(veiculo.hpAtual, hpMax))
  veiculo.hpAtual = hpAtual

  const pct = hpMax > 0 ? (hpAtual / hpMax) * 100 : 0
  const estado = estadoAtual()

  // Barra
  const fill = document.getElementById('vHpBarraFill')
  fill.style.width = pct + '%'
  fill.style.background = estado === 'critico' ? 'var(--cor-critico)'
                        : estado === 'avariado' ? 'var(--cor-avariado)'
                        : 'var(--cor-normal)'

  // Thresholds visuais
  const ta = document.getElementById('vThreshAvariado')
  const tc = document.getElementById('vThreshCritico')
  ta.style.left = (THRESH_AVARIADO * 100) + '%'
  tc.style.left = (THRESH_CRITICO  * 100) + '%'

  // Números
  document.getElementById('vHpAtual').textContent = hpAtual
  document.getElementById('vHpMax').textContent   = hpMax

  // Badge de estado
  const badge = document.getElementById('vEstadoBadge')
  badge.textContent = estado === 'critico'  ? '🔴 Crítico'
                    : estado === 'avariado' ? '🟡 Avariado'
                    : '🟢 Normal'
  badge.className = 'v-estado-badge ' + (estado !== 'normal' ? estado : '')

  // Aviso de limite
  const aviso = document.getElementById('vEstadoAviso')
  const override = document.getElementById('vEstadoOverride')

  if (veiculo._estadoForcado) {
    aviso.style.display = 'none'
    override.style.display = 'flex'
    document.querySelectorAll('.v-estado-btn').forEach(btn => {
      btn.className = 'v-estado-btn'
      if (btn.dataset.estado === veiculo._estadoForcado)
        btn.classList.add('active-' + veiculo._estadoForcado)
    })
  } else {
    const lim = limiteHpPorEstado(estado)
    const noLimite = hpAtual <= lim.max && hpAtual > 0 && estado !== 'normal'
    if (noLimite || estado !== 'normal') {
      override.style.display = 'flex'
      document.querySelectorAll('.v-estado-btn').forEach(btn => {
        btn.className = 'v-estado-btn'
      })
    } else {
      override.style.display = 'none'
    }

    if (estado === 'avariado') {
      aviso.style.display = 'block'
      aviso.textContent = `⚠️ Avariado — HP abaixo de 50%. Para recuperar, serão necessários materiais e 1 Descanso Longo dedicado.`
    } else if (estado === 'critico') {
      aviso.style.display = 'block'
      aviso.textContent = `🔴 Crítico — HP abaixo de 15%. Exige materiais + múltiplos Descansos Longos e preferencialmente um Carpinteiro.`
      aviso.style.background = 'rgba(239,68,68,0.1)'
      aviso.style.borderColor = 'rgba(239,68,68,0.3)'
      aviso.style.color = 'var(--cor-critico)'
    } else {
      aviso.style.display = 'none'
    }
  }
}

function renderModifResumo() {
  const d = derivados()
  document.getElementById('mDisp').textContent     = d.modifDisp
  document.getElementById('mUsados').textContent   = d.ptosUsados
  document.getElementById('mRestantes').textContent = Math.max(0, d.ptosRestantes)
  document.getElementById('mNivelMax').textContent  = `Nv.${d.nivelMax}`
  // Cor de alerta se negativo
  const elR = document.getElementById('mRestantes')
  elR.style.color = d.ptosRestantes < 0 ? 'var(--cor-critico)' : 'var(--cor-tema)'
}

function renderModifs() {
  const lista = document.getElementById('vListaModif')
  lista.innerHTML = ''
  if (veiculo.modificacoes.length === 0) {
    lista.innerHTML = '<div style="text-align:center;color:#64748b;padding:32px 0;font-size:14px;">Nenhuma modificação ainda.</div>'
    return
  }

  veiculo.modificacoes.forEach(m => {
    const desativ = _modDesativada(m)
    const autoDesativ = !m.desativadaManual && desativ
    const cor = COR_TIPO[m.tipo] || 'var(--cor-tema)'

    const card = document.createElement('div')
    card.className = 'v-modif-card' + (desativ ? ' desativada' : '')
    card.style.setProperty('--cor-tipo', cor)

    // Bônus
    let bonusHtml = ''
    if (m.tipo !== 'inventario' && BONUS_NIVEL[m.tipo]?.[m.nivel]) {
      bonusHtml = `<span class="v-modif-bonus-tag">→ ${BONUS_NIVEL[m.tipo][m.nivel]}</span>`
      if (m.tipo === 'ofensiva') {
        bonusHtml += `<span class="v-modif-pts-tag">Alcance: ${ALCANCE_NIVEL[m.nivel]}</span>`
      }
    }

    const autoTag = autoDesativ
      ? `<span class="v-modif-desativ-tag" title="Desativada por integridade (regra automática)">🔴 Inativa (integridade)</span>`
      : m.desativadaManual
        ? `<span class="v-modif-desativ-tag" title="Desativada manualmente">🔴 Inativa (manual)</span>`
        : ''

    card.innerHTML = `
      <div class="v-modif-card-top">
        <div class="v-modif-card-info">
          <div class="v-modif-card-nome">
            ${_esc(m.nome || 'Sem nome')}
            ${autoTag}
          </div>
          <div class="v-modif-card-meta">
            <span class="v-modif-tag">${LABEL_TIPO[m.tipo] || m.tipo}</span>
            <span class="v-modif-nivel-tag">Nível ${m.nivel}</span>
            <span class="v-modif-pts-tag">${m.pontos} pt${m.pontos > 1 ? 's' : ''}</span>
            ${bonusHtml}
          </div>
          ${m.desc ? `<div class="v-modif-desc">${_esc(m.desc)}</div>` : ''}
        </div>
        <div class="v-modif-card-acoes">
          <button class="v-modif-btn" onclick="editarModif('${m.id}')">✏️</button>
          <button class="v-modif-btn v-modif-btn-del" onclick="deletarModif('${m.id}')">🗑️</button>
        </div>
      </div>
      <label class="v-modif-toggle" title="Marcar como desativada manualmente">
        <input type="checkbox" ${m.desativadaManual ? 'checked' : ''} onchange="toggleDesativManual('${m.id}', this.checked)">
        Desativar manualmente
      </label>
    `
    lista.appendChild(card)
  })
}

// ── AÇÕES ─────────────────────────────────────────────────
window.trocarAbaV = (i) => {
  document.querySelectorAll('.v-tab').forEach((t,idx) => t.classList.toggle('active', idx === i))
  document.querySelectorAll('.v-section').forEach((s,idx) => s.classList.toggle('active', idx === i))
}

window.setEscala = (e) => {
  veiculo.escala = e
  // Recalcular HP ao mudar escala
  const d = derivados()
  if (veiculo.hpAtual === 0 || veiculo.hpAtual > d.hpMax) veiculo.hpAtual = d.hpMax
  renderTudo(); salvar()
}

window.mudarAtrib = (attr, delta) => {
  const total = veiculo.atribs.pod + veiculo.atribs.hab + veiculo.atribs.res
  const val   = veiculo.atribs[attr]
  if (delta > 0 && total >= 5) return  // limite de 5 pontos total
  if (delta < 0 && val <= 0)  return   // não pode ficar negativo
  veiculo.atribs[attr] = val + delta
  // Ajustar HP se mudou RES
  if (attr === 'res') {
    const d = derivados()
    if (veiculo.hpAtual > d.hpMax) veiculo.hpAtual = d.hpMax
    if (veiculo.hpAtual === 0) veiculo.hpAtual = d.hpMax
  }
  renderTudo(); salvar()
}

window.mudarHp = (delta) => {
  _aplicarDeltaHp(delta)
}

window.aplicarHpCustom = (sinal) => {
  const input = document.getElementById('vHpInput')
  const val   = parseInt(input.value)
  if (isNaN(val) || val <= 0) { _toast('Digite um valor válido.', 'warn'); return }
  _aplicarDeltaHp(sinal * val)
  input.value = ''
}

function _aplicarDeltaHp(delta) {
  const { hpMax } = derivados()
  const novoHp = Math.max(0, Math.min(hpMax, veiculo.hpAtual + delta))

  // Se está perdendo HP e não tem estado forçado: verificar limite de estado
  if (!veiculo._estadoForcado && delta < 0) {
    const estadoAtuale = estadoAtual()
    const limites = limiteHpPorEstado(estadoAtuale)

    // Calcular qual seria o novo estado
    const pctNovo = hpMax > 0 ? novoHp / hpMax : 0
    const novoEstado = pctNovo < THRESH_CRITICO  ? 'critico'
                     : pctNovo < THRESH_AVARIADO ? 'avariado'
                     : 'normal'

    // Se mudaria de estado E não há permissão (estado não forçado),
    // limitar ao mínimo do estado atual
    if (novoEstado !== estadoAtuale) {
      // Bloquear na fronteira do estado atual
      const hpLimitado = limites.min
      veiculo.hpAtual = hpLimitado
      _toast(
        novoEstado === 'critico'
          ? '⚠️ HP limitado ao limiar Avariado → Crítico. Para continuar, troque o estado manualmente.'
          : '⚠️ HP limitado ao início de Avariado. Para continuar, troque o estado manualmente.',
        'warn'
      )
      // Mostrar controles de override
      document.getElementById('vEstadoOverride').style.display = 'flex'
      renderHp(); renderModifs(); salvar()
      return
    }
  }

  veiculo.hpAtual = novoHp
  renderHp(); renderModifs(); salvar()
}

window.forcarEstado = (estado) => {
  veiculo._estadoForcado = estado
  // Ajustar HP para dentro do novo estado
  const { hpMax } = derivados()
  const pct = hpMax > 0 ? veiculo.hpAtual / hpMax : 0
  const novoEstado = pct < THRESH_CRITICO  ? 'critico'
                   : pct < THRESH_AVARIADO ? 'avariado'
                   : 'normal'
  // Se o HP já está no estado correto, limpar o forçado
  if (novoEstado === estado) veiculo._estadoForcado = null
  renderHp(); renderModifs(); salvar()
}

window.toggleDesativManual = (id, checked) => {
  const m = veiculo.modificacoes.find(m => m.id === id)
  if (m) { m.desativadaManual = checked; renderModifs(); renderModifResumo(); salvar() }
}

window.deletarModif = (id) => {
  veiculo.modificacoes = veiculo.modificacoes.filter(m => m.id !== id)
  renderModifs(); renderModifResumo(); renderStatus(); salvar()
}

window.editarModif = (id) => {
  const m = veiculo.modificacoes.find(m => m.id === id)
  if (!m) return
  _editandoModifId = id
  _preencherModal(m)
  abrirModalModif()
}

// ── MODAL MODIFICAÇÃO ─────────────────────────────────────
let _mfTipo   = null
let _mfNivel  = 1
let _mfPontos = 1

window.abrirModalModif = () => {
  if (!_editandoModifId) {
    // Reset
    _mfTipo = null; _mfNivel = 1; _mfPontos = 1
    document.getElementById('mfNome').value = ''
    document.getElementById('mfDesc').value = ''
    document.getElementById('modalModifTitulo').textContent = 'Nova Modificação'
    document.querySelectorAll('.v-tipo-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.v-nivel-btn').forEach(b => b.classList.remove('active'))
    document.getElementById('mfPtos').textContent = '1'
    document.getElementById('mfBonusInfo').style.display = 'none'
    document.getElementById('mfPtosHint').textContent = ''
  }
  _atualizarNivelBtns()
  document.getElementById('modalModif').style.display = 'flex'
}

window.fecharModalModif = () => {
  document.getElementById('modalModif').style.display = 'none'
  _editandoModifId = null
  _mfTipo = null; _mfNivel = 1; _mfPontos = 1
}

window.fecharModalModifOverlay = (e) => {
  if (e.target === document.getElementById('modalModif')) fecharModalModif()
}

function _preencherModal(m) {
  _mfTipo   = m.tipo
  _mfNivel  = m.nivel
  _mfPontos = m.pontos
  document.getElementById('mfNome').value = m.nome || ''
  document.getElementById('mfDesc').value = m.desc || ''
  document.getElementById('modalModifTitulo').textContent = 'Editar Modificação'
  document.getElementById('mfPtos').textContent = m.pontos

  document.querySelectorAll('.v-tipo-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tipo === m.tipo))
  _atualizarNivelBtns()
  document.querySelectorAll('.v-nivel-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.nivel) === m.nivel))
  _atualizarBonusInfo()
  _atualizarPtosHint()
}

window.selecionarTipo = (tipo) => {
  _mfTipo = tipo
  document.querySelectorAll('.v-tipo-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tipo === tipo))
  _atualizarNivelBtns()
  _atualizarBonusInfo()
}

window.selecionarNivel = (n) => {
  _mfNivel = n
  document.querySelectorAll('.v-nivel-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.nivel) === n))
  _atualizarBonusInfo()
}

window.mudarPtsModif = (delta) => {
  const d = derivados()
  const max = d.modifDisp
  _mfPontos = Math.max(1, Math.min(max, _mfPontos + delta))
  document.getElementById('mfPtos').textContent = _mfPontos
  _atualizarPtosHint()
}

function _atualizarNivelBtns() {
  const d = derivados()
  document.querySelectorAll('.v-nivel-btn').forEach(btn => {
    const n = parseInt(btn.dataset.nivel)
    if (_mfTipo === 'inventario') {
      btn.disabled = n > 1  // inventário só tem nível 1
    } else {
      btn.disabled = n > d.nivelMax
    }
  })
  document.getElementById('mfNivelMaxLabel').textContent = `(máx. Nv.${d.nivelMax})`
}

function _atualizarBonusInfo() {
  const el = document.getElementById('mfBonusInfo')
  if (!_mfTipo || !_mfNivel) { el.style.display = 'none'; return }
  const bonus = BONUS_NIVEL[_mfTipo]?.[_mfNivel]
  if (!bonus) { el.style.display = 'none'; return }
  let txt = `<b>${LABEL_TIPO[_mfTipo]}</b> Nível ${_mfNivel} → <b>${bonus}</b>`
  if (_mfTipo === 'ofensiva') txt += `<br>Alcance: <b>${ALCANCE_NIVEL[_mfNivel]}</b>`
  if (_mfTipo === 'inventario') txt += '<br>Soma 50% do inventário base ao total.'
  el.innerHTML = txt
  el.style.display = 'block'
}

function _atualizarPtosHint() {
  const d = derivados()
  const usadosSemEsta = _editandoModifId
    ? veiculo.modificacoes.filter(m => m.id !== _editandoModifId).reduce((s,m) => s + (m.pontos||1), 0)
    : d.ptosUsados
  const disponivel = d.modifDisp - usadosSemEsta
  document.getElementById('mfPtosHint').textContent =
    `Disponível para esta modif.: ${disponivel} pt${disponivel !== 1 ? 's' : ''}`
}

window.confirmarModif = () => {
  const nome  = document.getElementById('mfNome').value.trim()
  const desc  = document.getElementById('mfDesc').value.trim()

  if (!nome)    { _toast('Digite um nome para a modificação.', 'erro');  return }
  if (!_mfTipo) { _toast('Selecione o tipo da modificação.',  'erro');  return }
  if (!_mfNivel){ _toast('Selecione o nível.',                'erro');  return }

  const d = derivados()
  const usadosSemEsta = _editandoModifId
    ? veiculo.modificacoes.filter(m => m.id !== _editandoModifId).reduce((s,m) => s + (m.pontos||1), 0)
    : d.ptosUsados
  if (_mfPontos > d.modifDisp - usadosSemEsta) {
    _toast('Pontos insuficientes de modificação.', 'warn'); return
  }

  if (_editandoModifId) {
    const m = veiculo.modificacoes.find(m => m.id === _editandoModifId)
    if (m) { m.nome = nome; m.tipo = _mfTipo; m.nivel = _mfNivel; m.pontos = _mfPontos; m.desc = desc }
  } else {
    veiculo.modificacoes.push({
      id: crypto.randomUUID(), nome, tipo: _mfTipo, nivel: _mfNivel,
      pontos: _mfPontos, desc, desativadaManual: false,
    })
  }

  fecharModalModif()
  renderModifs(); renderModifResumo(); renderStatus(); salvar()
}

// ── TOAST ─────────────────────────────────────────────────
function _toast(msg, tipo = 'info') {
  const c = document.getElementById('toastContainer')
  const t = document.createElement('div')
  t.className = `toast toast-${tipo}`
  t.textContent = msg
  c.appendChild(t)
  setTimeout(() => t.remove(), 3500)
}

// ── HELPERS ───────────────────────────────────────────────
function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── REFERÊNCIAS DO DOM ────────────────────────────────────
const vSalvoLabel = document.getElementById('vSalvoLabel')

// ── INIT ──────────────────────────────────────────────────
async function init() {
  // Ler ID da URL
  const params = new URLSearchParams(location.search)
  const id     = params.get('id')

  if (id && carregar(id)) {
    // Ficha existente carregada
  } else {
    // Novo veículo — definir HP inicial
    const d = derivados()
    veiculo.hpAtual = d.hpMax
    if (id) veiculo.id = id  // manter id se foi passado mas não encontrado
  }

  renderTudo()

  // Listeners
  document.getElementById('vNome').addEventListener('input', (e) => {
    veiculo.nome = e.target.value
    salvar()
  })
}

init()
