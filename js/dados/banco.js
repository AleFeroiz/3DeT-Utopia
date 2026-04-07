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
  { id: "animais",    nome: "Animais",    emoji: "🐾", desc: "Você sabe cuidar, adestrar, cavalgar e lidar com animais e outras criaturas irracionais. Pode substituir Medicina (apenas para animais). Com bons resultados nos testes, você consegue até se comunicar com animais." },
  { id: "artes",      nome: "Artes",      emoji: "🎭", desc: "Você sabe fazer performances artísticas como cantar, dançar, tocar música, cozinhar, fazer cosplay (e se disfarçar), desenhar, avaliar objetos de arte e outras." },
  { id: "esportes",   nome: "Esportes",   emoji: "🏃", desc: "Você conhece os muitos tipos de esportes e suas regras, além de ser capacitado em atividades físicas como correr, escalar, nadar, fazer acrobacias, equilibrar-se, saltar e outras." },
  { id: "influencia", nome: "Influência", emoji: "🗣️", desc: "Você sabe convencer outros a acreditar em algo ou fazer o que você quer. Envolve coisas como diplomacia, liderança, intimidação, sedução, blefe, hipnose, lábia, barganha, obter informações e outros." },
  { id: "luta",       nome: "Luta",       emoji: "⚔️", desc: "Você sabe atacar e se defender em combate, seja corpo a corpo ou à distância. Perícia fundamental para qualquer combatente." },
  { id: "manha",      nome: "Manha",      emoji: "🕵️", desc: "Você sabe fazer coisas malandras ou ilegais, como construir (e sabotar) armadilhas, arrombar portas e fechaduras, bater carteiras, criar (e decifrar) mensagens criptografadas, se disfarçar, falsificar objetos, ser furtivo, intimidar, rastrear pistas e pegadas." },
  { id: "maquinas",   nome: "Máquinas",   emoji: "⚙️", desc: "Você sabe operar, construir e consertar máquinas, veículos e aparelhos de todo tipo. Também sabe lidar com computadores, hackear sistemas e agir em simulações. Pode substituir Medicina (apenas para construtos)." },
  { id: "medicina",   nome: "Medicina",   emoji: "🩺", desc: "Você sabe realizar primeiros socorros, diagnósticos, tratar doenças e venenos, realizar cirurgias e todo tipo de conhecimento de saúde. Pode despertar um personagem inconsciente ou estabilizar um personagem quase morto." },
  { id: "mistica",    nome: "Mística",    emoji: "✨", desc: "Você sabe sobre forças sobrenaturais e artes místicas. Quando atacar ou se defender com poderes mágicos ou sobrenaturais, use esta perícia. Também é usada para reconhecer, contra-atacar e teorizar sobre conhecimentos ocultos, magia e criaturas mágicas." },
  { id: "percepcao",  nome: "Percepção",  emoji: "👁️", desc: "Você sabe usar seus sentidos para perceber melhor o mundo ao redor. Usada para ouvir ruídos baixos, notar coisas distantes ou escondidas, ler lábios, rastrear pistas, evitar ser surpreendido e até notar se alguém está mentindo." },
  { id: "saber",      nome: "Saber",      emoji: "📚", desc: "Você sabe tudo sobre tudo — qualquer conhecimento teórico em ciências, idiomas e até assuntos sobrenaturais, ou como e onde pesquisá-los. Perícia ampla, própria para cientistas e super nerds que sabem de tudo!" },
  { id: "sustento",   nome: "Sustento",   emoji: "🏕️", desc: "Você sabe subsistir e se orientar em condições adversas. Pode encontrar e produzir alimento, construir abrigos, rastrear pistas, reconhecer criaturas selvagens, construir armadilhas, ser furtivo, nadar e prever o clima." }
]

// ── SUBTIPOS DE FONTE DE PODER ────────────────────────────
export const SUBTIPOS_FONTE = [
  { id: "paramecia", nome: "Paramecia (Akuma no Mi)",  custo: 1 },
  { id: "zoan",      nome: "Zoan (Akuma no Mi)",        custo: 2 },
  { id: "logia",     nome: "Logia (Akuma no Mi)",       custo: 3 },
  { id: "haki",      nome: "Haki",                      custo: 1 },
  { id: "livre",     nome: "Fonte Livre / Homebrew",    custo: 1 }
]
