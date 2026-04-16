// ============================================================
//  js/ui/uiResumoEscolhas.js — Função compartilhada entre
//  uiModal.js e app.js para exibir resumo das escolhas
//  de características.
// ============================================================

const LABELS_ESCOLHAS = {
  potencia: 'Potência', pressao: 'Pressão', execucao: 'Execução',
  alcance: 'Alcance', duracao: 'Duração', area: 'Área',
  alvos: 'Alvos Adicionais', condicoes: 'Condições', descontos: 'Descontos'
}

const BASES_PADRAO_ESCOLHAS = {
  execucao: 'Padrão',
  alcance:  'Pessoal',
  duracao:  'Instantânea',
  area:     '1 alvo',
  alvos:    '1 alvo'
}

/**
 * Gera um objeto { label → textoResumo } das escolhas de uma característica.
 * Mostra bases padrão com estilo italic quando nenhuma escolha extra foi feita.
 *
 * @param {Object} escolhas - objeto com chaves das abas e arrays de itens
 * @returns {Object} - { "Potência": "...", "Alcance": "...", ... }
 */
export function resumoEscolhas(escolhas) {
  if (!escolhas) return {}

  const result = {}
  const todasChaves = new Set([
    ...Object.keys(escolhas),
    ...Object.keys(BASES_PADRAO_ESCOLHAS)
  ])

  for (const chave of todasChaves) {
    const lista      = escolhas[chave] ?? []
    const itensExtra = lista.filter(i => !i.gratuita)

    if (itensExtra.length === 0) {
      if (BASES_PADRAO_ESCOLHAS[chave]) {
        result[LABELS_ESCOLHAS[chave] ?? chave] =
          `<span style="opacity:0.45;font-style:italic">${BASES_PADRAO_ESCOLHAS[chave]} (padrão)</span>`
      }
      continue
    }

    const contagem = {}
    let total = 0
    for (const item of itensExtra) {
      const k = item.nome ?? `+${item.valor}`
      contagem[k] = (contagem[k] ?? 0) + 1
      if (item.valor !== undefined) total += item.valor * 1
    }

    const partes   = Object.entries(contagem)
      .map(([nome, qtd]) => qtd > 1 ? `${nome} ×${qtd}` : nome)
      .join(', ')
    const totalStr = total > 0
      ? ` <span style="opacity:0.5">= ${total}</span>`
      : ''

    result[LABELS_ESCOLHAS[chave] ?? chave] = partes + totalStr
  }

  return result
}
