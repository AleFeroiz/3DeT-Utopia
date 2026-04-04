// ============================================================
//  dados/banco.js — Banco de vantagens, desvantagens e técnicas
//  (dados do livro de regras 3DeT One Piece)
// ============================================================

export const BANCO_ELEMENTOS = [
  // ── VANTAGENS ─────────────────────────────────────────────
  {
    id:       "agil",
    nome:     "Ágil",
    tipo:     "vantagem",
    custo:    1,
    descricao: "Movimentos rápidos e precisos. Recebe Ganho em testes de agilidade."
  },
  {
    id:       "forte",
    nome:     "Forte",
    tipo:     "vantagem",
    custo:    2,
    descricao: "Grande força física. Bônus em testes de força e ataques corpo a corpo."
  },
  {
    id:       "resistente",
    nome:     "Resistente",
    tipo:     "vantagem",
    custo:    1,
    descricao: "Escolha dois tipos de dano. Você se torna resistente a eles — soma Resistência novamente no teste de defesa contra esses danos."
  },
  {
    id:       "versatil",
    nome:     "Versátil",
    tipo:     "vantagem",
    custo:    1,
    descricao: "Pode gastar 4 PM para combinar dois tipos de dano diferentes em um único golpe."
  },

  // ── DESVANTAGENS ──────────────────────────────────────────
  {
    id:       "azarado",
    nome:     "Azarado",
    tipo:     "desvantagem",
    custo:    -1,
    descricao: "Coisas ruins tendem a acontecer. O mestre pode acionar penalidades narrativas."
  },
  {
    id:       "vulneravel",
    nome:     "Vulnerável",
    tipo:     "desvantagem",
    custo:    -1,
    descricao: "Escolha dois tipos de dano. O dano final recebido desses tipos é dobrado."
  },

  // ── TÉCNICAS ──────────────────────────────────────────────
  {
    id:       "golpe_especial",
    nome:     "Golpe Especial",
    tipo:     "tecnica",
    custo:    2,
    descricao: "Ataque poderoso que vai além dos limites normais."
  }
]

// ── PERICIAS (do livro) ───────────────────────────────────
export const LISTA_PERICIAS = [
  { id: "animais",    nome: "Animais"    },
  { id: "artes",      nome: "Artes"      },
  { id: "esportes",   nome: "Esportes"   },
  { id: "influencia", nome: "Influência" },
  { id: "luta",       nome: "Luta"       },
  { id: "manha",      nome: "Manha"      },
  { id: "maquinas",   nome: "Máquinas"   },
  { id: "medicina",   nome: "Medicina"   },
  { id: "mistica",    nome: "Mística"    },
  { id: "percepcao",  nome: "Percepção"  },
  { id: "saber",      nome: "Saber"      },
  { id: "sustento",   nome: "Sustento"   }
]

// ── SUBTIPOS DE FONTE DE PODER ────────────────────────────
export const SUBTIPOS_FONTE = [
  { id: "paramecia", nome: "Paramecia (Akuma no Mi)",  custo: 1 },
  { id: "zoan",      nome: "Zoan (Akuma no Mi)",        custo: 2 },
  { id: "logia",     nome: "Logia (Akuma no Mi)",       custo: 3 },
  { id: "haki",      nome: "Haki",                      custo: 1 },
  { id: "livre",     nome: "Fonte Livre / Homebrew",    custo: 1 }
]
