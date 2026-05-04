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
      { nivel: 1,  nome: "Decifrar",                    desc: "Textos antigos e investigações no geral sobre runas recebem um ganho. Além disso, durante eventos de Viagem do tipo Oportunidades ou Caótica, pode gastar sua ação no evento para analisar o ambiente — se o fizer, o Mestre reduz o NR final em 1." },
      { nivel: 5,  nome: "Conhecimento é Poder",         desc: "Pode gastar 3 PM para substituir qualquer teste de perícia para SABER." },
      { nivel: 10, nome: "Estudar é o Caminho da Perfeição", desc: "Por descanso longo, escolha uma perícia na qual não é treinado; você se tornará treinado nela até seu próximo descanso longo." },
      { nivel: 15, nome: "Quem Disse Que Eu Não Sei? Eu Sempre Sei", desc: "Uma quantidade de vezes igual à metade de sua HABILIDADE por cena, em um teste que você girou os dados, você pode optar por girar novamente o teste, mas escolhendo o novo valor como resultado." }
    ]
  },
  {
    id: "carpinteiro",
    nome: "Carpinteiro",
    emoji: "🪵",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Reparar Veículo",    desc: "Pode reparar o veículo rolando dados de vida usando sua HABILIDADE pro veículo 1 vez por cena." },
      { nivel: 5,  nome: "Veículo Reforçado",  desc: "Gaste 1 ação completa para criar reforços no combate. Testes de defesa para o veículo recebem um ganho durante um combate." },
      { nivel: 10, nome: "O Veículo Também Ataca!", desc: "Pode fazer modificações permanentes (por descanso longo) em seus canhões e armas do veículo em geral, concedendo um ganho a mais por melhoria para ataques com o navio." },
      { nivel: 15, nome: "Mestre Carpinteiro", desc: "Pode fazer modificações permanentes no veículo em geral. Por descanso longo, pagando 1M de bellys, escolha entre Poder e Resistência e aumente +1 de atributo do navio." }
    ]
  },
  {
    id: "engenheiro",
    nome: "Engenheiro",
    emoji: "⚙️",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Bugigangas",    desc: "Uma vez por descanso longo, pode construir um objeto auxiliar de alguma perícia que fornece +3 em testes e entregar a algum amigo ou a si mesmo." },
      { nivel: 5,  nome: "Sobrecarregar", desc: "Pode forçar o limite de algum equipamento. Ao usar uma arma sobrecarregada, a margem de crítico com o teste desse equipamento se torna 5 e 6, mas irá durar um D6 rodadas antes que entre em exaustão (desabilitado pelo resto da cena)." },
      { nivel: 10, nome: "Autômatos",     desc: "Pode criar um robô que irá fazer alguma atividade pro seu navio (observar, reparar, etc). Todos os testes dele serão baseados em 1D + sua HABILIDADE. Um robô possui 10 de vida x Nível do personagem." },
      { nivel: 15, nome: "Gênio",         desc: "Pode fazer criações gigantes com o devido custo. Um robô atacante ciborgue? Um nitro poderoso para ajudar seu navio? Uma arma à base de tecnologia? Você é capaz, mas tem um preço e tempo definidos pelo mestre." }
    ]
  },
  {
    id: "navegador",
    nome: "Navegador",
    emoji: "🧭",
    requisito: "Saber",
    habilidades: [
      { nivel: 1,  nome: "Previsão do Ambiente", desc: "Sempre que estiver para escolher uma rota do ambiente para seguir, recebe um ganho no teste além de não receber percas em caso de ambientes difíceis." },
      { nivel: 5,  nome: "Mapa",                 desc: "Sempre que estiver navegando por rotas que se guiem por um mapa, ganhe um apoio de 2NR na navegação e anule a possibilidade de errar o caminho. Alternativamente, enquanto navega, pode desenhar um mapa do trajeto que está percorrendo para usar mais tarde." },
      { nivel: 10, nome: "Intuição Perfeita",    desc: "Pode gastar 5 PM em um evento de rota para poder girar o teste de navegação novamente (Saber), mas escolhendo o novo valor independente do resultado." },
      { nivel: 15, nome: "Esse Caminho Cheira a Mal", desc: "Dentro de uma viagem, em apenas um evento de rota, pode descobrir tudo sobre as rotas e qual deve escolher." }
    ]
  },
  {
    id: "cozinheiro",
    nome: "Cozinheiro",
    emoji: "🍳",
    requisito: "Sustento",
    habilidades: [
      { nivel: 1,  nome: "Master Chef",      desc: "Em descansos e tendo 30 minutos disponíveis, pode preparar um prato para toda a tripulação que recupera o dobro da Resistência em PV e o dobro da Habilidade em PM de cada aliado — essencialmente um descanso curto extra via comida." },
      { nivel: 5,  nome: "Comida de Batalha",desc: "Gastando 15 minutos, pode produzir comida de combate para cada aliado. Em combate, pode ser usada como ação de movimento e fornece +3 em testes de defesa e ataque por 2 turnos." },
      { nivel: 10, nome: "Banquete Lendário",desc: "Em 1 hora, pode produzir uma quantidade de alimentos igual à sua Habilidade. Qualquer um que comer irá recuperar 50% do seu PV e PM máximo." },
      { nivel: 15, nome: "Entre a Faca e o Queijo, Sou o Mais Honrado", desc: "Durante um descanso longo, pode dedicar o tempo inteiro produzindo um alimento especial (somente 1 por descanso longo). Ao fazê-lo, seu próprio descanso longo cai um grau — tornando-se Precário. Quem comer este alimento recupera todos os seus status: PV, PM e PA completamente (não pode existir mais de 1 desse tipo de alimento feito pelo cozinheiro)." }
    ]
  },
  {
    id: "medico",
    nome: "Médico",
    emoji: "🩺",
    requisito: "Medicina",
    habilidades: [
      { nivel: 1,  nome: "Ninguém Morre Aqui!", desc: "Uma quantidade de vezes por cena igual à sua Habilidade, pode gastar uma ação para realizar um curativo rápido em um aliado, curando dobro da sua Habilidade em PV. Além disso, ao realizar o Teste de Medicina para estabilizar um aliado em estado Morrendo e fracassar, o aliado recebe ganho no próximo Teste de Morte." },
      { nivel: 5,  nome: "Cura Efetiva",        desc: "Usando uma ação completa, pode curar um aliado ferido por ataques. Gaste 1 PM para girar 1D6 para curar de vida, podendo girar mais dados com o limite de sua Habilidade." },
      { nivel: 10, nome: "Cirurgia de Campo",   desc: "Uma vez por dia, pode usar uma ação completa para levantar um aliado que está no estado Morrendo e mantê-lo firme, motivando a continuar na batalha, fornecendo Habilidade em D6 de vida temporária." },
      { nivel: 15, nome: "Eu Estou Aqui Para Salvar", desc: "Uma vez por dia, converta o equivalente a 1/4 do seu PM máximo em PV para um aliado em alcance curto." }
    ]
  },
  {
    id: "cacador_recompensas",
    nome: "Caçador de Recompensas",
    emoji: "⚔️",
    requisito: "Percepção",
    habilidades: [
      { nivel: 1,  nome: "Marcado",          desc: "Uma vez por dia selecione um alvo. Durante as próximas 24 horas, em situações que sejam para rastrear e localizar esse alvo, você recebe um ganho. Além disso, pode gastar 2 PM para receber ganho em percepção ou manha sempre que estiver em território desconhecido ou buscando informações sobre pessoas e locais." },
      { nivel: 5,  nome: "Presa Boa, É Presa Morta", desc: "Em um combate contra um alvo marcado, você recebe PODER 2 vezes em ataques contra o alvo marcado." },
      { nivel: 10, nome: "Não Me Atrapalhem",desc: "Enquanto possuir alguém marcado, caso receba ataques que não sejam do alvo marcado, você recebe 2 ganhos na defesa." },
      { nivel: 15, nome: "Morra!",           desc: "Ao acertar um golpe no marcado, você pode gastar 10 PM e efetuar um novo ataque." }
    ]
  },
  {
    id: "musico",
    nome: "Músico",
    emoji: "🎸",
    requisito: "Artes",
    habilidades: [
      { nivel: 1,  nome: "Canção da Batalha", desc: "Em batalha, por rodada, pode gastar uma ação para cantar ou tocar e animar seu bando. Faça um teste de Artes (9) e, caso passe, aliados recebem Habilidade do Músico × 2 PM. Caso seja um teste perfeito, de bônus todos recebem +1 PA. Fora de combate, pode gastar essa ação uma vez por dia sem testes, considerando o tempo de um descanso curto, concedendo o mesmo valor de PM aos aliados." },
      { nivel: 5,  nome: "Música Boa Pra Mim, Música Ruim Pra Tu", desc: "Uma vez por cena, pode gastar uma ação para tocar um som agonizante que afeta inimigos em alcance médio. Todos os afetados devem girar um teste de Resistência contra sua Artes — se não passarem, recebem Perda em todos os testes por 1D6 rodadas." },
      { nivel: 10, nome: "Hino de Guerra",    desc: "Uma vez por cena, pode gastar uma ação completa e tocar uma música motivacional para seus aliados. Todos em alcance médio recebem 1 Ganho em todos os testes durante o combate inteiro." },
      { nivel: 15, nome: "Coral Lendário!",   desc: "Uma vez por cena, pode gastar uma ação e tocar uma música que energiza seus aliados, concedendo Habilidade do Músico × 5 PM temporários durante esse combate." }
    ]
  },
  {
    id: "piloto",
    nome: "Piloto",
    emoji: "⚓",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Em Altas Rotas",       desc: "Recebe ganho em testes de pilotagem com veículos enquanto se locomove, além de não receber percas por conta de penalidades de rotas complicadas. Além de poder executar a manobra Defensiva de um veículo (ver Veículos e modificações)." },
      { nivel: 5,  nome: "Instinto de Piloto",    desc: "1 vez por cena pode gastar 4 PM para refazer um teste de defesa do veículo, ficando com o melhor resultado." },
      { nivel: 10, nome: "Posição Estratégica",  desc: "Pode gastar uma ação completa para manter o veículo em uma posição estratégica para que receba ganho em qualquer tipo de ataque que se derive do veículo." },
      { nivel: 15, nome: "Comigo Pilotando Não Tem Erro",  desc: "Uma vez por viagem, quando avistar uma situação de conflito, pode gastar 10 PM e forçar o veículo a uma velocidade anormal. Perderá 5D6 de PV do veículo, mas irá fugir do conflito." }
    ]
  },
  {
    id: "comandante",
    nome: "Comandante",
    emoji: "🏴‍☠️",
    requisito: "Influência",
    habilidades: [
      { nivel: 1,  nome: "Avante!",                  desc: "Ao início de um combate, escolha um aliado; ele irá receber um ganho no teste de iniciativa." },
      { nivel: 5,  nome: "Cai Pra Porrada!",         desc: "Caso um aliado em alcance curto vá receber um ataque, como reação pode gastar 4 PM e girar um teste de Poder contra a Resistência do atacante. Se vencer, o ataque será direcionado a você e tu possuis 1 ganho no teste de defesa." },
      { nivel: 10, nome: "Eu Confio no Seu Potencial", desc: "Durante um combate, no seu turno, pode gastar uma ação completa para ceder uma ação a mais para um aliado em alcance curto de ti." },
      { nivel: 15, nome: "Não Toque na Minha Tripulação!", desc: "Para cada aliado que você presenciar ser derrotado, você recebe 20 PV temporários e 20 PM temporários, além de 2 PA durante a cena." }
    ]
  }
]
