// ============================================================
//  js/viagem.js — Sistema de Viagem e Deslocamento
//  Regras do livro: Pág. 39-40
// ============================================================

// ── Dados das tabelas ─────────────────────────────────────

const AMBIENTES = [
  { nome: "Estável",  nr: -1, desc: "Mar calmo, ilha amigável, território seguro.",        icon: "🌿", cor: "#22c55e" },
  { nome: "Instável", nr: +1, desc: "Mar agitado, região desconhecida, tensão no ar.",     icon: "⚡", cor: "#f59e0b" },
  { nome: "Hostil",   nr: +3, desc: "Zona de guerra, Grand Line, território inimigo.",     icon: "💀", cor: "#ef4444" },
]

const TIPOS_ROTA = [
  { nome: "Calma",          nr: -1, desc: "Águas tranquilas, caminho bem mapeado.",          icon: "😴" },
  { nome: "Povoada",        nr:  0, desc: "Rotas comerciais, ilhas próximas.",               icon: "🏘️" },
  { nome: "Oportunidades",  nr: +1, desc: "Rumores de tesouros, desvios interessantes.",     icon: "💰" },
  { nome: "Perigosa",       nr: +2, desc: "Território de piratas rivais, monstros marinhos.", icon: "⚔️" },
  { nome: "Caótica",        nr: +3, desc: "Tempestades, correntes loucas, perigo iminente.", icon: "🌀" },
]

const RITMOS = [
  { nome: "Lento",     nr: -1, desc: "Navegação cautelosa. Menos desgaste." },
  { nome: "Normal",    nr:  0, desc: "Ritmo padrão de viagem." },
  { nome: "Acelerado", nr: +2, desc: "Máxima velocidade. Risco maior." },
]

const PORTES = [
  { nome: "Pequeno", nr: -1 },
  { nome: "Médio",   nr:  0 },
  { nome: "Grande",  nr: +1 },
]

const ESTADOS_VEICULO = [
  { nome: "Normal",   nr:  0 },
  { nome: "Avariado", nr: +1 },
  { nome: "Crítico",  nr: +2 },
]

const EVENTOS_BOM = [
  "Vento favorável — chegam mais rápido ao destino",
  "Ilha de descanso encontrada — recuperam PA e PM",
  "Mercador amigável — oferta de itens raros",
  "Informação valiosa sobre a próxima ilha",
  "Calmaria perfeita — tripulação se recupera",
  "Peixe gigante fácil de pescar — suprimentos completos",
]

const EVENTOS_NEUTRO = [
  "Neblina densa — visibilidade reduzida por 1 dia",
  "Corrente inesperada — rota levemente desviada",
  "Navio estranho ao horizonte — não se aproxima",
  "Chuva forte — nada de grave, mas incômodo",
  "Avistamento de fauna marinha curiosa",
  "Equipamento pequeno quebra — conserto simples",
]

const EVENTOS_RUIM = [
  "Tempestade! Teste de pilotagem ou +1D6 de dano ao veículo",
  "Piratas inimigos aparecem — encontro de combate",
  "Doença a bordo — um personagem fica enfraquecido",
  "Suprimentos deteriorados — racionamento necessário",
  "Monstro marinho avistado e agitado",
  "Sabotagem descoberta — alguém ou algo causou dano ao navio",
]

// ── Rolar dados ────────────────────────────────────────────
function d6() { return Math.floor(Math.random() * 6) + 1 }

function _sortear3Rotas() {
  const pool = [...TIPOS_ROTA]
  const result = []
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

function _calcularEvento(nrTotal) {
  if (nrTotal <= 3) return { tipo: "Bom",    lista: EVENTOS_BOM,    cor: "#22c55e", icon: "🌟" }
  if (nrTotal <= 6) return { tipo: "Neutro", lista: EVENTOS_NEUTRO, cor: "#f59e0b", icon: "⚖️" }
  return              { tipo: "Ruim",   lista: EVENTOS_RUIM,   cor: "#ef4444", icon: "💥" }
}

// ── Gerador principal ──────────────────────────────────────
export function gerarViagem(opts = {}) {
  const ambiente = opts.ambiente ?? AMBIENTES[Math.floor(Math.random() * AMBIENTES.length)]
  const ritmo    = opts.ritmo    ?? RITMOS[1]   // Normal por padrão
  const porte    = opts.porte    ?? PORTES[1]   // Médio por padrão
  const estado   = opts.estado   ?? ESTADOS_VEICULO[0] // Normal por padrão

  const rotas = _sortear3Rotas()

  // NR base = ambiente + veículo (porte + estado) + ritmo
  // A rota escolhida é adicionada quando o jogador decide
  const nrBase = ambiente.nr + porte.nr + estado.nr + ritmo.nr

  return {
    ambiente,
    rotas,
    ritmo,
    porte,
    estado,
    nrBase,
    // Pré-calcula evento para cada rota
    eventos: rotas.map(r => {
      const nrTotal = nrBase + r.nr
      const eInfo   = _calcularEvento(nrTotal)
      const dado    = d6()
      const lista   = eInfo.lista
      const eventText = lista[dado - 1]
      return {
        rota:     r,
        nrTotal,
        tipo:     eInfo.tipo,
        cor:      eInfo.cor,
        icon:     eInfo.icon,
        dado,
        evento:   eventText,
      }
    }),
  }
}

export { AMBIENTES, RITMOS, PORTES, ESTADOS_VEICULO, TIPOS_ROTA }
