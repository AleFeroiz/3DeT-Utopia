// ============================================================
//  diceRoller.js — Gaveta de rolagem de dados
//  Sem persistência. Apenas UI + lógica de rolagem.
// ============================================================

const DADOS = [4, 6, 8, 10, 12, 20]

// Estado local
const _qtd = {}
DADOS.forEach(d => _qtd[d] = 0)

let _aberta = false

// ── Bootstrap ─────────────────────────────────────────────

export function inicializarDiceRoller() {
  _injetarHTML()
  _injetarCSS()
  _bindEventos()
}

// ── HTML ──────────────────────────────────────────────────

function _injetarHTML() {
  const wrap = document.createElement('div')
  wrap.id = 'diceRollerWrap'
  wrap.innerHTML = `
    <button id="diceRollerBtn" title="Rolar Dados" aria-label="Abrir rolador de dados">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    </button>

    <div id="diceRollerGaveta" aria-hidden="true">
      <div id="diceRollerResultado">
        <div id="diceResultTotal">—</div>
        <div id="diceResultDetalhes"></div>
      </div>

      <div id="diceRollerDados">
        ${DADOS.map(d => `
          <div class="dice-row" data-dado="${d}">
            <span class="dice-label">D${d}</span>
            <div class="dice-controles">
              <button class="dice-btn-menos" data-dado="${d}" aria-label="Remover D${d}">−</button>
              <span class="dice-qtd" id="diceQtd${d}">0</span>
              <button class="dice-btn-mais" data-dado="${d}" aria-label="Adicionar D${d}">+</button>
            </div>
          </div>
        `).join('')}
      </div>

      <button id="diceRolarBtn">Rolar</button>
    </div>
  `
  document.body.appendChild(wrap)
}

// ── CSS ───────────────────────────────────────────────────

function _injetarCSS() {
  const style = document.createElement('style')
  style.textContent = `
    /* ── Botão flutuante ── */
    #diceRollerWrap {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    #diceRollerBtn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(59,130,246,0.45);
      transition: transform 0.18s, background 0.18s, box-shadow 0.18s;
      order: 2;
      flex-shrink: 0;
    }
    #diceRollerBtn:hover {
      background: #2563eb;
      transform: scale(1.08);
      box-shadow: 0 6px 18px rgba(59,130,246,0.55);
    }
    #diceRollerBtn:active { transform: scale(0.95); }
    #diceRollerBtn.aberto { background: #475569; box-shadow: none; }
    #diceRollerBtn svg { width: 22px; height: 22px; }

    /* ── Gaveta ── */
    #diceRollerGaveta {
      order: 1;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 14px 16px;
      width: 210px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      gap: 10px;
      transform-origin: bottom left;
      animation: diceGavetaOpen 0.2s ease;
    }
    #diceRollerGaveta.aberta { display: flex; }

    @keyframes diceGavetaOpen {
      from { opacity: 0; transform: scale(0.9) translateY(6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── Resultado ── */
    #diceRollerResultado {
      background: #0f172a;
      border-radius: 10px;
      padding: 10px 12px;
      text-align: center;
      min-height: 58px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    #diceResultTotal {
      font-size: 26px;
      font-weight: 700;
      color: #f1f5f9;
      line-height: 1;
    }
    #diceResultDetalhes {
      font-size: 11px;
      color: #94a3b8;
      word-break: break-all;
      min-height: 14px;
    }

    /* ── Linhas de dado ── */
    #diceRollerDados {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dice-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dice-label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      width: 32px;
    }
    .dice-controles {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dice-btn-menos,
    .dice-btn-mais {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: none;
      background: #334155;
      color: white;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .dice-btn-menos:hover { background: #ef4444; }
    .dice-btn-mais:hover  { background: #22c55e; }
    .dice-btn-menos:active,
    .dice-btn-mais:active  { transform: scale(0.92); }
    .dice-qtd {
      min-width: 22px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .dice-row.ativo .dice-label { color: #60a5fa; }
    .dice-row.ativo .dice-qtd   { color: #60a5fa; }

    /* ── Botão rolar ── */
    #diceRolarBtn {
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: white;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      letter-spacing: 0.03em;
    }
    #diceRolarBtn:hover  { background: #2563eb; }
    #diceRolarBtn:active { transform: scale(0.97); }
    #diceRolarBtn:disabled {
      background: #334155;
      color: #64748b;
      cursor: not-allowed;
    }

    /* ── Animação de resultado ── */
    @keyframes dicePop {
      0%   { transform: scale(0.7); opacity: 0; }
      60%  { transform: scale(1.1); }
      100% { transform: scale(1);   opacity: 1; }
    }
    .dice-resultado-pop {
      animation: dicePop 0.28s ease;
    }
  `
  document.head.appendChild(style)
}

// ── Eventos ───────────────────────────────────────────────

function _bindEventos() {
  const btn    = document.getElementById('diceRollerBtn')
  const gaveta = document.getElementById('diceRollerGaveta')
  const rolar  = document.getElementById('diceRolarBtn')

  btn.addEventListener('click', () => {
    _aberta = !_aberta
    gaveta.classList.toggle('aberta', _aberta)
    gaveta.setAttribute('aria-hidden', String(!_aberta))
    btn.classList.toggle('aberto', _aberta)
  })

  // Fechar clicando fora
  document.addEventListener('click', e => {
    if (_aberta && !document.getElementById('diceRollerWrap').contains(e.target)) {
      _aberta = false
      gaveta.classList.remove('aberta')
      gaveta.setAttribute('aria-hidden', 'true')
      btn.classList.remove('aberto')
    }
  })

  // + / - por dado
  document.querySelectorAll('.dice-btn-mais').forEach(b => {
    b.addEventListener('click', () => _mudarQtd(+b.dataset.dado, 1))
  })
  document.querySelectorAll('.dice-btn-menos').forEach(b => {
    b.addEventListener('click', () => _mudarQtd(+b.dataset.dado, -1))
  })

  rolar.addEventListener('click', _rolar)
}

function _mudarQtd(dado, delta) {
  _qtd[dado] = Math.max(0, (_qtd[dado] ?? 0) + delta)
  const el = document.getElementById(`diceQtd${dado}`)
  if (el) el.textContent = _qtd[dado]
  const row = document.querySelector(`.dice-row[data-dado="${dado}"]`)
  if (row) row.classList.toggle('ativo', _qtd[dado] > 0)
  _atualizarBotaoRolar()
}

function _atualizarBotaoRolar() {
  const btn = document.getElementById('diceRolarBtn')
  const temAlgum = DADOS.some(d => _qtd[d] > 0)
  if (btn) btn.disabled = !temAlgum
}

function _rolar() {
  const resultados = []

  DADOS.forEach(d => {
    for (let i = 0; i < _qtd[d]; i++) {
      resultados.push({ dado: d, valor: Math.floor(Math.random() * d) + 1 })
    }
  })

  if (!resultados.length) return

  const total = resultados.reduce((s, r) => s + r.valor, 0)

  // Agrupa detalhes por tipo de dado: "D6[3,5] D4[2]"
  const grupos = {}
  resultados.forEach(r => {
    if (!grupos[r.dado]) grupos[r.dado] = []
    grupos[r.dado].push(r.valor)
  })
  const detalhe = Object.entries(grupos)
    .map(([d, vals]) => `D${d}[${vals.join(',')}]`)
    .join(' ')

  const totalEl   = document.getElementById('diceResultTotal')
  const detalheEl = document.getElementById('diceResultDetalhes')

  totalEl.textContent   = total
  detalheEl.textContent = detalhe

  // Animação pop no resultado
  totalEl.classList.remove('dice-resultado-pop')
  void totalEl.offsetWidth // reflow
  totalEl.classList.add('dice-resultado-pop')
}

// Inicia com botão rolar desabilitado
setTimeout(_atualizarBotaoRolar, 0)
