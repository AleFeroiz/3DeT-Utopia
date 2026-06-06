// ============================================================
//  dados/amplificacao.js — Amplificação / Redução por aba
// ============================================================

import { TABELAS } from './bancoCaracteristicas.js?v=600000'

const EXEC_SEQ = ['Completa', 'Padrão (Base)', 'Movimento', 'Ação Livre', 'Reação']
const ALC_SEQ  = ['Pessoal (Base)', 'Toque', 'Perto', 'Longe', 'Muito Longe', 'Fora de Alcance']

// Abas que podem ser amplificadas/reduzidas
export const ABAS_AMPLIFICAVEIS = [
  { chave: 'potencia', label: 'Potência'  },
  { chave: 'pressao',  label: 'Pressão'   },
  { chave: 'execucao', label: 'Execução'  },
  { chave: 'alcance',  label: 'Alcance'   },
  { chave: 'duracao',  label: 'Duração'   },
  { chave: 'area',     label: 'Área'      },
  { chave: 'alvos',    label: 'Alvos'     },
]

function _itensSemBase(lista) { return (lista ?? []).filter(i => !i.gratuita) }
function _execIdx(nome) { const i = EXEC_SEQ.findIndex(n => n === nome); return i < 0 ? 1 : i }
function _alcIdx(nome)  { const i = ALC_SEQ.findIndex(n => n === nome);  return i < 0 ? 0 : i }

/**
 * Computa a variante de UMA aba específica.
 * @returns {{ custoPM, chave, label, valor, destaque } | null}
 */
export function computarVarianteAba(escolhas, chave, tipo) {
  const amp = tipo === 'amplificada'

  // PM base herdado de todas as outras abas
  let pmBase = 0
  for (const [k, lista] of Object.entries(escolhas)) {
    if (k === chave) continue
    for (const item of (lista ?? [])) pmBase += item.pm ?? 0
  }

  let label = '', valor = '', destaque = 'neutro', pmAba = 0

  switch (chave) {
    case 'potencia':
    case 'pressao': {
      const itens = _itensSemBase(escolhas[chave])
      if (!itens.length) return null
      const baseVal = itens.reduce((s, i) => s + (i.valor ?? 0), 0)
      const basePM  = itens.reduce((s, i) => s + (i.pm    ?? 0), 0)
      pmAba    = amp ? basePM * 2 : Math.max(0, Math.floor(basePM / 2))
      label    = chave === 'potencia' ? 'Potência' : 'Pressão'
      valor    = String(amp ? baseVal * 2 : Math.max(0, Math.floor(baseVal / 2)))
      destaque = amp ? 'amp' : 'red'
      break
    }
    case 'execucao': {
      const atual   = (_itensSemBase(escolhas.execucao)[0] ?? escolhas.execucao?.[0])?.nome ?? 'Padrão (Base)'
      const idxBase = _execIdx(atual)
      const idxNovo = amp ? Math.min(EXEC_SEQ.length - 1, idxBase + 1) : Math.max(0, idxBase - 1)
      if (idxNovo === idxBase) return null
      const nomeNovo = EXEC_SEQ[idxNovo]
      const dado     = TABELAS.execucao.dados.find(d => d.nome === nomeNovo)
      pmAba    = dado?.pm ?? 0
      label    = 'Execução'
      valor    = nomeNovo.replace(' (Base)', '')
      destaque = amp ? 'amp' : 'red'
      break
    }
    case 'alcance': {
      const atual   = (_itensSemBase(escolhas.alcance)[0] ?? escolhas.alcance?.[0])?.nome ?? 'Pessoal (Base)'
      const idxBase = _alcIdx(atual)
      const idxNovo = amp ? Math.min(ALC_SEQ.length - 1, idxBase + 1) : Math.max(0, idxBase - 1)
      if (idxNovo === idxBase) return null
      const nomeNovo = ALC_SEQ[idxNovo]
      const dado     = TABELAS.alcance.dados.find(d => d.nome === nomeNovo)
      pmAba    = dado?.pm ?? 0
      label    = 'Alcance'
      valor    = nomeNovo.replace(' (Base)', '')
      destaque = amp ? 'amp' : 'red'
      break
    }
    case 'duracao': {
      const itens = _itensSemBase(escolhas.duracao)
      if (!itens.length) return null
      const tipo0     = itens[0]
      const countBase = itens.length
      const countNovo = amp ? countBase * 2 : Math.max(1, Math.floor(countBase / 2))
      if (countNovo === countBase) return null
      pmAba    = (tipo0.pm ?? 0) * countNovo
      label    = 'Duração'
      valor    = countNovo + '× ' + tipo0.nome.replace(' (Base)', '')
      destaque = amp ? 'amp' : 'red'
      break
    }
    case 'area':
    case 'alvos': {
      const itens = _itensSemBase(escolhas[chave])
      if (!itens.length) return null
      const basePM    = itens.reduce((s, i) => s + (i.pm ?? 0), 0)
      const countBase = itens.length
      const countNovo = amp ? countBase * 2 : Math.max(1, Math.floor(countBase / 2))
      pmAba    = amp ? basePM * 2 : Math.max(0, Math.floor(basePM / 2))
      label    = chave === 'area' ? 'Área' : 'Alvos'
      valor    = countNovo + '× ' + itens[0].nome
      destaque = amp ? 'amp' : 'red'
      break
    }
    default: return null
  }

  return { custoPM: Math.max(2, pmBase + pmAba), chave, label, valor, destaque }
}

/**
 * Retorna quais abas têm conteúdo para variantes
 */
export function abasDisponiveis(escolhas) {
  return ABAS_AMPLIFICAVEIS.filter(({ chave }) => {
    if (chave === 'execucao' || chave === 'alcance') return true
    return _itensSemBase(escolhas[chave]).length > 0
  })
}
