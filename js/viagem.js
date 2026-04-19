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

// ── Teste do Navegador ─────────────────────────────────────
// Fracasso  → gera rotas falsas (desinformação)
// Passou    → marca 1 rota real aleatória; as outras 2 são falsas
// Perfeito  → marca 2 rotas reais aleatórias; a outra é falsa
export const RESULTADOS_NAVEGADOR = [
  { id: "fracasso",  label: "Fracassou",        rotasReais: 0, desc: "Recebe informação errada — todas as rotas são falsas." },
  { id: "passou",    label: "Passou",            rotasReais: 1, desc: "Sabe de 1 rota real. As outras 2 são falsas." },
  { id: "perfeito",  label: "Sucesso Perfeito",  rotasReais: 2, desc: "Sabe de 2 rotas reais. A outra é falsa." },
]

// ── Teste do Piloto ────────────────────────────────────────
// Fracasso       → +1 NR
// Passou         → -1 NR
// Sucesso Perfeito → -2 NR
export const RESULTADOS_PILOTO = [
  { id: "fracasso", label: "Fracassou",        deltaNR: +1, desc: "+1 NR na viagem." },
  { id: "passou",   label: "Passou",            deltaNR: -1, desc: "-1 NR na viagem." },
  { id: "perfeito", label: "Sucesso Perfeito",  deltaNR: -2, desc: "-2 NR na viagem." },
]

// ── Rola dados ────────────────────────────────────────────
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
  const ambiente        = opts.ambiente        ?? AMBIENTES[Math.floor(Math.random() * AMBIENTES.length)]
  const ritmo           = opts.ritmo           ?? RITMOS[1]
  const porte           = opts.porte           ?? PORTES[1]
  const estado          = opts.estado          ?? ESTADOS_VEICULO[0]
  const testeNavegador  = opts.testeNavegador  ?? null   // null = não aplicar
  const testePiloto     = opts.testePiloto     ?? null   // null = não aplicar

  // Delta NR do piloto
  const deltaPiloto = testePiloto ? testePiloto.deltaNR : 0

  const rotas = _sortear3Rotas()

  // NR base = ambiente + veículo (porte + estado) + ritmo + piloto
  const nrBase = ambiente.nr + porte.nr + estado.nr + ritmo.nr + deltaPiloto

  // ── Lógica do Navegador ───────────────────────────────
  // Determina quais índices de rota são "reais" vs "falsas"
  let indicesReais = []
  let rotasFalsas  = []

  if (testeNavegador && testeNavegador.rotasReais > 0) {
    // Sorteia aleatoriamente quais rotas o navegador conhece de verdade
    const indices = [0, 1, 2]
    const embaralhados = indices.sort(() => Math.random() - 0.5)
    indicesReais = embaralhados.slice(0, testeNavegador.rotasReais)
  } else if (testeNavegador && testeNavegador.rotasReais === 0) {
    // Fracasso: todas as rotas são falsas — gera rotas alternativas enganosas
    indicesReais = []
    rotasFalsas  = _sortear3Rotas()  // rotas completamente diferentes
  }
  // null = sem teste = todas as rotas visíveis normalmente (visão do Mestre)

  return {
    ambiente,
    rotas,
    ritmo,
    porte,
    estado,
    nrBase,
    deltaPiloto,
    testeNavegador,
    testePiloto,
    indicesReais,   // índices (0,1,2) que o navegador conhece corretamente
    rotasFalsas,    // rotas alternativas geradas para o fracasso do navegador
    eventos: rotas.map((r, i) => {
      const nrTotal = nrBase + r.nr
      const eInfo   = _calcularEvento(nrTotal)
      const dado    = d6()
      return {
        rota:    r,
        nrTotal,
        tipo:    eInfo.tipo,
        cor:     eInfo.cor,
        icon:    eInfo.icon,
        dado,
        evento:  eInfo.lista[dado - 1],
        // Para o navegador: é uma rota que ele "sabe"?
        navegadorSabe: testeNavegador ? indicesReais.includes(i) : null,
      }
    }),
  }
}

export { AMBIENTES, RITMOS, PORTES, ESTADOS_VEICULO, TIPOS_ROTA, RESULTADOS_NAVEGADOR, RESULTADOS_PILOTO }