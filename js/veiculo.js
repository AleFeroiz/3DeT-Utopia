// ============================================================
//  veiculo.js — Ficha de Veículo
//  localStorage + Firebase (visibilidade pública)
// ============================================================
import {
  inicializarFirebase, aguardarAuth,
  getUser, getDb, getFirebaseFns, estaConfigurado,
  registrarIndicePublico, removerIndicePublico,
  carregarFichaDeOutroUsuario,
} from './firebase.js'

// ── TABELAS DE REGRA ──────────────────────────────────────
const ESCALA = {
  pequena: { modPorPod: 1, passosPorHab: 3, hpPorRes: 40, inventarioBase: 50,  nivelMax: 2, defensaMult: 4,  label: 'Pequena' },
  media:   { modPorPod: 3, passosPorHab: 2, hpPorRes: 60, inventarioBase: 80,  nivelMax: 3, defensaMult: 6,  label: 'Média'   },
  grande:  { modPorPod: 2, passosPorHab: 1, hpPorRes: 80, inventarioBase: 100, nivelMax: 4, defensaMult: 8,  label: 'Grande'  },
}

// Bônus por nível de modificação (nível = pontos investidos)
const BONUS_NIVEL = {
  ofensiva:   { 1: '12–18', 2: '18–24', 3: '24–30', 4: '30–36' },
  defensiva:  { 1: '12–18', 2: '18–24', 3: '24–30', 4: '30–36' },
  mobilidade: { 1: '1 Passo', 2: '2 Passos', 3: '3 Passos', 4: '4 Passos' },
  suporte:    { 1: '+3 em Perícia', 2: '+6 em Perícia', 3: '+9 em Perícia', 4: '+12 em Perícia' },
  inventario: { 1: '+50% inventário base', 2: '+50% inventário base', 3: '+50% inventário base', 4: '+50% inventário base' },
}
const ALCANCE_NIVEL = { 1: 'Perto', 2: 'Longe', 3: 'Muito Longe', 4: 'Fora de Alcance*' }
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

// ── THRESHOLDS DE ESTADO ───────────────────────────────────
// critico:  0 – 15%   avariado: 16 – 50%   normal: > 50%
const THRESH_CRITICO  = 0.15
const THRESH_AVARIADO = 0.50

// Nível de modificação → threshold de falha por HP%
const FALHA_NIVEL = { 1: 0.75, 2: 0.50, 3: 0.25, 4: 0 }

// ── DADOS DO VEÍCULO ──────────────────────────────────────
let veiculo = _novoVeiculo()
let _editandoModifId = null
let _saving = false

function _novoVeiculo() {
  return {
    id:           crypto.randomUUID(),
    nome:         '',
    escala:       'media',
    atribs:       { pod: 0, hab: 0, res: 0 },
    hpAtual:      0,
    estadoManual: null,
    modificacoes: [],
    inventario:   { itens: [], offsetPeso: 0 },
    corTema:      '#3b82f6',
    imagemUrl:    null,
    imagemThumb:  null,
    isPublic:     false,
    editPublic:   false,
  }
}

// ── DERIVADOS ────────────────────────────────────────────
function derivados() {
  const e  = ESCALA[veiculo.escala]
  const { pod, hab, res } = veiculo.atribs
  const ef = (val, mult) => val === 0 ? Math.ceil(mult / 2) : val * mult

  const modifDisp  = ef(pod, e.modPorPod)
  const passos     = ef(hab, e.passosPorHab)
  const hpMax      = ef(res, e.hpPorRes)
  const defesa     = ef(res, e.defensaMult)
  const invBase    = e.inventarioBase + (veiculo.inventario?.offsetPeso ?? 0)

  const ptosUsados = veiculo.modificacoes.reduce((s, m) => s + (m.pontos || 1), 0)

  // Usa hpMax local para evitar recursão com _modDesativada
  const modInv = veiculo.modificacoes
    .filter(m => m.tipo === 'inventario' && !_modDesativada(m, hpMax))
    .reduce((s) => s + Math.ceil(e.inventarioBase * 0.5), 0)

  return {
    modifDisp,
    passos,
    hpMax,
    defesa,
    inventario: invBase + modInv,
    ptosUsados,
    ptosRestantes: modifDisp - ptosUsados,
    nivelMax: e.nivelMax,
  }
}

// ── ESTADO ──────────────────────────────────────────────
function _hpParaEstado(hp, hpMax) {
  if (hpMax <= 0) return 'normal'
  const pct = hp / hpMax
  if (pct <= THRESH_CRITICO)  return 'critico'
  if (pct <= THRESH_AVARIADO) return 'avariado'
  return 'normal'
}

function estadoAtual() {
  if (veiculo.estadoManual) return veiculo.estadoManual
  const { hpMax } = derivados()
  return _hpParaEstado(veiculo.hpAtual, hpMax)
}

// Retorna { min, max } em HP absoluto para um estado
function rangePorEstado(estado, hpMax) {
  if (estado === 'critico')  return { min: 0,                              max: Math.floor(hpMax * THRESH_CRITICO) }
  if (estado === 'avariado') return { min: Math.floor(hpMax * THRESH_CRITICO) + 1, max: Math.floor(hpMax * THRESH_AVARIADO) }
  return { min: Math.floor(hpMax * THRESH_AVARIADO) + 1, max: hpMax }
}

// Recebe hpMax opcionalmente para evitar recursão (quando chamada de dentro de derivados())
function _modDesativada(m, hpMaxOverride) {
  if (m.desativadaManual) return true
  const hpMax = hpMaxOverride ?? derivados().hpMax
  if (hpMax === 0 || m.tipo === 'inventario') return false
  const pct = veiculo.hpAtual / hpMax
  const threshold = FALHA_NIVEL[m.pontos] ?? 0
  return pct <= threshold
}

// ── PERSISTÊNCIA ─────────────────────────────────────────
let _saveTimer = null

async function salvar() {
  if (!_vDono) return   // Visitante sem permissão não salva
  document.getElementById('vSalvoLabel')?.classList.remove('visivel')
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(async () => {
    try {
      // Sempre salva no localStorage
      localStorage.setItem(`veiculo_${veiculo.id}`, JSON.stringify(veiculo))
      // Atualiza índice local com metadados incluindo retrato e cor
      const indice = JSON.parse(localStorage.getItem('veiculos_indice') || '[]')
      const idx = indice.findIndex(v => v.id === veiculo.id)
      const meta = {
        id:          veiculo.id,
        nome:        veiculo.nome || 'Sem Nome',
        escala:      veiculo.escala,
        corTema:     veiculo.corTema     ?? '#3b82f6',
        imagemThumb: veiculo.imagemThumb ?? null,
      }
      if (idx >= 0) indice[idx] = meta; else indice.push(meta)
      localStorage.setItem('veiculos_indice', JSON.stringify(indice))

      // Firebase: salva ficha na coleção do usuário
      if (estaConfigurado() && _vOwnerUid) {
        const db  = getDb()
        const fns = getFirebaseFns()
        if (db && fns) {
          const ref = fns.doc(db, 'users', _vOwnerUid, 'veiculos', veiculo.id)
          await fns.setDoc(ref, { ...veiculo, _updatedAt: new Date().toISOString() })
        }
        // Gerenciar public_index
        const eraPublica = _vEraPublica
        const ePublica   = veiculo.isPublic ?? false
        if (ePublica && !eraPublica) {
          await registrarIndicePublico(veiculo.id, _vOwnerUid, 'veiculo')
          _vEraPublica = true
        } else if (!ePublica && eraPublica) {
          await removerIndicePublico(veiculo.id)
          _vEraPublica = false
        }
      }

      const lbl = document.getElementById('vSalvoLabel')
      if (lbl) { lbl.classList.add('visivel'); setTimeout(() => lbl.classList.remove('visivel'), 2000) }
    } catch(e) { console.error('Erro ao salvar:', e) }
  }, 600)
}

function carregar(id) {
  const raw = localStorage.getItem(`veiculo_${id}`)
  if (!raw) return false
  try {
    veiculo = JSON.parse(raw)
    // Migração: campos antigos
    if (!veiculo.inventario)        veiculo.inventario   = { itens: [], offsetPeso: 0 }
    if (!veiculo.inventario.itens)  veiculo.inventario.itens = []
    if (veiculo.inventario.offsetPeso == null) veiculo.inventario.offsetPeso = 0
    if (veiculo._estadoForcado !== undefined) {
      veiculo.estadoManual = veiculo._estadoForcado
      delete veiculo._estadoForcado
    }
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
  renderInventario()
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
  document.getElementById('vPontosGastos').textContent  = total
  document.getElementById('vPontosRestantes').textContent = 15 - total
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
  veiculo.hpAtual = Math.max(0, Math.min(hpMax, veiculo.hpAtual))

  const hpAtual = veiculo.hpAtual
  const pct     = hpMax > 0 ? (hpAtual / hpMax) * 100 : 0
  const estado  = estadoAtual()

  // Barra
  const fill = document.getElementById('vHpBarraFill')
  fill.style.width      = pct + '%'
  fill.style.background = estado === 'critico'  ? 'var(--cor-critico)'
                        : estado === 'avariado' ? 'var(--cor-avariado)'
                        : 'var(--cor-normal)'

  // Thresholds
  document.getElementById('vThreshAvariado').style.left = (THRESH_AVARIADO * 100) + '%'
  document.getElementById('vThreshCritico').style.left  = (THRESH_CRITICO  * 100) + '%'

  // Números
  document.getElementById('vHpAtual').textContent = hpAtual
  document.getElementById('vHpMax').textContent   = hpMax

  // Badge — mostra estado atual + indicador se é manual
  const badge    = document.getElementById('vEstadoBadge')
  const ehManual = !!veiculo.estadoManual

  const labelEstado = estado === 'critico'  ? '🔴 Crítico'
                    : estado === 'avariado' ? '🟡 Avariado'
                    : '🟢 Normal'
  badge.textContent = labelEstado + (ehManual ? ' ✎' : '')
  badge.className   = 'v-estado-badge' + (estado !== 'normal' ? ' ' + estado : '')

  // Botões do seletor — destacar o estado ativo
  document.querySelectorAll('.v-estado-btn').forEach(btn => {
    btn.classList.toggle('active-' + btn.dataset.estado, btn.dataset.estado === estado)
  })

  // Aviso
  const aviso = document.getElementById('vEstadoAviso')
  if (estado === 'avariado') {
    aviso.style.display = 'block'
    aviso.style.background   = 'rgba(245,158,11,0.1)'
    aviso.style.borderColor  = 'rgba(245,158,11,0.3)'
    aviso.style.color        = 'var(--cor-avariado)'
    aviso.textContent = '⚠️ Avariado — HP abaixo de 50%. Recuperação exige materiais e 1 Descanso Longo.'
  } else if (estado === 'critico') {
    aviso.style.display = 'block'
    aviso.style.background   = 'rgba(239,68,68,0.1)'
    aviso.style.borderColor  = 'rgba(239,68,68,0.3)'
    aviso.style.color        = 'var(--cor-critico)'
    aviso.textContent = '🔴 Crítico — HP abaixo de 15%. Exige materiais + múltiplos Descansos Longos.'
  } else {
    aviso.style.display = 'none'
  }
}

function renderModifResumo() {
  const d = derivados()
  document.getElementById('mDisp').textContent      = d.modifDisp
  document.getElementById('mUsados').textContent    = d.ptosUsados
  document.getElementById('mRestantes').textContent = Math.max(0, d.ptosRestantes)
  document.getElementById('mNivelMax').textContent  = `Nv.${d.nivelMax}`
  const elR = document.getElementById('mRestantes')
  elR.style.color = d.ptosRestantes < 0 ? 'var(--cor-critico)' : 'var(--cor-tema)'
}

function renderModifs() {
  const lista = document.getElementById('vListaModif')
  lista.innerHTML = ''
  if (!veiculo.modificacoes.length) {
    lista.innerHTML = '<div style="text-align:center;color:#64748b;padding:32px 0;font-size:14px;">Nenhuma modificação ainda.</div>'
    return
  }

  veiculo.modificacoes.forEach(m => {
    const desativ     = _modDesativada(m)
    const autoDesativ = !m.desativadaManual && desativ
    const cor         = COR_TIPO[m.tipo] || 'var(--cor-tema)'
    const nivel       = m.pontos  // nível = pontos investidos

    const card = document.createElement('div')
    card.className = 'v-modif-card' + (desativ ? ' desativada' : '')
    card.style.setProperty('--cor-tipo', cor)

    let bonusHtml = ''
    if (m.tipo !== 'inventario' && BONUS_NIVEL[m.tipo]?.[nivel]) {
      bonusHtml = `<span class="v-modif-bonus-tag">→ ${BONUS_NIVEL[m.tipo][nivel]}</span>`
      if (m.tipo === 'ofensiva') bonusHtml += `<span class="v-modif-pts-tag">Alcance: ${ALCANCE_NIVEL[nivel]}</span>`
    }

    const autoTag = autoDesativ
      ? `<span class="v-modif-desativ-tag" title="Desativada por integridade">🔴 Inativa (integridade)</span>`
      : m.desativadaManual
        ? `<span class="v-modif-desativ-tag" title="Desativada manualmente">🔴 Inativa (manual)</span>`
        : ''

    card.innerHTML = `
      <div class="v-modif-card-top">
        <div class="v-modif-card-info">
          <div class="v-modif-card-nome">${_esc(m.nome || 'Sem nome')} ${autoTag}</div>
          <div class="v-modif-card-meta">
            <span class="v-modif-tag">${LABEL_TIPO[m.tipo] || m.tipo}</span>
            <span class="v-modif-nivel-tag">Nível ${nivel}</span>
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
      <label class="v-modif-toggle">
        <input type="checkbox" ${m.desativadaManual ? 'checked' : ''} onchange="toggleDesativManual('${m.id}', this.checked)">
        Desativar manualmente
      </label>`
    lista.appendChild(card)
  })
}

// ── INVENTÁRIO (idêntico à ficha de personagem) ───────────

// Lista de perícias (importada do banco ou definida inline)
let LISTA_PERICIAS = []
async function _carregarPericias() {
  if (LISTA_PERICIAS.length) return
  try {
    const mod = await import('./dados/banco.js?v=600000')
    LISTA_PERICIAS = mod.LISTA_PERICIAS || []
  } catch(e) {
    console.warn('banco.js não carregado, perícias vazias')
  }
}

function _popularSelectPericias() {
  const sel = document.getElementById('itemPericia')
  if (!sel) return
  if (sel.options.length > 1) return
  sel.innerHTML = '<option value="">— escolha uma perícia —</option>'
  LISTA_PERICIAS.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = `${p.emoji} ${p.nome}`
    sel.appendChild(opt)
  })
}

function renderInventario() {
  if (!veiculo.inventario) veiculo.inventario = { itens: [], offsetPeso: 0 }
  const inv      = veiculo.inventario
  const itens    = inv.itens ?? []
  const d        = derivados()
  const pesoMax  = d.inventario
  const pesoAtual = itens.reduce((s, i) => s + (i.peso ?? 0), 0)

  const elAtual  = document.getElementById('invPesoAtual')
  const elMax    = document.getElementById('invPesoMax')
  const elFill   = document.getElementById('invBarraFill')
  const elOffset = document.getElementById('invPesoOffset')

  // invBase = base da escala + offset manual (o que o usuário edita)
  const invBase = ESCALA[veiculo.escala].inventarioBase + (inv.offsetPeso ?? 0)
  // modInv = bônus das modificações de inventário
  const modInvBonus = pesoMax - invBase

  if (elAtual) { elAtual.textContent = pesoAtual; elAtual.style.color = pesoAtual > pesoMax ? '#ef4444' : '#22c55e' }
  // Exibir apenas base+offset no contenteditable (sem modInv), evitando o bug de soma dupla
  if (elMax && document.activeElement !== elMax) {
    elMax.innerText = invBase
  }
  const elModInv = document.getElementById('invPesoModInv')
  if (elModInv) elModInv.textContent = modInvBonus > 0 ? `+${modInvBonus} (modif.)` : ''
  if (elOffset) {
    const off = inv.offsetPeso ?? 0
    elOffset.textContent = off !== 0 ? `base ${ESCALA[veiculo.escala].inventarioBase} ${off > 0 ? '+' : ''}${off} (manual)` : `base ${ESCALA[veiculo.escala].inventarioBase}`
  }
  if (elFill) {
    const ratio = pesoMax > 0 ? Math.min(pesoAtual / pesoMax, 1) : 0
    const over  = pesoAtual > pesoMax
    elFill.style.width      = (ratio * 100).toFixed(1) + '%'
    elFill.style.background = over
      ? 'linear-gradient(90deg,#ef4444,#fca5a5)'
      : ratio > 0.75
        ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
        : 'linear-gradient(90deg,#16a34a,#4ade80)'
  }

  const container = document.getElementById('listaItens')
  if (!container) return
  container.innerHTML = ''

  if (!itens.length) {
    container.innerHTML = '<div class="v-inv-vazio">Nenhum item no inventário.</div>'
    return
  }

  const _alcLabels = {
    corpo_a_corpo: '🤜 Corpo a corpo', curto: '📏 Curto',
    longo: '📐 Longo', muito_longo: '🎯 Muito longo', fora_de_alcance: '❌ Fora de alcance'
  }

  itens.forEach(item => {
    const card = document.createElement('div')
    card.className = 'inv-item-card' + (item.categoria === 'equipamento' ? ' inv-item-equip' : '')

    const badgeAtk = (item.categoria === 'equipamento' && item.usadoAtaque && item.equipadoAtaque)
      ? `<span class="inv-badge inv-badge-atk">⚔️ +${item.bonusAtaque ?? 0}</span>` : ''
    const badgeDef = (item.categoria === 'equipamento' && item.usadoDefesa && item.equipadoDefesa)
      ? (() => {
          const bonus = Number(item.bonusDefesa) || 0
          const prio  = Math.max(1, Number(item.prioridadeDefesa) || 1)
          const efet  = Math.trunc(bonus / prio)
          const prioBadge = prio > 1 ? ` <span style="opacity:0.6;font-size:10px">(÷${prio})</span>` : ''
          return `<span class="inv-badge inv-badge-def" title="Bônus bruto: ${bonus} ÷ prioridade ${prio} = ${efet}">🛡️ +${efet}${prioBadge}</span>`
        })() : ''
    const badgeCat    = item.categoria === 'equipamento' ? '<span class="inv-badge inv-badge-equip">Equip.</span>' : ''
    const pericia     = LISTA_PERICIAS.find(p => p.id === item.pericia)
    const badgePericia = pericia ? `<span class="inv-badge inv-badge-pericia" title="Perícia: ${pericia.nome}">${pericia.emoji} ${pericia.nome}</span>` : ''
    const badgeCatNum = (item.categoria === 'equipamento' && item.catEquip)
      ? `<span class="inv-badge" style="background:rgba(30,64,175,0.3);color:#93c5fd;border:1px solid rgba(59,130,246,0.3)">Cat. ${item.catEquip}</span>` : ''
    const encantsHtml = (item.encantamentos ?? []).map(e =>
      `<span class="inv-badge inv-badge-encant" title="${e.desc}">${e.emoji} ${e.nome}${e.extra ? ' (' + e.extra + ')' : ''}</span>`
    ).join('')
    const badgeAlcance = (item.categoria === 'equipamento' && item.usadoAtaque && item.equipadoAtaque && item.alcanceIdeal)
      ? `<span class="inv-badge inv-badge-alcance">${_alcLabels[item.alcanceIdeal] ?? item.alcanceIdeal}</span>` : ''

    const checkAtk = (item.categoria === 'equipamento' && item.usadoAtaque)
      ? `<label class="inv-check-uso" title="Ativar bônus de ataque">
           <input type="checkbox" ${item.equipadoAtaque ? 'checked' : ''} onchange="toggleEquipado('${item.id}','ataque',this.checked)">
           ⚔️
         </label>` : ''
    const checkDef = (item.categoria === 'equipamento' && item.usadoDefesa)
      ? `<label class="inv-check-uso" title="Ativar bônus de defesa">
           <input type="checkbox" ${item.equipadoDefesa ? 'checked' : ''} onchange="toggleEquipado('${item.id}','defesa',this.checked)">
           🛡️
         </label>` : ''

    card.innerHTML = `
      <div class="inv-item-info">
        <div class="inv-item-nome">${_esc(item.nome)} ${badgeCat}${badgeCatNum}${badgePericia}${badgeAtk}${badgeDef}${badgeAlcance}${encantsHtml}</div>
        ${item.descricao ? `<div class="inv-item-desc">${_esc(item.descricao)}</div>` : ''}
      </div>
      <div class="inv-item-direita">
        <span class="inv-item-peso">⚖️ ${item.peso ?? 0}</span>
        <div class="inv-item-acoes">
          ${checkAtk}${checkDef}
          <button class="btn-editar" onclick="abrirEditarItem('${item.id}')">✏️</button>
          <button class="btn-remover" onclick="removerItem('${item.id}')">🗑️</button>
        </div>
      </div>`
    container.appendChild(card)
  })
}

// ── AÇÕES ─────────────────────────────────────────────────
window.trocarAbaV = (i) => {
  document.querySelectorAll('.v-tab').forEach((t, idx)     => t.classList.toggle('active', idx === i))
  document.querySelectorAll('.v-section').forEach((s, idx) => s.classList.toggle('active', idx === i))
}

window.setEscala = (e) => {
  veiculo.escala = e
  const d = derivados()
  if (veiculo.hpAtual === 0 || veiculo.hpAtual > d.hpMax) veiculo.hpAtual = d.hpMax
  renderTudo(); salvar()
  _toast(`⚙️ Escala alterada para ${ESCALA[e].label}.`, 'info')
}

window.mudarAtrib = (attr, delta) => {
  const total = veiculo.atribs.pod + veiculo.atribs.hab + veiculo.atribs.res
  const val   = veiculo.atribs[attr]
  if (delta > 0 && total >= 15) { _toast('⛔ Limite de 15 pontos de atributo atingido.', 'erro'); return }
  if (delta < 0 && val <= 0)    return
  veiculo.atribs[attr] = val + delta
  if (attr === 'res') {
    const d = derivados()
    if (veiculo.hpAtual > d.hpMax) veiculo.hpAtual = d.hpMax
    if (veiculo.hpAtual === 0)     veiculo.hpAtual = d.hpMax
  }
  renderAtribs(); renderStatus(); renderHp(); renderModifResumo(); salvar()
}

window.mudarHp = (delta) => {
  const { hpMax } = derivados()
  veiculo.hpAtual = Math.max(0, Math.min(hpMax, veiculo.hpAtual + delta))
  // Se temos estado manual, verificar se o HP ainda está no range correto
  // Se não estiver, limpar o estado manual (HP voltou ao estado natural)
  if (veiculo.estadoManual) {
    const estadoNatural = _hpParaEstado(veiculo.hpAtual, hpMax)
    if (estadoNatural === veiculo.estadoManual) veiculo.estadoManual = null
  }
  renderHp(); renderModifs(); salvar()
}

// ── SISTEMA DE ESTADO ──────────────────────────────────────

let _seletorAberto = false

window.toggleSeletorEstado = () => {
  const seletor = document.getElementById('vEstadoSeletor')
  _seletorAberto = !_seletorAberto
  seletor.style.display = _seletorAberto ? 'flex' : 'none'
}

// Fechar seletor ao clicar fora
document.addEventListener('click', (e) => {
  if (_seletorAberto && !e.target.closest('#vEstadoSeletor') && !e.target.closest('#vEstadoBadge')) {
    _seletorAberto = false
    const seletor = document.getElementById('vEstadoSeletor')
    if (seletor) seletor.style.display = 'none'
  }
})

window.setEstado = (novoEstado) => {
  const { hpMax } = derivados()

  // Se já está nesse estado natural, limpar o manual
  const estadoNatural = _hpParaEstado(veiculo.hpAtual, hpMax)
  if (novoEstado === estadoNatural) {
    veiculo.estadoManual = null
  } else {
    veiculo.estadoManual = novoEstado
    // Ajustar HP ao range do novo estado
    const range = rangePorEstado(novoEstado, hpMax)
    if (veiculo.hpAtual < range.min) veiculo.hpAtual = range.min
    if (veiculo.hpAtual > range.max) veiculo.hpAtual = range.max
  }

  // Fechar seletor
  _seletorAberto = false
  const seletor = document.getElementById('vEstadoSeletor')
  if (seletor) seletor.style.display = 'none'

  renderHp(); renderModifs(); salvar()
  const estadoLabel = novoEstado === 'critico' ? '🔴 Crítico' : novoEstado === 'avariado' ? '🟡 Avariado' : '🟢 Normal'
  _toast(`Estado alterado para ${estadoLabel}.`, novoEstado === 'critico' ? 'erro' : novoEstado === 'avariado' ? 'aviso' : 'sucesso')
}

// ── MODIFICAÇÕES ──────────────────────────────────────────
window.toggleDesativManual = (id, checked) => {
  const m = veiculo.modificacoes.find(m => m.id === id)
  if (m) {
    m.desativadaManual = checked
    renderModifs(); renderModifResumo(); salvar()
    _toast(checked ? `🔴 "${m.nome}" desativada manualmente.` : `🟢 "${m.nome}" reativada.`, checked ? 'aviso' : 'sucesso')
  }
}

window.deletarModif = (id) => {
  const m = veiculo.modificacoes.find(m => m.id === id)
  veiculo.modificacoes = veiculo.modificacoes.filter(m => m.id !== id)
  renderModifs(); renderModifResumo(); renderStatus(); salvar()
  _toast(`🗑️ Modificação "${m?.nome || 'sem nome'}" removida.`, 'aviso')
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
let _mfPontos = 1

window.abrirModalModif = () => {
  if (!_editandoModifId) {
    _mfTipo = null; _mfPontos = 1
    document.getElementById('mfNome').value = ''
    document.getElementById('mfDesc').value = ''
    document.getElementById('modalModifTitulo').textContent = 'Nova Modificação'
    document.querySelectorAll('.v-tipo-btn').forEach(b => b.classList.remove('active'))
    document.getElementById('mfPtos').textContent = '1'
    document.getElementById('mfBonusInfo').style.display = 'none'
    document.getElementById('mfPtosHint').textContent = ''
  }
  _atualizarNivelMaxLabel()
  document.getElementById('modalModif').style.display = 'flex'
}

window.fecharModalModif = () => {
  document.getElementById('modalModif').style.display = 'none'
  _editandoModifId = null; _mfTipo = null; _mfPontos = 1
}

window.fecharModalModifOverlay = (e) => {
  if (e.target === document.getElementById('modalModif')) fecharModalModif()
}

function _preencherModal(m) {
  _mfTipo   = m.tipo
  _mfPontos = m.pontos
  document.getElementById('mfNome').value = m.nome || ''
  document.getElementById('mfDesc').value = m.desc || ''
  document.getElementById('modalModifTitulo').textContent = 'Editar Modificação'
  document.getElementById('mfPtos').textContent = m.pontos
  document.querySelectorAll('.v-tipo-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === m.tipo))
  _atualizarBonusInfo()
  _atualizarPtosHint()
}

window.selecionarTipo = (tipo) => {
  _mfTipo = tipo
  document.querySelectorAll('.v-tipo-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === tipo))
  _atualizarBonusInfo()
}

window.mudarPtsModif = (delta) => {
  const d   = derivados()
  const max = _mfTipo === 'inventario' ? 1 : d.nivelMax
  const novo = _mfPontos + delta
  if (novo > max) {
    _toast(`⛔ Nível máximo para a escala ${ESCALA[veiculo.escala].label} é ${max}.`, 'erro')
    return
  }
  // Verificar pontos disponíveis ao aumentar
  if (delta > 0) {
    const usadosSemEsta = _editandoModifId
      ? veiculo.modificacoes.filter(m => m.id !== _editandoModifId).reduce((s, m) => s + (m.pontos || 1), 0)
      : d.ptosUsados
    const disp = d.modifDisp - usadosSemEsta - _mfPontos
    if (disp < 1) {
      _toast(`⛔ Sem pontos disponíveis! (${d.modifDisp - usadosSemEsta} pt no total)`, 'erro')
      return
    }
  }
  _mfPontos = Math.max(1, Math.min(max, novo))
  document.getElementById('mfPtos').textContent = _mfPontos
  _atualizarBonusInfo()
  _atualizarPtosHint()
}

function _atualizarNivelMaxLabel() {
  const d = derivados()
  const max = _mfTipo === 'inventario' ? 1 : d.nivelMax
  document.getElementById('mfNivelMaxLabel').textContent = `(máx. Nv.${max})`
}

function _atualizarBonusInfo() {
  const el = document.getElementById('mfBonusInfo')
  if (!_mfTipo || !_mfPontos) { el.style.display = 'none'; return }
  const bonus = BONUS_NIVEL[_mfTipo]?.[_mfPontos]
  if (!bonus) { el.style.display = 'none'; return }
  let txt = `<b>${LABEL_TIPO[_mfTipo]}</b> Nível ${_mfPontos} → <b>${bonus}</b>`
  if (_mfTipo === 'ofensiva')   txt += `<br>Alcance: <b>${ALCANCE_NIVEL[_mfPontos]}</b>`
  if (_mfTipo === 'inventario') txt += '<br>Soma 50% do inventário base ao total.'
  el.innerHTML = txt
  el.style.display = 'block'
  _atualizarNivelMaxLabel()
}

function _atualizarPtosHint() {
  const d = derivados()
  const usadosSemEsta = _editandoModifId
    ? veiculo.modificacoes.filter(m => m.id !== _editandoModifId).reduce((s, m) => s + (m.pontos || 1), 0)
    : d.ptosUsados
  const disponivel = d.modifDisp - usadosSemEsta
  document.getElementById('mfPtosHint').textContent =
    `Disponível: ${disponivel} pt${disponivel !== 1 ? 's' : ''}`
}

window.confirmarModif = () => {
  const nome = document.getElementById('mfNome').value.trim()
  const desc = document.getElementById('mfDesc').value.trim()

  if (!nome)    { _toast('❌ Digite um nome para a modificação.', 'erro'); return }
  if (!_mfTipo) { _toast('❌ Selecione o tipo da modificação.', 'erro'); return }

  const d   = derivados()
  const max = _mfTipo === 'inventario' ? 1 : d.nivelMax
  if (_mfPontos > max) { _toast(`⛔ Nível máximo para esta escala (${veiculo.escala}) é ${max}.`, 'erro'); return }

  const usadosSemEsta = _editandoModifId
    ? veiculo.modificacoes.filter(m => m.id !== _editandoModifId).reduce((s, m) => s + (m.pontos || 1), 0)
    : d.ptosUsados
  if (_mfPontos > d.modifDisp - usadosSemEsta) {
    const disp2 = d.modifDisp - usadosSemEsta
    _toast(`⛔ Pontos insuficientes! Disponível: ${disp2} pt${disp2 !== 1 ? 's' : ''}.`, 'erro'); return
  }

  if (_editandoModifId) {
    const m = veiculo.modificacoes.find(m => m.id === _editandoModifId)
    if (m) { m.nome = nome; m.tipo = _mfTipo; m.nivel = _mfPontos; m.pontos = _mfPontos; m.desc = desc }
  } else {
    veiculo.modificacoes.push({
      id: crypto.randomUUID(), nome, tipo: _mfTipo, nivel: _mfPontos,
      pontos: _mfPontos, desc, desativadaManual: false,
    })
  }

  const nomeAcao = _editandoModifId ? 'atualizada' : 'adicionada'
  const nomeModif = nome
  fecharModalModif()
  renderModifs(); renderModifResumo(); renderStatus(); salvar()
  _toast(`✅ Modificação "${nomeModif}" ${nomeAcao}!`, 'sucesso')
}

// ── INVENTÁRIO: AÇÕES ─────────────────────────────────────

window.editarPesoMaxVInv = (val) => {
  // O contenteditable mostra base+offset, não inclui modInv
  const novo = parseInt(val) || 0
  const base = ESCALA[veiculo.escala].inventarioBase
  veiculo.inventario.offsetPeso = novo - base
  renderInventario(); salvar()
}

window.toggleEquipado = (id, tipo, valor) => {
  const item = veiculo.inventario.itens.find(i => i.id === id)
  if (!item) return
  if (tipo === 'ataque') item.equipadoAtaque = valor
  if (tipo === 'defesa') item.equipadoDefesa = valor
  renderInventario(); salvar()
}

window.removerItem = (id) => {
  const item = veiculo.inventario.itens.find(i => i.id === id)
  veiculo.inventario.itens = veiculo.inventario.itens.filter(i => i.id !== id)
  renderInventario(); salvar()
  _toast(`🗑️ Item "${item?.nome || 'sem nome'}" removido.`, 'aviso')
}

// ── MODAL DE ITEM (idêntico à ficha) ──────────────────────
let _itemEditandoId   = null
let _itemEncantamentos = []
let _itemCategoria     = 1
let _itemRestricoes    = []

window.abrirModalItem = async () => {
  await _carregarPericias()
  _itemEditandoId = null
  document.getElementById('modalItemTitulo').innerText = '🎒 Adicionar Item'
  document.getElementById('itemNome').value      = ''
  document.getElementById('itemDescricao').value = ''
  document.getElementById('itemPeso').value      = '0'; window.syncStepper?.('itemPeso')
  _popularSelectPericias()
  document.getElementById('itemPericia').value = ''
  document.querySelector('input[name="itemCategoria"][value="item"]').checked = true
  document.getElementById('camposEquipamento').style.display   = 'none'
  document.getElementById('itemUsadoAtaque').checked           = false
  document.getElementById('itemUsadoDefesa').checked           = false
  document.getElementById('campoBonusAtaque').style.display    = 'none'
  document.getElementById('campoBonusDefesa').style.display    = 'none'
  document.getElementById('itemBonusAtaque').value             = '0'; window.syncStepper?.('itemBonusAtaque')
  document.getElementById('itemBonusDefesa').value             = '0'; window.syncStepper?.('itemBonusDefesa')
  document.getElementById('itemAlcanceIdeal').value            = 'corpo_a_corpo'
  document.getElementById('itemPrioridadeDefesa').value        = '1'; window.syncStepper?.('itemPrioridadeDefesa')
  const _prvReset = document.getElementById('defesaFinalDisplay')
  if (_prvReset) { _prvReset.textContent = '0'; _prvReset.style.color = '#4ade80' }
  _resetItemEncantamentos()
  const modal = document.getElementById('modalItem')
  modal.style.display = 'flex'; modal.classList.remove('hidden')
}

window.abrirEditarItem = async (id) => {
  await _carregarPericias()
  const item = veiculo.inventario.itens.find(i => i.id === id)
  if (!item) return
  _itemEditandoId = id
  document.getElementById('modalItemTitulo').innerText = '✏️ Editar Item'
  document.getElementById('itemNome').value      = item.nome ?? ''
  document.getElementById('itemDescricao').value = item.descricao ?? ''
  document.getElementById('itemPeso').value      = item.peso ?? 0; window.syncStepper?.('itemPeso')
  _popularSelectPericias()
  document.getElementById('itemPericia').value   = item.pericia ?? ''
  const cat = item.categoria ?? 'item'
  document.querySelector(`input[name="itemCategoria"][value="${cat}"]`).checked = true
  document.getElementById('camposEquipamento').style.display = cat === 'equipamento' ? 'block' : 'none'
  const usaAtk = !!item.usadoAtaque
  document.getElementById('itemUsadoAtaque').checked        = usaAtk
  document.getElementById('campoBonusAtaque').style.display = usaAtk ? 'block' : 'none'
  document.getElementById('itemBonusAtaque').value          = item.bonusAtaque ?? 0; window.syncStepper?.('itemBonusAtaque')
  document.getElementById('itemAlcanceIdeal').value         = item.alcanceIdeal ?? 'corpo_a_corpo'
  const usaDef = !!item.usadoDefesa
  document.getElementById('itemUsadoDefesa').checked        = usaDef
  document.getElementById('campoBonusDefesa').style.display = usaDef ? 'block' : 'none'
  document.getElementById('itemBonusDefesa').value          = item.bonusDefesa ?? 0; window.syncStepper?.('itemBonusDefesa')
  document.getElementById('itemPrioridadeDefesa').value     = item.prioridadeDefesa ?? 1; window.syncStepper?.('itemPrioridadeDefesa')
  _atualizarPreviewPrioridade()
  if (cat === 'equipamento') _carregarItemEncantamentos(item)
  else _resetItemEncantamentos()
  const modal = document.getElementById('modalItem')
  modal.style.display = 'flex'; modal.classList.remove('hidden')
}

window.fecharModalItem = () => {
  const modal = document.getElementById('modalItem')
  if (modal) { modal.style.display = 'none'; modal.classList.add('hidden') }
  _itemEditandoId = null
}

window.fecharModalItemOverlay = (e) => {
  if (e.target === document.getElementById('modalItem')) fecharModalItem()
}

window.toggleCategoriaItem = (val) => {
  document.getElementById('camposEquipamento').style.display = val === 'equipamento' ? 'block' : 'none'
  if (val === 'equipamento') {
    _renderCatInfo(); _renderEncantamentosItem(); _renderRestricoesItem(); _renderRestricaoAutoCategoria()
  }
}

window.toggleBonusAtaque = () => {
  document.getElementById('campoBonusAtaque').style.display =
    document.getElementById('itemUsadoAtaque').checked ? 'block' : 'none'
}

window.toggleBonusDefesa = () => {
  document.getElementById('campoBonusDefesa').style.display =
    document.getElementById('itemUsadoDefesa').checked ? 'block' : 'none'
  _atualizarPreviewPrioridade()
}

function _atualizarPreviewPrioridade() {
  const el    = document.getElementById('defesaFinalDisplay')
  if (!el) return
  const bonus = +document.getElementById('itemBonusDefesa')?.value || 0
  const prio  = Math.max(1, +document.getElementById('itemPrioridadeDefesa')?.value || 1)
  const final = Math.trunc(bonus / prio)
  el.textContent   = (final >= 0 ? '+' : '') + final
  el.style.color       = final < 0 ? '#f87171' : '#4ade80'
  el.style.borderColor = final < 0 ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'
  el.style.background  = final < 0 ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)'
}
window._atualizarPreviewPrioridade = _atualizarPreviewPrioridade

window.confirmarSalvarItem = () => {
  const nome = document.getElementById('itemNome').value.trim()
  if (!nome) { _toast('❌ Digite um nome para o item.', 'erro'); return }
  const pericia = document.getElementById('itemPericia').value
  if (!pericia) { _toast('❌ Selecione uma perícia alvo para o item.', 'erro'); return }
  const cat    = document.querySelector('input[name="itemCategoria"]:checked')?.value ?? 'item'
  const usaAtk = cat === 'equipamento' && document.getElementById('itemUsadoAtaque').checked
  const usaDef = cat === 'equipamento' && document.getElementById('itemUsadoDefesa').checked
  const itemAtual = _itemEditandoId ? veiculo.inventario.itens.find(i => i.id === _itemEditandoId) : null
  const item = {
    nome,
    pericia,
    descricao:       document.getElementById('itemDescricao').value.trim(),
    peso:            +document.getElementById('itemPeso').value || 0,
    categoria:       cat,
    usadoAtaque:     usaAtk,
    usadoDefesa:     usaDef,
    bonusAtaque:     usaAtk ? (+document.getElementById('itemBonusAtaque').value || 0) : 0,
    alcanceIdeal:    usaAtk ? (document.getElementById('itemAlcanceIdeal').value || 'corpo_a_corpo') : null,
    bonusDefesa:     usaDef ? (+document.getElementById('itemBonusDefesa').value || 0) : 0,
    prioridadeDefesa: usaDef ? (Math.max(1, +document.getElementById('itemPrioridadeDefesa').value || 1)) : 1,
    catEquip:        cat === 'equipamento' ? _itemCategoria : null,
    encantamentos:   cat === 'equipamento' ? JSON.parse(JSON.stringify(_itemEncantamentos)) : [],
    restricoes:      cat === 'equipamento' ? JSON.parse(JSON.stringify(_itemRestricoes)) : [],
    equipadoAtaque:  usaAtk ? (itemAtual ? (itemAtual.equipadoAtaque ?? true) : true) : false,
    equipadoDefesa:  usaDef ? (itemAtual ? (itemAtual.equipadoDefesa ?? true) : true) : false,
  }

  if (_itemEditandoId) {
    const idx = veiculo.inventario.itens.findIndex(i => i.id === _itemEditandoId)
    if (idx >= 0) veiculo.inventario.itens[idx] = { id: _itemEditandoId, ...item }
    _toast(`✅ Item "${nome}" atualizado!`, 'sucesso')
  } else {
    veiculo.inventario.itens.push({ id: crypto.randomUUID(), ...item })
    _toast(`✅ Item "${nome}" adicionado!`, 'sucesso')
  }
  fecharModalItem()
  renderInventario(); salvar()
}

// ── ENCANTAMENTOS (idêntico ao app.js) ────────────────────
const ENCANTAMENTOS_LISTA = [
  { id:'abencado',   emoji:'✨', nome:'Abençoado',      custo:1, repetivel:false, incompativel:[],
    desc:'Protege contra Paralisia e condições negativas. Ganho em Defesa e Resistência contra eles.', extra:null },
  { id:'acurado',    emoji:'🎯', nome:'Acurado',         custo:2, repetivel:false, incompativel:['macico'],
    desc:'Acerto crítico em testes de ataque com 5 ou 6. Incompatível com Maciço.', extra:null },
  { id:'alcance',    emoji:'📏', nome:'Alcance',         custo:1, repetivel:true,  incompativel:[],
    desc:'Permite escolher mais 1 categoria de distância como alcance ideal.', extraLabel:'Categoria de distância adicional', extraPlaceholder:'Ex: Longo' },
  { id:'aprimorado', emoji:'💎', nome:'Aprimorado',      custo:1, repetivel:true,  incompativel:[],
    desc:'Aumenta um atributo em situações específicas.', extraLabel:'Atributo / situação', extraPlaceholder:'Ex: Força ao escalar montanhas' },
  { id:'condutor',   emoji:'⚡', nome:'Condutor',        custo:2, repetivel:false, incompativel:[],
    desc:'Enquanto usa o equipamento, todas as suas vantagens custam metade dos PM.', extra:null },
  { id:'elemental',  emoji:'🔮', nome:'Elemental',       custo:1, repetivel:true,  incompativel:[],
    desc:'Ao acertar, teste Poder vs Resistência: +1D do tipo elemental por ponto investido.', extraLabel:'Tipo de dano elemental', extraPlaceholder:'Ex: Fogo' },
  { id:'encantado',  emoji:'✴️', nome:'Encantado',       custo:1, repetivel:true,  incompativel:[],
    desc:'+3 em testes de ataque (arma) ou +3 de Resistência na defesa (armadura). Empilhável até 3×.', extra:null },
  { id:'espiritual', emoji:'👻', nome:'Espiritual',      custo:2, repetivel:false, incompativel:[],
    desc:'A arma ataca o espírito. Causa dano em PM igual à metade do dano em PV.', extra:null },
  { id:'fortificada',emoji:'🏰', nome:'Fortificada',     custo:2, repetivel:false, incompativel:['leve'],
    desc:'Oponentes não conseguem críticos contra você. Incompatível com Leve.', extra:null },
  { id:'leve',       emoji:'🕊️', nome:'Leve',           custo:2, repetivel:false, incompativel:['fortificada'],
    desc:'Acerto crítico com 5 ou 6 em testes de defesa. Incompatível com Fortificada.', extra:null },
  { id:'macico',     emoji:'🔨', nome:'Maciço',          custo:2, repetivel:false, incompativel:['acurado'],
    desc:'No primeiro acerto crítico, Poder somado três vezes ao dano. Incompatível com Acurado.', extra:null },
  { id:'obrapima',   emoji:'🎨', nome:'Obra-Prima',      custo:1, repetivel:false, incompativel:[],
    desc:'Escolha uma perícia. Gaste 3 PM para receber Ganho em testes com ela.', extraLabel:'Perícia potencializada', extraPlaceholder:'Ex: Luta' },
  { id:'fruta',      emoji:'🍎', nome:'Fruta do Desejo', custo:0, repetivel:false, incompativel:['__todos__'],
    desc:'O item "come" uma Fruta do Desejo. Ganha as habilidades da fruta, mas não aceita outros encantamentos.', extra:null },
]

const CAT_INFO = {
  1: { nome:'Comum',    req:'Sem requisitos de perícia.', penalidade:'Nenhuma penalidade.'                             },
  2: { nome:'Incomum',  req:'Sem requisitos de perícia.', penalidade:'Nenhuma penalidade.'                             },
  3: { nome:'Raro',     req:'Treinado na Perícia Alvo.',  penalidade:'Parcial: −50% do bônus sem Treinamento.'         },
  4: { nome:'Épico',    req:'Treinado na Perícia Alvo.',  penalidade:'Total: −100% do bônus sem Treinamento.'          },
  5: { nome:'Lendário', req:'Maestria na Perícia Alvo.',  penalidade:'Híbrida: −50% sem Maestria; −100% sem a Perícia.'},
  6: { nome:'Mítico',   req:'Maestria na Perícia Alvo.',  penalidade:'Total: −100% do bônus sem Maestria.'             },
}

function _criarMiniModalSeNecessario() {
  if (document.getElementById('miniModalEnc')) return
  const el = document.createElement('div')
  el.id = 'miniModalEnc'
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;'
  el.innerHTML = `
    <div style="background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:14px;padding:24px;width:min(380px,92vw);display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 60px rgba(0,0,0,0.6)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 id="miniModalEncTitulo" style="font-size:15px;color:#e2e8f0;margin:0"></h3>
        <button onclick="document.getElementById('miniModalEnc').style.display='none'" style="background:transparent;border:1px solid #475569;color:#94a3b8;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px">✕</button>
      </div>
      <p id="miniModalEncDesc" style="font-size:12px;opacity:0.6;margin:0;line-height:1.5"></p>
      <div>
        <label id="miniModalEncLabel" style="font-size:12px;opacity:0.75;display:block;margin-bottom:6px"></label>
        <input id="miniModalEncInput" style="width:100%;padding:9px 12px;background:var(--bg-base,#0f172a);border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none" />
      </div>
      <div style="display:flex;gap:8px">
        <button id="miniModalEncConfirmar" style="flex:1;padding:10px;background:#22c55e;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">✅ Confirmar</button>
        <button onclick="document.getElementById('miniModalEnc').style.display='none'" style="flex:1;padding:10px;background:#475569;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
      </div>
    </div>`
  document.body.appendChild(el)
}

function _pedirExtraInfo(enc, callback) {
  _criarMiniModalSeNecessario()
  const modal = document.getElementById('miniModalEnc')
  document.getElementById('miniModalEncTitulo').textContent = `${enc.emoji} ${enc.nome}`
  document.getElementById('miniModalEncDesc').textContent   = enc.desc
  document.getElementById('miniModalEncLabel').textContent  = enc.extraLabel ?? 'Detalhe'
  const input = document.getElementById('miniModalEncInput')
  input.placeholder = enc.extraPlaceholder ?? ''; input.value = ''
  modal.style.display = 'flex'; setTimeout(() => input.focus(), 50)
  const confirmar    = document.getElementById('miniModalEncConfirmar')
  const novoConfirmar = confirmar.cloneNode(true)
  confirmar.parentNode.replaceChild(novoConfirmar, confirmar)
  novoConfirmar.onclick = () => {
    const val = input.value.trim()
    if (!val) { input.style.borderColor = '#ef4444'; return }
    input.style.borderColor = '#334155'; modal.style.display = 'none'; callback(val)
  }
  input.onkeydown = (e) => { if (e.key === 'Enter') novoConfirmar.click() }
}

function _criarMiniModalRestricaoSeNecessario() {
  if (document.getElementById('miniModalRestricao')) return
  const el = document.createElement('div')
  el.id = 'miniModalRestricao'
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;'
  el.innerHTML = `
    <div style="background:var(--bg-card,#1e293b);border:1px solid #334155;border-radius:14px;padding:24px;width:min(400px,92vw);display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 60px rgba(0,0,0,0.6)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="font-size:15px;color:#e2e8f0;margin:0">🔒 Nova Restrição</h3>
        <button onclick="document.getElementById('miniModalRestricao').style.display='none'" style="background:transparent;border:1px solid #475569;color:#94a3b8;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px">✕</button>
      </div>
      <div>
        <label style="font-size:12px;opacity:0.75;display:block;margin-bottom:6px">Descrição da restrição</label>
        <input id="restricaoTextoInput" placeholder="Ex: Requer bateria carregada para funcionar" style="width:100%;padding:9px 12px;background:var(--bg-base,#0f172a);border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none" />
      </div>
      <div>
        <label style="font-size:12px;opacity:0.75;display:block;margin-bottom:8px">Tipo de restrição</label>
        <div style="display:flex;gap:8px">
          <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-base,#0f172a);border:1px solid #334155;border-radius:8px;cursor:pointer;font-size:13px">
            <input type="radio" name="restricaoTipoModal" value="parcial" checked style="accent-color:#fbbf24;width:14px;height:14px">
            <span>🟡 Parcial <span style="opacity:0.55;font-size:11px">(−50%)</span></span>
          </label>
          <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-base,#0f172a);border:1px solid #334155;border-radius:8px;cursor:pointer;font-size:13px">
            <input type="radio" name="restricaoTipoModal" value="total" style="accent-color:#f87171;width:14px;height:14px">
            <span>🔴 Total <span style="opacity:0.55;font-size:11px">(−100%)</span></span>
          </label>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button id="restricaoConfirmarBtn" style="flex:1;padding:10px;background:#22c55e;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">✅ Adicionar</button>
        <button onclick="document.getElementById('miniModalRestricao').style.display='none'" style="flex:1;padding:10px;background:#475569;border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
      </div>
    </div>`
  document.body.appendChild(el)
}

window.selecionarCatEquip = (cat) => {
  _itemCategoria = cat
  document.querySelectorAll('.cat-equip-btn').forEach(b => b.classList.toggle('active', +b.dataset.cat === cat))
  _renderCatInfo(); _renderEncantamentosItem(); _renderRestricaoAutoCategoria()
}

function _renderCatInfo() {
  const info = CAT_INFO[_itemCategoria]
  const el   = document.getElementById('catEquipInfo')
  if (!el) return
  el.innerHTML = `<strong>Cat. ${_itemCategoria} — ${info.nome}</strong> &nbsp;·&nbsp; ${info.req} &nbsp;·&nbsp; <span style="opacity:0.75">${info.penalidade}</span>`
  const contador = document.getElementById('encantamentosContador')
  if (contador) {
    contador.textContent = `${_itemEncantamentos.length} / ${_itemCategoria}`
    contador.style.color = _itemEncantamentos.length >= _itemCategoria ? '#f87171' : '#64748b'
  }
}

function _renderEncantamentosItem() {
  const lista = document.getElementById('listaEncantamentosItem')
  if (!lista) return
  lista.innerHTML = ''
  const temFruta = _itemEncantamentos.some(e => e.id === 'fruta')
  _itemEncantamentos.forEach((enc, idx) => {
    const chip = document.createElement('div')
    chip.className = 'encantamento-chip'
    chip.innerHTML = `
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span class="encantamento-chip-nome">${enc.emoji} ${enc.nome}</span>
          ${enc.custo > 0 ? `<span class="encantamento-chip-custo">+${enc.custo} PT</span>` : ''}
          ${enc.extra ? `<span style="font-size:11px;color:#94a3b8;background:#0f172a;border:1px solid #334155;padding:1px 6px;border-radius:4px">${enc.extra}</span>` : ''}
        </div>
        <div style="font-size:11px;opacity:0.5;margin-top:3px;line-height:1.4">${enc.desc}</div>
      </div>
      <button class="encantamento-chip-remover" onclick="_removerEncantamentoItem(${idx})" title="Remover">✕</button>`
    lista.appendChild(chip)
  })
  const btn = document.getElementById('btnAdicionarEncantamento')
  const podeAdicionar = !temFruta && _itemEncantamentos.length < _itemCategoria
  if (btn) btn.style.display = podeAdicionar ? 'block' : 'none'
  const contador = document.getElementById('encantamentosContador')
  if (contador) {
    contador.textContent = `${_itemEncantamentos.length} / ${_itemCategoria}`
    contador.style.color = _itemEncantamentos.length >= _itemCategoria ? '#f87171' : '#64748b'
  }
}

window._removerEncantamentoItem = (idx) => {
  _itemEncantamentos.splice(idx, 1)
  _renderEncantamentosItem()
  const painel = document.getElementById('painelSeletorEncantamento')
  if (painel && painel.style.display !== 'none') _renderOpcoesEncantamento()
}

window.abrirSeletorEncantamento = () => {
  const painel = document.getElementById('painelSeletorEncantamento')
  if (!painel) return
  painel.style.display = 'block'; _renderOpcoesEncantamento()
}

window.fecharSeletorEncantamento = () => {
  const painel = document.getElementById('painelSeletorEncantamento')
  if (painel) painel.style.display = 'none'
}

function _renderOpcoesEncantamento() {
  const lista = document.getElementById('listaOpcoesEncantamento')
  if (!lista) return
  lista.innerHTML = ''
  const temFruta     = _itemEncantamentos.some(e => e.id === 'fruta')
  const idsPresentes = _itemEncantamentos.map(e => e.id)
  const cheio        = _itemEncantamentos.length >= _itemCategoria

  ENCANTAMENTOS_LISTA.forEach(enc => {
    let bloqueado = false, motivo = ''
    if (enc.id === 'fruta' && _itemEncantamentos.length > 0) {
      bloqueado = true; motivo = 'Remove todos os outros encantamentos ao adicionar'
    } else if (temFruta && enc.id !== 'fruta') {
      bloqueado = true; motivo = 'Item com Fruta não aceita outros encantamentos'
    } else if (!enc.repetivel && idsPresentes.includes(enc.id)) {
      bloqueado = true; motivo = 'Já adicionado (não repetível)'
    } else {
      const incompat = enc.incompativel.find(i => i !== '__todos__' && idsPresentes.includes(i))
      if (incompat) {
        const nomeInc = ENCANTAMENTOS_LISTA.find(e => e.id === incompat)?.nome ?? incompat
        bloqueado = true; motivo = `Incompatível com ${nomeInc}`
      }
    }
    if (cheio && !bloqueado) { bloqueado = true; motivo = 'Limite de encantamentos atingido (aumente a Categoria)' }
    const div = document.createElement('div')
    div.className = 'enc-opcao' + (bloqueado ? ' desabilitado' : '')
    div.innerHTML = `
      <div class="enc-opcao-header">
        <span class="enc-opcao-nome">${enc.emoji} ${enc.nome}</span>
        ${enc.custo > 0 ? `<span class="enc-opcao-custo">+${enc.custo} PT</span>` : '<span style="font-size:11px;color:#64748b">grátis</span>'}
      </div>
      <div class="enc-opcao-desc">${enc.desc}</div>
      ${bloqueado ? `<div class="enc-opcao-incompat">⛔ ${motivo}</div>` : ''}`
    if (!bloqueado) div.onclick = () => _selecionarEncantamento(enc)
    lista.appendChild(div)
  })
}

function _selecionarEncantamento(enc) {
  const _finalizar = (extra) => {
    if (enc.id === 'fruta') _itemEncantamentos = [{ ...enc, extra }]
    else _itemEncantamentos.push({ ...enc, extra })
    fecharSeletorEncantamento(); _renderEncantamentosItem()
  }
  if (enc.extraLabel) _pedirExtraInfo(enc, (val) => _finalizar(val))
  else _finalizar(null)
}

window.adicionarRestricaoItem = () => {
  _criarMiniModalRestricaoSeNecessario()
  const modal = document.getElementById('miniModalRestricao')
  const input = document.getElementById('restricaoTextoInput')
  input.value = ''; input.style.borderColor = '#334155'
  const radios = modal.querySelectorAll('input[name="restricaoTipoModal"]')
  if (radios[0]) radios[0].checked = true
  modal.style.display = 'flex'; setTimeout(() => input.focus(), 50)
  const confirmar    = document.getElementById('restricaoConfirmarBtn')
  const novoConfirmar = confirmar.cloneNode(true)
  confirmar.parentNode.replaceChild(novoConfirmar, confirmar)
  novoConfirmar.onclick = () => {
    const texto = input.value.trim()
    if (!texto) { input.style.borderColor = '#ef4444'; return }
    const tipo = modal.querySelector('input[name="restricaoTipoModal"]:checked')?.value ?? 'parcial'
    _itemRestricoes.push({ tipo, texto })
    modal.style.display = 'none'; _renderRestricoesItem()
  }
  input.onkeydown = (e) => { if (e.key === 'Enter') novoConfirmar.click() }
}

window._removerRestricaoItem = (idx) => {
  _itemRestricoes.splice(idx, 1); _renderRestricoesItem()
}

function _renderRestricoesItem() {
  const lista = document.getElementById('listaRestricoesItem')
  if (!lista) return
  lista.innerHTML = ''
  _itemRestricoes.forEach((r, idx) => {
    const chip = document.createElement('div')
    chip.className = 'restricao-chip'
    chip.innerHTML = `
      <div class="restricao-chip-header">
        <span class="${r.tipo === 'total' ? 'restricao-chip-tipo-total' : 'restricao-chip-tipo-parcial'}">
          ${r.tipo === 'total' ? '🔴 Restrição Total (−100% bônus)' : '🟡 Restrição Parcial (−50% bônus)'}
        </span>
        <button class="restricao-chip-remover" onclick="_removerRestricaoItem(${idx})" title="Remover">✕</button>
      </div>
      <div class="restricao-chip-texto">${r.texto}</div>`
    lista.appendChild(chip)
  })
}

function _renderRestricaoAutoCategoria() {
  const el = document.getElementById('restricaoCategoriaAuto')
  if (!el) return
  const info = CAT_INFO[_itemCategoria]
  el.innerHTML = `📋 <strong>Requisito automático (Cat. ${_itemCategoria}):</strong> ${info.req} → <em>${info.penalidade}</em>`
}

function _resetItemEncantamentos() {
  _itemEncantamentos = []; _itemCategoria = 1; _itemRestricoes = []
  document.querySelectorAll('.cat-equip-btn').forEach(b => b.classList.toggle('active', +b.dataset.cat === 1))
  _renderCatInfo(); _renderEncantamentosItem(); _renderRestricoesItem(); _renderRestricaoAutoCategoria()
  fecharSeletorEncantamento()
}

function _carregarItemEncantamentos(item) {
  _itemEncantamentos = item.encantamentos ? JSON.parse(JSON.stringify(item.encantamentos)) : []
  _itemCategoria     = item.catEquip ?? 1
  _itemRestricoes    = item.restricoes ? JSON.parse(JSON.stringify(item.restricoes)) : []
  document.querySelectorAll('.cat-equip-btn').forEach(b => b.classList.toggle('active', +b.dataset.cat === _itemCategoria))
  _renderCatInfo(); _renderEncantamentosItem(); _renderRestricoesItem(); _renderRestricaoAutoCategoria()
  fecharSeletorEncantamento()
}

// Botão cancelar em enc/restricoes
window.enc_cancelar = window.enc_cancelar || (() => {})

// ── TOAST ─────────────────────────────────────────────────
function _toast(msg, tipo = 'info') {
  const c = document.getElementById('toastContainer')
  if (!c) return
  const ICONES = { info: 'ℹ️', sucesso: '✅', erro: '❌', aviso: '⚠️' }
  const tipoNorm = tipo === 'warn' ? 'aviso' : tipo
  const t = document.createElement('div')
  t.className = `toast toast-${tipoNorm}`
  t.innerHTML = `
    <span class="toast-icon">${ICONES[tipoNorm] ?? 'ℹ️'}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`
  c.appendChild(t)
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('toast-visible')))
  const dur = tipoNorm === 'erro' ? 5000 : tipoNorm === 'aviso' ? 4000 : 3000
  setTimeout(() => { t.classList.remove('toast-visible'); setTimeout(() => t.remove(), 300) }, dur)
}

// ── HELPERS ───────────────────────────────────────────────
function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── REFERÊNCIAS DO DOM ────────────────────────────────────
const vSalvoLabel = document.getElementById('vSalvoLabel')

// ── INIT ──────────────────────────────────────────────────
// ── COR TEMA (idêntico à ficha de personagem) ─────────────
function _hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255
  let g = parseInt(hex.slice(3,5),16)/255
  let b = parseInt(hex.slice(5,7),16)/255
  const max=Math.max(r,g,b), min=Math.min(r,g,b)
  let h,s, l=(max+min)/2
  if (max===min) { h=s=0 } else {
    const d=max-min
    s = l>0.5 ? d/(2-max-min) : d/(max+min)
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break
      case g: h=((b-r)/d+2)/6; break
      case b: h=((r-g)/d+4)/6; break
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)]
}
function _darken(hex, factor) {
  const r=parseInt(hex.slice(1,3),16)
  const g=parseInt(hex.slice(3,5),16)
  const b=parseInt(hex.slice(5,7),16)
  const d=(v)=>Math.round(v*factor).toString(16).padStart(2,'0')
  return `#${d(r)}${d(g)}${d(b)}`
}
function _aplicarCorTema(cor) {
  const c = cor || '#3b82f6'
  const [h, s] = _hexToHsl(c)
  const sat = Math.min(s * 0.35, 25)
  document.documentElement.style.setProperty('--cor-tema',      c)
  document.documentElement.style.setProperty('--cor-tema-dark', _darken(c, 0.7))
  document.documentElement.style.setProperty('--cor-tema-dim',  c + '22')
  document.documentElement.style.setProperty('--cor-tema-mid',  c + '55')
  // Paleta de fundo derivada da matiz — igual à ficha de personagem
  document.documentElement.style.setProperty('--bg-deepest', `hsl(${h},${sat}%,2%)`)
  document.documentElement.style.setProperty('--bg-base',    `hsl(${h},${sat}%,7%)`)
  document.documentElement.style.setProperty('--bg-deep',    `hsl(${h},${sat}%,4%)`)
  document.documentElement.style.setProperty('--bg-card',    `hsl(${h},${sat}%,13%)`)
  document.documentElement.style.setProperty('--bg-input',   `hsl(${h},${sat}%,10%)`)
  document.documentElement.style.setProperty('--bg-darker',  `hsl(${h},${sat}%,5%)`)
  document.documentElement.style.setProperty('--bg-hover',   `hsl(${h},${sat}%,17%)`)
  document.documentElement.style.setProperty('--bg-accent',  `hsl(${h},${Math.min(s*0.5,35)}%,18%)`)
  document.documentElement.style.setProperty('--border',     `hsl(${h},${sat}%,20%)`)
  document.documentElement.style.setProperty('--border-dim', `hsl(${h},${sat}%,12%)`)
  document.body.style.background = `linear-gradient(135deg, hsl(${h},${sat}%,7%), hsl(${h},${sat}%,2%))`
}

function _bindCorTema() {
  const input = document.getElementById('vCorInput')
  const wrap  = document.getElementById('vCorWrap')
  if (!input) return
  const cor = veiculo.corTema ?? '#3b82f6'
  input.value = cor
  _aplicarCorTema(cor)
  if (!_vDono) { if(wrap){wrap.style.opacity='0.4';wrap.style.pointerEvents='none'} return }
  input.addEventListener('input',  () => { veiculo.corTema = input.value; _aplicarCorTema(input.value) })
  input.addEventListener('change', () => { veiculo.corTema = input.value; _aplicarCorTema(input.value); salvar() })
}

// ── RETRATO ──────────────────────────────────────────────
function _gerarThumb(base64, tam=80) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = tam; c.height = tam
      const ctx = c.getContext('2d')
      const lado = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width-lado)/2, (img.height-lado)/2, lado, lado, 0, 0, tam, tam)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.src = base64
  })
}

function _abrirCropModal(src, onConfirm) {
  document.getElementById('vCropModal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'vCropModal'
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999'
  const VP = 260
  modal.innerHTML = `
    <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:16px;max-width:min(480px,92vw);width:100%">
      <p style="color:#f1f5f9;font-size:15px;font-weight:600;margin:0">✂️ Ajustar Retrato</p>
      <p style="color:#94a3b8;font-size:12px;margin:0">Arraste para posicionar. A área circular será o retrato.</p>
      <div id="vCropVP" style="position:relative;width:${VP}px;height:${VP}px;border-radius:50%;overflow:hidden;border:3px solid var(--cor-tema,#3b82f6);align-self:center;cursor:grab;background:#000;flex-shrink:0">
        <img id="vCropImg" src="${src}" draggable="false" style="position:absolute;user-select:none;max-width:none"/>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;color:#64748b">🔍</span>
        <input type="range" id="vCropZoom" min="50" max="300" value="100" style="flex:1;accent-color:var(--cor-tema,#3b82f6)">
        <span id="vCropZoomLbl" style="font-size:12px;color:#64748b">100%</span>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="vCropCancel" style="padding:8px 18px;border:1px solid #334155;background:#1e293b;color:#94a3b8;border-radius:8px;cursor:pointer;font-size:13px">Cancelar</button>
        <button id="vCropOk"     style="padding:8px 18px;border:none;background:var(--cor-tema,#1d4ed8);color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Usar Retrato</button>
      </div>
    </div>`
  document.body.appendChild(modal)

  const vp=document.getElementById('vCropVP'), img=document.getElementById('vCropImg')
  const zr=document.getElementById('vCropZoom'), zl=document.getElementById('vCropZoomLbl')
  let scale=1, ox=0, oy=0, drag=false, sx=0, sy=0, sox=0, soy=0

  function clamp() {
    const w=img.naturalWidth*scale, h=img.naturalHeight*scale
    ox=Math.min(0,Math.max(VP-w,ox)); oy=Math.min(0,Math.max(VP-h,oy))
  }
  function apply() {
    img.style.width=(img.naturalWidth*scale)+'px'; img.style.height=(img.naturalHeight*scale)+'px'
    img.style.left=ox+'px'; img.style.top=oy+'px'
  }
  img.onload = () => {
    const s = Math.max(VP/img.naturalWidth, VP/img.naturalHeight)
    scale = s; ox=(VP-img.naturalWidth*s)/2; oy=(VP-img.naturalHeight*s)/2; apply()
  }
  zr.oninput = () => {
    const ns = parseFloat(zr.value)/100 * Math.max(VP/img.naturalWidth, VP/img.naturalHeight)
    const cx=(VP/2-ox)/scale, cy=(VP/2-oy)/scale
    scale=ns; ox=VP/2-cx*scale; oy=VP/2-cy*scale; clamp(); apply()
    zl.textContent = zr.value+'%'
  }
  vp.onmousedown = e => { drag=true; sx=e.clientX; sy=e.clientY; sox=ox; soy=oy; vp.style.cursor='grabbing' }
  document.onmousemove = e => { if(!drag) return; ox=sox+(e.clientX-sx); oy=soy+(e.clientY-sy); clamp(); apply() }
  document.onmouseup = () => { drag=false; vp.style.cursor='grab' }
  document.getElementById('vCropCancel').onclick = () => modal.remove()
  document.getElementById('vCropOk').onclick = () => {
    const c=document.createElement('canvas'); c.width=VP; c.height=VP
    c.getContext('2d').drawImage(img, -ox, -oy, img.naturalWidth*scale, img.naturalHeight*scale)
    modal.remove(); onConfirm(c.toDataURL('image/jpeg',0.85))
  }
}

function _bindRetrato() {
  const grande = document.getElementById('vRetratoGrande')
  const input  = document.getElementById('vRetratoInput')
  const btnEd  = document.getElementById('vRetratoBtnEditar')
  const btnDel = document.getElementById('vRetratoBtnRemover')
  if (!grande || !input) return

  function _atualizar() {
    if (veiculo.imagemUrl) {
      grande.style.backgroundImage = `url('${veiculo.imagemUrl}')`
      grande.style.fontSize = '0'; grande.textContent = ''
      if (btnDel) btnDel.style.display = 'flex'
    } else {
      grande.style.backgroundImage = ''; grande.style.fontSize = ''
      grande.textContent = '🚢'
      if (btnDel) btnDel.style.display = 'none'
    }
    if (btnEd) btnEd.style.display = _vDono ? 'flex' : 'none'
  }
  _atualizar()
  if (!_vDono) return
  grande.addEventListener('click', () => input.click())
  if (btnEd) btnEd.addEventListener('click', () => input.click())
  if (btnDel) btnDel.addEventListener('click', e => {
    e.stopPropagation(); veiculo.imagemUrl = null; _atualizar(); salvar()
  })
  input.addEventListener('change', () => {
    const file = input.files[0]; if (!file) return; input.value = ''
    const reader = new FileReader()
    reader.onload = ev => _abrirCropModal(ev.target.result, async url => {
      veiculo.imagemUrl = url
      veiculo.imagemThumb = await _gerarThumb(url, 80)
      _atualizar(); salvar()
    })
    reader.readAsDataURL(file)
  })
}

// ── VISIBILIDADE ──────────────────────────────────────────
let _vDono       = true
let _vOwnerUid   = null
let _vEraPublica = false

function _renderVisibilidade() {
  const bloco   = document.getElementById('vVisibBloco')
  const chkPub  = document.getElementById('vTogglePublico')
  const chkEdit = document.getElementById('vToggleEditPublic')
  const hintPub = document.getElementById('vHintPublico')
  const hintEd  = document.getElementById('vHintEditPublic')
  const rowEd   = document.getElementById('vRowEditPublic')
  const banner  = document.getElementById('vBannerLeitura')

  if (!_vDono) {
    if (bloco)  bloco.style.display = 'none'
    if (banner) banner.style.display = veiculo.editPublic ? 'none' : 'block'
    _bloquearEdicao()
    return
  }
  if (bloco)  bloco.style.display = 'block'
  if (banner) banner.style.display = 'none'

  const isPub  = veiculo.isPublic  ?? false
  const isEdit = veiculo.editPublic ?? false
  if (chkPub)  chkPub.checked  = isPub
  if (chkEdit) chkEdit.checked = isEdit
  if (hintPub) hintPub.textContent = isPub  ? 'Visível para todos' : 'Apenas você'
  if (hintEd)  hintEd.textContent  = isEdit ? 'Todos podem editar' : 'Só visualizar'
  if (rowEd) { rowEd.style.opacity = isPub ? '1' : '0.4'; rowEd.style.pointerEvents = isPub ? 'auto' : 'none' }
}

function _bloquearEdicao() {
  if (_vDono || veiculo.editPublic) return
  // Desabilitar todos os controles interativos
  document.querySelectorAll('button:not(.btn-voltar), input:not([type="file"]), select, textarea, [contenteditable]')
    .forEach(el => {
      if (el.tagName === 'INPUT' && el.type === 'file') return
      el.disabled = true
      if (el.hasAttribute('contenteditable')) el.setAttribute('contenteditable', 'false')
    })
}

window.toggleVisibV = async (campo, valor) => {
  veiculo[campo] = valor
  _renderVisibilidade()
  await salvar()
  _toast(campo === 'isPublic'
    ? (valor ? '🌐 Ficha tornada pública.' : '🔒 Ficha tornada privada.')
    : (valor ? '✏️ Edição pública ativada.' : '👁️ Somente visualização ativada.'), 'info')
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  await inicializarFirebase()
  await aguardarAuth()
  await _carregarPericias()

  const params = new URLSearchParams(location.search)
  const id     = params.get('id')
  const user   = getUser()

  if (id) {
    // 1. Tentar carregar do Firebase como dono
    if (user && estaConfigurado()) {
      try {
        const db  = getDb()
        const fns = getFirebaseFns()
        if (db && fns) {
          const snap = await fns.getDoc(fns.doc(db, 'users', user.uid, 'veiculos', id))
          if (snap.exists()) {
            veiculo       = { ..._novoVeiculo(), ...snap.data() }
            _vDono        = true
            _vOwnerUid    = user.uid
            _vEraPublica  = veiculo.isPublic ?? false
            // Sincronizar localStorage
            localStorage.setItem(`veiculo_${id}`, JSON.stringify(veiculo))
          }
        }
      } catch(e) { console.warn('[Firestore] erro ao carregar veículo:', e) }
    }

    // 2. Tentar localStorage (cache ou offline)
    if (!_vOwnerUid && carregar(id)) {
      _vDono       = true
      _vOwnerUid   = user?.uid ?? null
      _vEraPublica = veiculo.isPublic ?? false
    }

    // 3. Tentar como visitante — public_index
    if (!_vOwnerUid && estaConfigurado()) {
      const publica = await _carregarVeiculoPublico(id)
      if (publica) {
        veiculo      = { ..._novoVeiculo(), ...publica }
        _vDono       = !!(user && publica._ownerUid === user.uid)
        _vOwnerUid   = publica._ownerUid ?? null
        _vEraPublica = true
      } else {
        // Não encontrado e não público
        document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#94a3b8">
          <div style="font-size:48px">🔒</div>
          <div style="font-size:18px;font-weight:700;color:#f1f5f9">Veículo não encontrado</div>
          <div style="font-size:14px">Esta ficha é privada ou não existe.</div>
          <a href="index.html" style="padding:10px 20px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#93c5fd;text-decoration:none;font-size:14px">← Voltar</a>
        </div>`
        return
      }
    }

    // 4. Fallback — id na URL mas não encontrou em lugar nenhum: criar novo com esse id
    if (!_vOwnerUid) {
      _vDono     = true
      _vOwnerUid = user?.uid ?? null
      veiculo.id = id
      const d = derivados()
      veiculo.hpAtual = d.hpMax
    }
  } else {
    // Sem id: nova ficha
    _vDono     = true
    _vOwnerUid = user?.uid ?? null
    const d = derivados()
    veiculo.hpAtual = d.hpMax
  }

  _aplicarCorTema(veiculo.corTema ?? '#3b82f6')
  renderTudo()
  _bindCorTema()
  _bindRetrato()
  _renderVisibilidade()

  // Listener em tempo real (Firestore onSnapshot)
  if (estaConfigurado() && _vOwnerUid && veiculo.id) {
    const db  = getDb()
    const fns = getFirebaseFns()
    if (db && fns?.onSnapshot) {
      const ref = fns.doc(db, 'users', _vOwnerUid, 'veiculos', veiculo.id)
      fns.onSnapshot(ref, (snap) => {
        if (!snap.exists()) return
        const remoto = snap.data()
        // Só atualiza se veio de outro cliente (evitar loop do próprio save)
        if (!_vDono || !document.hasFocus()) {
          veiculo = { ..._novoVeiculo(), ...remoto }
          _aplicarCorTema(veiculo.corTema ?? '#3b82f6')
          renderTudo()
          _bindRetrato()
          _renderVisibilidade()
        }
      }, (err) => { console.warn('[onSnapshot]', err) })
    }
  }

  document.getElementById('vNome').addEventListener('input', (e) => {
    veiculo.nome = e.target.value; salvar()
  })
}

async function _carregarVeiculoPublico(fichaId) {
  if (!estaConfigurado()) return null
  try {
    const db  = getDb()
    const fns = getFirebaseFns()
    if (!db || !fns) return null
    const idxSnap = await fns.getDoc(fns.doc(db, 'public_index', fichaId))
    if (!idxSnap.exists()) return null
    const { ownerUid } = idxSnap.data()
    if (!ownerUid) return null
    const snap = await fns.getDoc(fns.doc(db, 'users', ownerUid, 'veiculos', fichaId))
    if (!snap.exists()) return null
    const data = snap.data()
    return data.isPublic ? { ...data, _ownerUid: ownerUid } : null
  } catch(e) { console.warn('[Firestore] carregar veículo público:', e); return null }
}

init()
