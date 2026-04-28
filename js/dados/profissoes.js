// ============================================================
//  dados/profissoes.js — Profissões (Livro págs. 8–11)
// ============================================================

export const PROFISSOES = [
  {
    id: "arqueologo",
    nome: "Arqueólogo",
    emoji: "📖",
    requisito: "Saber",
    habilidades: [
      { nivel: 1,  nome: "Decifrar",                    desc: "Textos antigos e investigações sobre runas recebem um ganho." },
      { nivel: 5,  nome: "Conhecimento é Poder",         desc: "Gaste 3 PM: substitui qualquer teste de perícia por SABER." },
      { nivel: 10, nome: "Estudar é o Caminho",          desc: "Por descanso longo: escolha uma perícia não treinada para usá-la até o próximo descanso longo." },
      { nivel: 15, nome: "Quem Disse Que Eu Não Sei?",   desc: "HABILIDADE÷2 vezes por cena: após girar, pode rolar novamente e escolher o novo valor." }
    ]
  },
  {
    id: "carpinteiro",
    nome: "Carpinteiro",
    emoji: "🪵",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Reparar Veículo",    desc: "Pode rolar dados de vida usando sua HABILIDADE para o veículo 1× por cena." },
      { nivel: 5,  nome: "Veículo Reforçado",  desc: "Gaste 1 ação completa para criar reforços no combate. Testes de defesa do veículo recebem um ganho durante um combate." },
      { nivel: 10, nome: "O Veículo Ataca!",   desc: "Modificações permanentes nos canhões/armas do veículo por descanso longo, +1 ganho por melhoria." },
      { nivel: 15, nome: "Mestre Carpinteiro", desc: "Pode fazer modificações permanentes no veículo. Por descanso longo, pagando 1M de bellys, escolha entre Poder e Resistência e aumente +1 de atributo do navio." }
    ]
  },
  {
    id: "engenheiro",
    nome: "Engenheiro",
    emoji: "⚙️",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Bugigangas",    desc: "1× por descanso longo: constrói um objeto auxiliar (+3 em testes de alguma perícia) e entrega a alguém." },
      { nivel: 5,  nome: "Sobrecarregar", desc: "Sobrecarrega uma arma: crítico em 5 e 6, mas dura 1D6 rodadas antes de entrar em exaustão." },
      { nivel: 10, nome: "Autômatos",     desc: "Cria um robô auxiliar (1D + HABILIDADE em testes, 10 PV × Nível do personagem) para funções do navio." },
      { nivel: 15, nome: "Gênio",         desc: "Criações gigantes (custo e tempo definidos pelo mestre): robô atacante, nitro, armas tecnológicas, etc." }
    ]
  },
  {
    id: "navegador",
    nome: "Navegador",
    emoji: "🧭",
    requisito: "Saber",
    habilidades: [
      { nivel: 1,  nome: "Previsão do Ambiente", desc: "Ganho em escolha de rotas. Não recebe percas em ambientes difíceis." },
      { nivel: 5,  nome: "Mapa",                 desc: "Com mapa: +2NR na navegação, sem errar o caminho. Pode desenhar mapas durante a viagem." },
      { nivel: 10, nome: "Intuição Perfeita",    desc: "Gaste 5 PM: re-rola um teste de Saber na navegação e escolhe o novo valor." },
      { nivel: 15, nome: "Esse Caminho Cheira a Mal", desc: "1× por viagem: descobre tudo sobre as rotas disponíveis em um evento." }
    ]
  },
  {
    id: "cozinheiro",
    nome: "Cozinheiro",
    emoji: "🍳",
    requisito: "Sustento",
    habilidades: [
      { nivel: 1,  nome: "Master Chef",      desc: "1h disponível: prepara prato para a tripulação que recupera 10 PM e 10 PV." },
      { nivel: 5,  nome: "Comida de Batalha",desc: "15 min: produz comida de combate. Uso: ação de movimento → +3 em defesa e ataque por 2 turnos." },
      { nivel: 10, nome: "Banquete Lendário",desc: "2h: produz alimento que recupera 30 PV e 30 PM de quem comer." },
      { nivel: 15, nome: "Entre a Faca e o Queijo", desc: "Descanso longo inteiro: cria 1 alimento especial. Quem comer recupera todo o seu PA." }
    ]
  },
  {
    id: "medico",
    nome: "Médico",
    emoji: "🩺",
    requisito: "Medicina",
    habilidades: [
      { nivel: 1,  nome: "Ninguém Morre Aqui!", desc: "Ao falhar estabilização: teste Medicina (9) para adicionar vantagem no teste de morte da vítima." },
      { nivel: 5,  nome: "Cura Efetiva",        desc: "Ação completa: gaste 1 PM → rola 1D6 de cura (máximo de dados = HABILIDADE)." },
      { nivel: 10, nome: "Cirurgia de Campo",   desc: "1× por dia: ação completa para levantar aliado morrendo com HABILIDADE×D6 de PV temporários." },
      { nivel: 15, nome: "Eu Estou Aqui Para Salvar", desc: "1× por dia: converte 1/4 do seu PM máximo em PV para um aliado em alcance curto." }
    ]
  },
  {
    id: "cacador_recompensas",
    nome: "Caçador de Recompensas",
    emoji: "⚔️",
    requisito: "Percepção",
    habilidades: [
      { nivel: 1,  nome: "Marcado",          desc: "1× por dia: seleciona um alvo. Ganho em testes para rastreá-lo por 24h. Pode gastar 2 PM para receber Ganho em Percepção ou Manha sempre que estiver em território desconhecido ou buscando informações sobre pessoas e locais." },
      { nivel: 5,  nome: "Presa Boa É Presa Morta", desc: "Contra alvo marcado: soma PODER 2× em ataques." },
      { nivel: 10, nome: "Não Me Atrapalhem",desc: "Com alvo marcado: 2 ganhos na defesa contra ataques de terceiros." },
      { nivel: 15, nome: "Morra!",           desc: "Ao acertar o marcado: gaste 10 PM para realizar um novo ataque imediatamente." }
    ]
  },
  {
    id: "musico",
    nome: "Músico",
    emoji: "🎸",
    requisito: "Artes",
    habilidades: [
      { nivel: 1,  nome: "Canção da Batalha", desc: "1× por rodada: gaste ação, teste Artes (9) → aliados recebem 5 PM. Perfeito: +1 PA de bônus. Fora de combate: 1× por dia sem teste (tempo de descanso curto) → recebe 6 PM." },
      { nivel: 5,  nome: "Música Boa Pra Mim, Ruim Pra Tu", desc: "1× por cena: ação → som agonizante em alcance médio. Falha em Resistência vs Artes → perda em todos os testes por 1D6 rodadas." },
      { nivel: 10, nome: "Hino de Guerra",    desc: "1× por cena: ação completa → aliados em alcance médio recebem +1 ganho em TODOS os testes no combate." },
      { nivel: 15, nome: "Coral Lendário!",   desc: "1× por cena: ação → aliados recebem metade do PM máximo como PM temporário no combate." }
    ]
  },
  {
    id: "piloto",
    nome: "Piloto",
    emoji: "⚓",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Em Altas Rotas",       desc: "Ganho em testes de pilotagem em movimento. Sem percas por rotas complicadas. Pode executar a manobra Defensiva de um veículo (ver Veículos e modificações)." },
      { nivel: 5,  nome: "Instinto de Piloto",    desc: "1× por cena: gaste 4 PM para refazer um teste de defesa do veículo, ficando com o melhor resultado." },
      { nivel: 10, nome: "Posição Estratégica",  desc: "Ação completa: mantém veículo em posição estratégica → ganho em ataques derivados do veículo." },
      { nivel: 15, nome: "Comigo Não Tem Erro",  desc: "1× por viagem: 10 PM → velocidade anormal. Perde 5D6 PV do veículo, mas foge do conflito." }
    ]
  },
  {
    id: "comandante",
    nome: "Comandante",
    emoji: "🏴‍☠️",
    requisito: "Influência",
    habilidades: [
      { nivel: 1,  nome: "Avante!",                  desc: "Início do combate: escolha um aliado que recebe ganho no teste de iniciativa." },
      { nivel: 5,  nome: "Cai Pra Porrada!",         desc: "Reação (4 PM): aliado em alcance curto vai ser atacado → teste Poder vs Resistência do atacante. Se vencer, redireciona o ataque para você com +1 ganho na defesa." },
      { nivel: 10, nome: "Eu Confio no Seu Potencial", desc: "No seu turno: ação completa → cede uma ação extra para um aliado em alcance curto." },
      { nivel: 15, nome: "Não Toque na Minha Tripulação!", desc: "A cada aliado derrotado presenciado: +20 PV temporários, +20 PM temporários e +2 PA na cena." }
    ]
  }
]