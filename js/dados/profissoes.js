// ============================================================
//  dados/profissoes.js — Profissões (Livro de Regras 3DeT Utopia)
// ============================================================

export const PROFISSOES = [
  {
    id: "arqueologo",
    nome: "Arqueólogo",
    emoji: "📖",
    requisito: "Saber",
    habilidades: [
      { nivel: 1,  nome: "Decifrar",                            desc: "Textos antigos e investigações sobre runas e artefatos recebem Ganho. Além disso, durante Ações de Interlúdio do tipo Pesquisar/Estudar, pode gastar sua ação para analisar o ambiente ou destino — se o fizer, o Mestre reduz o NR do próximo Evento de Trajeto em 1." },
      { nivel: 5,  nome: "Conhecimento é Poder",                desc: "Pode gastar 3 PM para substituir qualquer teste de perícia por Saber." },
      { nivel: 10, nome: "Estudar é o Caminho da Perfeição",    desc: "Por Descanso Longo, escolha uma perícia na qual não é treinado — você se tornará treinado nela até o próximo Descanso Longo." },
      { nivel: 15, nome: "Quem Disse Que Eu Não Sei? Eu Sempre Sei", desc: "Uma quantidade de vezes igual à metade de sua Habilidade por cena, em um teste que você rolou os dados, pode optar por rolar novamente, escolhendo o novo valor como resultado." }
    ]
  },
  {
    id: "carpinteiro",
    nome: "Carpinteiro",
    emoji: "🪵",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Reparar Veículo",    desc: "Pode reparar o veículo rolando dados de vida usando sua Habilidade uma vez por cena. Durante viagens, essa habilidade pode ser usada como Ação de Interlúdio no lugar da ação genérica de Reparar Veículo — com efeito superior ao teste padrão." },
      { nivel: 5,  nome: "Veículo Reforçado",  desc: "Gaste 1 Ação Completa para criar reforços em combate. Testes de defesa do veículo recebem Ganho durante aquele combate." },
      { nivel: 10, nome: "O Veículo Também Ataca!", desc: "Pode fazer modificações permanentes (por Descanso Longo) nas armas do veículo, concedendo Ganho adicional por melhoria em ataques com o veículo." },
      { nivel: 15, nome: "Mestre Carpinteiro",  desc: "Pode fazer modificações permanentes no veículo. Por Descanso Longo, pagando o valor definido pelo Mestre em Trocados, escolha entre Poder e Resistência e aumente +1 no atributo do veículo." }
    ]
  },
  {
    id: "engenheiro",
    nome: "Engenheiro",
    emoji: "⚙️",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Bugigangas",    desc: "Uma vez por Descanso Longo, pode construir um objeto auxiliar de alguma perícia que fornece +3 em testes e entregar a algum aliado ou a si mesmo." },
      { nivel: 5,  nome: "Sobrecarregar", desc: "Pode forçar o limite de algum equipamento. Ao usar uma arma sobrecarregada, a margem de crítico com esse equipamento se torna 5 e 6, mas irá durar 1D6 rodadas antes de entrar em exaustão (desabilitado pelo resto da cena)." },
      { nivel: 10, nome: "Autômatos",     desc: "Pode criar um autômato que irá realizar alguma atividade para o grupo (observar, reparar, vigiar, etc). Todos os testes dele são baseados em 1D + sua Habilidade. Um autômato possui 10 PV × Nível do personagem." },
      { nivel: 15, nome: "Gênio",         desc: "Pode fazer criações de grande escala com o devido custo. Um autômato de combate? Um propulsor para o veículo? Uma arma à base de tecnologia? Você é capaz — mas o custo e o tempo são definidos pelo Mestre." }
    ]
  },
  {
    id: "navegador",
    nome: "Navegador",
    emoji: "🧭",
    requisito: "Saber",
    habilidades: [
      { nivel: 1,  nome: "Previsão do Ambiente", desc: "Sempre que estiver escolhendo um trajeto, recebe Ganho no teste além de não sofrer Perda em ambientes difíceis." },
      { nivel: 5,  nome: "Mapa",                 desc: "Sempre que estiver percorrendo trajetos guiados por um mapa, recebe -2 NR na viagem e anula a possibilidade de errar o caminho. Alternativamente, pode desenhar um mapa do trajeto percorrido para uso futuro." },
      { nivel: 10, nome: "Intuição Perfeita",    desc: "Pode gastar 5 PM em um Evento de Trajeto para rerolar o teste de navegação (Saber), escolhendo o novo valor independente do resultado." },
      { nivel: 15, nome: "Esse Caminho Cheira a Mal", desc: "Dentro de uma viagem, em apenas um Evento de Trajeto, pode descobrir tudo sobre os trajetos disponíveis e qual deve escolher — sem teste." }
    ]
  },
  {
    id: "cozinheiro",
    nome: "Cozinheiro",
    emoji: "🍳",
    requisito: "Sustento",
    habilidades: [
      { nivel: 1,  nome: "Master Chef",       desc: "Em Descansos e tendo 30 minutos disponíveis, pode preparar um prato para uma quantia de pessoas igual a sua Habilidade que recupera o dobro da Resistência em PV e o dobro da Habilidade em PM de cada aliado — essencialmente um Descanso Curto extra via comida. Durante viagens, essa habilidade pode ser usada como Ação de Interlúdio de Cozinhar com o efeito completo aplicado ao grupo." },
      { nivel: 5,  nome: "Comida de Batalha", desc: "Gastando 15 minutos, pode produzir comida de combate para cada aliado. Em combate, pode ser usada como Ação de Movimento e fornece +3 em testes de defesa e ataque por 2 turnos." },
      { nivel: 10, nome: "Banquete Lendário", desc: "Em 1 hora, pode produzir uma quantidade de alimentos igual à sua Habilidade. Qualquer um que comer recupera 50% do seu PV e PM máximo." },
      { nivel: 15, nome: "Entre a Faca e o Queijo, Sou o Mais Honrado", desc: "Durante um Descanso Longo, pode dedicar o tempo inteiro produzindo um alimento especial (apenas 1 por Descanso Longo). Ao fazê-lo, seu próprio Descanso Longo cai um grau — tornando-se Precário. Quem comer recupera todos os seus recursos: PV, PM e PA completamente. Não pode existir mais de 1 desse alimento por vez." }
    ]
  },
  {
    id: "medico",
    nome: "Médico",
    emoji: "🩺",
    requisito: "Medicina",
    habilidades: [
      { nivel: 1,  nome: "Ninguém Morre Aqui!", desc: "Uma quantidade de vezes por cena igual à sua Habilidade, pode gastar uma ação para realizar um curativo rápido em um aliado, curando dobro da sua Habilidade em PV. Ao realizar o Teste de Medicina para estabilizar um aliado em estado Morrendo e fracassar, o aliado recebe Ganho no próximo Teste de Morte. Durante viagens, pode usar uma Ação de Interlúdio para realizar Cuidados Médicos — cada aliado recupera dobro da Habilidade do Médico em PV adicionais além do Descanso normal." },
      { nivel: 5,  nome: "Cura Efetiva",        desc: "Usando uma Ação Completa, pode curar um aliado ferido. Gaste 1 PM para rolar 1D6 de cura, podendo rolar mais dados com limite igual à sua Habilidade." },
      { nivel: 10, nome: "Cirurgia de Campo",   desc: "Uma vez por dia, pode usar uma Ação Completa para levantar um aliado em estado Morrendo, fornecendo Habilidade em D6 de PV temporários." },
      { nivel: 15, nome: "Eu Estou Aqui Para Salvar", desc: "Uma vez por dia, converta o equivalente a 1/4 do seu PM máximo em PV para um aliado em alcance Curto." }
    ]
  },
  {
    id: "cacador_recompensas",
    nome: "Caçador de Recompensas",
    emoji: "⚔️",
    requisito: "Percepção",
    habilidades: [
      { nivel: 1,  nome: "Marcado",                    desc: "Uma vez por dia, selecione um alvo. Durante as próximas 24 horas, em situações de rastreamento e localização desse alvo, recebe Ganho. Além disso, pode gastar 2 PM para receber Ganho em Percepção ou Manha sempre que estiver em território desconhecido ou buscando informações sobre pessoas e locais." },
      { nivel: 5,  nome: "Presa Boa, É Presa Morta",   desc: "Em combate contra um alvo marcado, soma PODER duas vezes em ataques contra ele." },
      { nivel: 10, nome: "Não Me Atrapalhem",           desc: "Enquanto possuir alguém marcado, caso receba ataques de quem não é o alvo marcado, recebe 2 Ganhos na defesa." },
      { nivel: 15, nome: "Morra!",                     desc: "Ao acertar um golpe no marcado, pode gastar 10 PM e efetuar um novo ataque." }
    ]
  },
  {
    id: "musico",
    nome: "Músico",
    emoji: "🎸",
    requisito: "Artes",
    habilidades: [
      { nivel: 1,  nome: "Canção da Batalha",  desc: "Em batalha, por rodada, pode gastar uma ação para tocar ou cantar. Faça um teste de Artes (9) — se passar, aliados recebem Poder do Músico × 2 PM. Sucesso Perfeito concede +1 PA a todos como bônus. Durante viagens, pode usar uma Ação de Interlúdio para tocar para o grupo — sem teste, todos os aliados recuperam Poder do Músico × 2 PM adicionais naquele dia." },
      { nivel: 5,  nome: "Música Boa Pra Mim, Música Ruim Pra Tu", desc: "Uma vez por cena, pode gastar uma ação para tocar um som agonizante que afeta inimigos em alcance Médio. Todos os afetados testam Resistência contra Artes — se falharem, recebem Perda em todos os testes por 1D6 rodadas." },
      { nivel: 10, nome: "Hino de Guerra",     desc: "Uma vez por cena, pode gastar uma Ação Completa e tocar uma música motivacional. Todos os aliados em alcance Médio recebem 1 Ganho em todos os testes durante o combate inteiro." },
      { nivel: 15, nome: "Coral Lendário!",    desc: "Uma vez por cena, pode gastar uma ação e tocar uma música que energiza os aliados, concedendo Poder do Músico × 5 PM temporários durante aquele combate." }
    ]
  },
  {
    id: "piloto",
    nome: "Piloto",
    emoji: "⚓",
    requisito: "Máquinas",
    habilidades: [
      { nivel: 1,  nome: "Em Alto Curso",              desc: "Recebe Ganho em testes de pilotagem com veículos em movimento, além de não sofrer Perda por penalidades de trajetos complicados. Pode executar a manobra Defensiva de um veículo (ver Veículos)." },
      { nivel: 5,  nome: "Instinto de Piloto",          desc: "Uma vez por cena pode gastar 4 PM para rerolar um teste de defesa do veículo, ficando com o melhor resultado." },
      { nivel: 10, nome: "Posição Estratégica",        desc: "Pode gastar uma Ação Completa para manter o veículo em posição estratégica — todos os ataques derivados do veículo recebem Ganho naquele turno." },
      { nivel: 15, nome: "Comigo Pilotando Não Tem Erro", desc: "Uma vez por viagem, ao avistar uma situação de conflito, pode gastar 10 PM e forçar o veículo a velocidade extrema. O veículo perde 5D6 de PV, mas o grupo foge do conflito imediatamente." }
    ]
  },
  {
    id: "comandante",
    nome: "Comandante",
    emoji: "🏴‍☠️",
    requisito: "Influência",
    habilidades: [
      { nivel: 1,  nome: "Avante!",                        desc: "Ao início de um combate, escolha aliados em quantidade igual ao seu PODER — eles recebem Ganho no teste de iniciativa." },
      { nivel: 5,  nome: "Cai Pra Porrada!",               desc: "Caso um aliado em alcance Curto vá receber um ataque, como Reação pode gastar 4 PM e testar Poder contra a Resistência do atacante. Se vencer, o ataque é redirecionado a você e você possui 1 Ganho no teste de defesa." },
      { nivel: 10, nome: "Eu Confio no Seu Potencial",     desc: "Durante um combate, no seu turno, pode gastar uma Ação Completa para ceder uma ação extra a um aliado em alcance Curto." },
      { nivel: 15, nome: "Não Toque no Meu Grupo!",        desc: "Para cada aliado que você presenciar ser derrotado, recebe 20 PV temporários, 20 PM temporários e 2 PA durante a cena." }
    ]
  }
]
