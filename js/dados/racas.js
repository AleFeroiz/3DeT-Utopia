// ============================================================
//  dados/racas.js — Raças do sistema (Livro págs. 2–7)
// ============================================================

export const RACAS = [
  {
    id: "anao",
    nome: "Anões (Tontatas)",
    emoji: "🌱",
    custo: 0,
    extras: ["Esquiva +3", "Perícia: Manha (grátis)"],
    vantagens: [
      { nome: "Mestre do Sumiço", desc: "Anões são mestres em desaparecer sem deixar rastro. Enquanto estiver furtivo, você soma 1× Habilidade em testes de ataque, defesa e resistência." },
      { nome: "Cadê o Pequeno?", desc: "Pela sua natureza, anões são complicados de serem avistados. Em testes de furtividade, você recebe 2× nível de bônus no teste, e pode gastar 3 PM para adicionar mais um Ganho." }
    ],
    desvantagens: [
      { nome: "Ingenuidade", desc: "Anões são seres ingênuos e tendem a acreditar em tudo, independente com quem conversam! Sofra perda e a falha crítica passa a ser 1 e 2 em qualquer situação que possa duvidar da veracidade do comunicador." },
      { nome: "Corpo Fraco", desc: "Anões, por serem pequenos, não possuem uma constituição comum. Sofra perda ao realizar qualquer teste que se baseie em RESISTÊNCIA pelo porte FÍSICO (vigor)." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Sombra Persistente",
        desc: "O Anão domina o ambiente ao seu redor de forma assustadora. As seguintes habilidades são desbloqueadas:\n• Piscar (2 PM): Teleporte curto. Caso faça isso para se esconder, recebe 1 Ganho no teste. Pode ser feito uma quantidade de vezes igual à sua Habilidade por combate.\n• Hospedeiro: Pode se esconder dentro das roupas de um ser próximo, recebendo Ganho na furtividade. Caso o hospedeiro receba dano, você recebe metade do dano e perde a furtividade.\n• Ataque Sorrateiro: Sempre que atacar enquanto furtivo, seu teste de ataque pode ser baseado como um teste de furtividade."
      },
      {
        nivel: 5,
        nome: "Pequeno mas Traiçoeiro",
        desc: "O Anão aprendeu que ser subestimado é sua maior arma. Em situações sociais onde o interlocutor o subestime por seu tamanho ou aparência — o que é quase sempre — você recebe Ganho em testes de blefe, negociação e persuasão."
      },
      {
        nivel: 10,
        nome: "Das Sombras, Sempre",
        desc: "O Anão tornou-se uma presença que ninguém consegue fixar. Sempre que atacar enquanto furtivo e acertar, pode gastar 6 PM para se esconder novamente como ação livre imediatamente após o golpe. Caso fracasse no ataque, o custo cai para 3 PM."
      }
    ]
  },
  {
    id: "celestial",
    nome: "Celestiais",
    emoji: "🪽",
    custo: 0,
    extras: ["Resistência a vento", "Perícia: Influência (grátis)"],
    vantagens: [
      { nome: "Voo", desc: "Você pode voar! Pode usar sua ação de movimento para voar seguindo o mesmo deslocamento. Em combate, levantar voo quando você está no chão usa um movimento e gasta 1 PM. Você não precisa gastar mais PM para manter-se no ar, mas gasta se quiser levantar voo novamente após pousar (ou cair) por qualquer motivo." },
      { nome: "Oh Belo Ser…", desc: "Seres celestiais são belos e com uma forte presença, capazes de persuadir qualquer ser mais facilmente. Em situações sociais onde você precisa convencer alguém, você recebe um Ganho." },
      { nome: "Ataque Aéreo", desc: "Quando atacar do ar contra um alvo que esteja no solo, você recebe um Ganho no ataque. Caso o alvo esteja em alcance médio, pode gastar 3 PM adicionais para um Ataque de Mergulho: aplique mais um Ganho no ataque, mas irá até o solo e próximo ao alvo." }
    ],
    desvantagens: [
      { nome: "Anjo Caído", desc: "Os celestiais estão acostumados com a atmosfera dos céus. Caso esteja em ambientes fechados (casas, prédios, etc.) receba perda em qualquer situação de agilidade e em testes de defesa." },
      { nome: "O Chão me Incomoda", desc: "Os celestiais lutam nos céus, lutar em terra não é uma boa ideia para eles. Caso entre em luta corpo a corpo sem estar em voo, seu teste de defesa recebe perda no total." },
      { nome: "Pureza Frágil", desc: "Celestiais têm uma constituição física delicada por natureza. Quando atingidos por dano de tipo Veneno ou Doença, o efeito é tratado como um grau acima do normal. Representa o corpo etéreo deles sendo pouco adaptado às impurezas do mundo terrestre." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Asa Leve",
        desc: "As asas se tornam mais resistentes e você aprende manobras aéreas. Levantar voo não possui custo. Pode gastar 2 PM para recuperar uma ação de movimento no ar."
      },
      {
        nivel: 6,
        nome: "Auréola de Influência",
        desc: "Sua presença celestial é notória; seu prestígio abre portas e protege. Recebe maestria de INFLUÊNCIA (não considera limite de maestria). Você recebe resistência a ataques e efeitos envolvendo o mental."
      },
      {
        nivel: 10,
        nome: "Exaltação / Queda Redentora",
        desc: "O ápice da natureza celestial se manifesta de duas formas dependendo de onde você está.\n• Modo Exaltado (passiva): Enquanto voando, você soma seu atributo de ataque novamente em testes de ataque.\n• Queda Redentora (reação, 8 PM): Ao pousar involuntariamente ou ser derrubado ao solo, pode ativar como reação. Solte uma onda de presença celestial — todos em alcance curto devem testar Poder contra o seu Poder. Quem falhar sofre Perda em todos os testes por 1D rodadas. Uso limitado a 1 vez por combate."
      }
    ]
  },
  {
    id: "lunario",
    nome: "Lunarios",
    emoji: "🔥",
    custo: 0,
    extras: ["Resistência a fogo", "Perícia: Mística (grátis)"],
    vantagens: [
      { nome: "Voo", desc: "Você pode voar! Pode usar sua ação de movimento para voar seguindo o mesmo deslocamento. Em combate, levantar voo quando você está no chão usa um movimento e gasta 1 PM. Você não precisa gastar mais PM para manter-se no ar, mas gasta se quiser levantar voo novamente após pousar (ou cair)." },
      { nome: "O Domo do Fogo!", desc: "Lunarios possuem uma chama em suas costas que permite grande amplitude de utilidades. Seu domo de fogo te fornece: Ataque Flamejante (3 PM) — mude o tipo de dano do seu ataque para fogo; Haja Luz! (1 PM) — crie um fogo em um ponto que ilumina os arredores em alcance curto." }
    ],
    desvantagens: [
      { nome: "Caçados", desc: "Os lunarios são constantemente caçados por ser uma espécie extremamente rara. Sua reputação naturalmente tem -3." },
      { nome: "Isolados", desc: "Os lunarios viveram a maior parte de suas vidas isolados das sociedades. Em situações sociais que exijam qualquer teste, sofra perda, e caso seja detestado pelo opositor, o opositor possuirá Ganho." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Expansão do Domo",
        desc: "O Domo de Fogo cresce e revela novas possibilidades. Habilidades desbloqueadas permanentemente enquanto o Domo estiver nas suas costas:\n• Reação Flamejante (4 PM): Ao receber dano de um ataque, pode como reação ativar uma explosão de fogo. Ataque com Mística e 2 Ganhos, causando dano de fogo a todos em alcance curto.\n• Modo Ofensivo (2 PM): Todos os ataques somam o atributo de ataque 2 vezes e você recebe uma movimentação extra caso esteja voando, mas se torna Indefeso.\n• Modo Defensivo (2 PM): Some sua Resistência novamente e 1 Ganho na defesa, mas recebe Perda em testes de ataque.\nApenas um Modo pode estar ativo por vez. Alternar entre Modos custa 2 PM no início do seu turno."
      },
      {
        nivel: 7,
        nome: "Chama Interior",
        desc: "Anos de isolamento e sobrevivência forjaram algo inabalável dentro de você. Sua chama não é só externa — ela queima por dentro também.\n• Você se torna imune a condições mentais de Grau Leve e recebe resistência a condições mentais de Grau Moderado — o teste de Resistência para se livrar delas é feito com Ganho.\n• Você pode gastar 1 PV para recuperar 1 PM, representando a força de vontade que transforma dor em combustível. Não há limite de usos por turno, mas o custo mínimo de qualquer habilidade continua sendo 2 PM."
      },
      {
        nivel: 12,
        nome: "Eu Sou Seu Pesadelo",
        desc: "Você quer muito me destruir? Que pena… Quando estiver com o Domo de Fogo ativado em suas costas, gaste 15 PM e não efetue ações ofensivas para se tornar completamente invulnerável e imune a qualquer efeito negativo e ataque durante a rodada."
      }
    ]
  },
  {
    id: "mink",
    nome: "Minks",
    emoji: "🐾",
    custo: 0,
    extras: ["Resistência a choque", "Esquiva +3"],
    vantagens: [
      { nome: "Super Choque", desc: "Seu ataque é legal… mas e se tiver RAIOS nele? Quando efetuar um ataque, pode gastar 2 PM para mudar o tipo de dano para choque." },
      { nome: "Velocidade Animalesca", desc: "Minks, por sua fisionomia animal, conseguem ter velocidades além do normal. Minks possuem uma ação de movimento extra." },
      { nome: "Forma Sulong", desc: "A luz da lua cheia é maravilhosa… Ao presenciar a lua cheia, seu corpo é totalmente modificado e sua mente dominada; entra em um estado de fúria e temporariamente seus atributos aumentam +4 e recebe metade do seu limite máximo em PV E PM temporários até o fim da cena." }
    ],
    desvantagens: [
      { nome: "Instinto Animal", desc: "Escolha \"algo\" para ser sua obsessão animal, coerente ao seu tipo (um coelho seria uma cenoura). Toda vez que avistar esse \"algo\", faça um teste de Resistência (9) para evitar ficar DISTRAÍDO." },
      { nome: "Adoro um Humano!", desc: "Minks são fascinados pelos humanos, tendendo a gostar e apoiar muito qualquer humano! Em situações onde estiver com um humano, qualquer teste que envolva convencer ou ferir o humano recebe uma perda." },
      { nome: "Forma Sulong (Descontrole)", desc: "Ao presenciar a lua cheia, seu corpo é totalmente modificado e sua mente dominada. Entra em estado de fúria e, toda vez que for agir, deve fazer um teste de Resistência (12) — o bônus temporário de atributo não conta para esse teste. Se passar, tem controle total; caso contrário, ataca o ser mais próximo. A cada turno, perde 1D6 de PM; ao chegar a 0 PM, entra em estado Morrendo direto. Para evitar, pode sair da forma transformada evitando olhar a lua (1 rodada completa sem enxergá-la)." }
    ],
    evolucoes: [
      {
        nivel: 1,
        nome: "Poder Animal I",
        desc: "Ser um animal possui suas características natas! Crie uma habilidade especial de Mink representando seu animal de Escala de Poder 3."
      },
      {
        nivel: 9,
        nome: "Poder Animal II",
        desc: "Melhore sua habilidade especial de Mink representando seu animal para Escala de Poder 4."
      },
      {
        nivel: 14,
        nome: "Poder Animal III",
        desc: "Melhore sua habilidade especial de Mink representando seu animal para Escala de Poder 5."
      }
    ]
  },
  {
    id: "gigante",
    nome: "Gigantes",
    emoji: "🏔",
    custo: 0,
    extras: ["Resistência a impacto", "Contra-ataque +3"],
    vantagens: [
      { nome: "Força Colossal", desc: "Seu tamanho lhe oferece uma grande força para lidar com coisas extremamente pesadas… ou só pra literalmente descer a porrada mesmo! Em situações que exigem força física ou ataques corpo a corpo, o crítico passa a ser 5 e 6." },
      { nome: "Corpo Assustador", desc: "Com seu corpo gigantesco, não é qualquer um que consegue bater de frente! Gigantes em situações que estão intimidando ou botando medo recebem +3 no total do teste." },
      { nome: "Lento, mas Grande", desc: "Apesar de ser lento, gigantes têm a perna bem longa (literalmente) e seu deslocamento é fora do comum! Seu deslocamento de movimento é o dobro do comum (18m)." }
    ],
    desvantagens: [
      { nome: "Corpo Devagar", desc: "Gigantes geralmente tendem a ser devagar em reações ágeis por seu tamanho brutamontes! Em testes de agilidade, receba uma perda no teste." },
      { nome: "Que Diabos é Isso?", desc: "Gigantes são seres mais \"vikings\" e por isso não entendem muito de tecnologias ou histórias. Situações onde você precisa raciocinar textos complicados, enigmas, entrelinhas sociais e lidar com máquinas sofrem 1 perda e a falha crítica se torna 1 e 2." },
      { nome: "Acerta o Grandão Ali!", desc: "Acertar um gigante por conta do seu tamanho é algo extremamente mais fácil do que acertar seres pequenos. Em testes de esquiva, você recebe uma perda." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "O Grandão Vai Te Pegar",
        desc: "Com sua força enorme, gigantes têm extrema facilidade pra imobilizar um ou múltiplos alvos. Ao usar a manobra agarrar, receberá 3× Nível de bônus no teste para agarrar."
      },
      {
        nivel: 6,
        nome: "Fúria Viking",
        desc: "A batalha acende algo ancestral; quanto mais sangue, mais forte o grito. Quando você estiver abaixo da metade do seu PV, entra em estado de Fúria enquanto estiver em combate, recebendo 1 Ganho em todos os testes de ataque e resistência. Além disso, uma vez por cena ao entrar em Fúria, você solta um Grito de Guerra instintivo: todos os aliados em alcance médio removem imediatamente uma condição negativa de Grau Leve e recebem +3 em testes de ataque até o fim do seu próximo turno."
      },
      {
        nivel: 10,
        nome: "Sumam da Vista!",
        desc: "Seus ataques são destrutivos demais; o mais simples ataque não leva só um, como vários! Quando você efetuar um ataque corpo a corpo, o ataque pega em todos que estejam a um alcance curto do alvo principal."
      }
    ]
  },
  {
    id: "povo_mar",
    nome: "Povo do Mar",
    emoji: "🦈",
    custo: 0,
    extras: ["Resistência a impacto", "Contra-ataque +3"],
    vantagens: [
      { nome: "Sangue do Mar", desc: "O sangue do Povo do Mar carrega a força do oceano. Gaste 4 PM para ativar um dos seguintes efeitos:\n• Pressão Profunda: Some sua Resistência novamente em um teste de ataque corpo a corpo.\n• Pulso Vital: Toque um aliado e cure 1D de PV.\n• Barreira de Maré: Some sua Resistência novamente no próximo teste de defesa." },
      { nome: "Vem pra Porrada Aquática", desc: "Por natureza sempre viverem na água, são acostumados a lutar dentro dela. Em situações de combate (defender e atacar), você recebe um Ganho no total do teste caso estiver dentro da água." },
      { nome: "Respiração Aquática", desc: "Você pode respirar debaixo da água e tem o triplo do deslocamento dentro dela." }
    ],
    desvantagens: [
      { nome: "Tanto Rancor", desc: "O Povo do Mar carrega gerações de conflito no sangue. Escolha uma raça que seu personagem odeia profundamente. Em situações onde estiver na presença de um ser dessa raça, você instintivamente deseja confrontá-lo. A primeira vez que o vir, caso queira resistir, gire um teste de Resistência (12). Deverá segurar seus instintos novamente caso esse ser apresente desrespeito ou qualquer ameaça." },
      { nome: "Cadê Minha Água?", desc: "EU NÃO VIVO SEM ÁGUA!!! Quando estiver em um ambiente seco ou quente, você recebe perda em qualquer tipo de teste que envolva físico (incluindo combate)." },
      { nome: "Memória das Correntes", desc: "O Povo do Mar carrega no sangue a memória coletiva da opressão. Em situações onde sua liberdade ou autonomia são ameaçadas — captura, aprisionamento, ordens diretas de autoridades — faça um teste de Resistência (9). Se falhar, reage com hostilidade imediata e não consegue agir diplomaticamente até o fim da cena." }
    ],
    evolucoes: [
      {
        nivel: 1,
        nome: "10× Mais Fortes",
        desc: "Povos do mar são conhecidos por serem 10 vezes mais fortes que o homem! Sempre que subir de nível e você for de nível igual ou inferior a 10, escolha PODER ou RESISTÊNCIA para subir um ponto (respeitando o limite de atributo por nível)."
      },
      {
        nivel: 5,
        nome: "Potencial Aquático",
        desc: "Quando usar uma técnica ofensiva, caso esteja submerso ou próximo de água à sua disposição, pode gastar 4 PM para aprimorar seu ataque, somando Poder no ataque.\nFora da água, pode gastar 6 PM para conjurar água do próprio corpo — suspendendo os efeitos de Cadê Minha Água? por uma cena inteira. Você tem esse uso igual à metade do seu Poder por descanso longo."
      },
      {
        nivel: 10,
        nome: "Rei das Profundezas",
        desc: "O mar está em mim, e onde eu estiver, o mar estará também. Os efeitos de Cadê Minha Água? são suspensos permanentemente.\nAlém disso, pode ativar a Pressão das Profundezas uma vez por cena:\n• Pressão Leve (6 PM): Todos em alcance curto testam Resistência contra seu Poder. Quem falhar sofre Incapacitação Leve (deslocamento reduzido à metade) por 1 rodada.\n• Pressão Moderada (10 PM): Todos em alcance curto testam Resistência contra seu Poder. Quem falhar sofre Incapacitação Moderada (deve escolher entre Ação ou Movimento no turno) por 1 rodada.\nO peso do oceano não discrimina aliados de inimigos. Todos em área são afetados."
      }
    ]
  },
  {
    id: "humano",
    nome: "Humanos",
    emoji: "🧍",
    custo: 0,
    extras: ["2 PA"],
    vantagens: [
      { nome: "Adaptação", desc: "Humanos, em sua maioria, sempre foram um faz-tudo. Escolha três perícias para serem treinadas." },
      { nome: "Esforçados", desc: "Humanos sempre precisaram trabalhar duro para se tornarem alguém! Comece sua ficha com 2 Pontos adicionais." }
    ],
    desvantagens: [
      { nome: "Aspectos Humanos", desc: "Escolha um dos seguintes defeitos:\n• Ganância: Sempre que esteja na frente de um tesouro, qualquer teste relacionado recebe perda.\n• Gula: Sua fome é insaciável. Sempre que estiver perto de comida, terá que comê-la. Caso queira resistir, faça um teste de Resistência (9). Em batalha, isso custa sua ação.\n• Inveja: Ao ver um ser ter um sucesso crítico, recebe -3 no seu próximo teste.\n• Ira: Você falha automaticamente em testes de resistência contra provocações.\n• Luxúria: Você sofre -3 em testes de resistência e defesa contra seres do sexo pelo qual você se sente atraído.\n• Preguiça: Você leva o dobro do tempo para considerar um descanso longo e não recebe recuperações em descanso curto.\n• Orgulho: Em todo tipo de situação social, sofre -3 no total do teste." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Diversificado",
        desc: "O potencial dos humanos se baseou em sempre serem diversificados. Os humanos sempre terão 1 maestria a mais como limite, e seu custo de maestria é reduzido a 1 ponto."
      },
      {
        nivel: 6,
        nome: "Treinado",
        desc: "Os Haki são grandes formas de lutar e aquelas das quais os humanos mais tiram proveito. Ao desbloquear esta evolução, escolha um dos Haki para desbloquear (exceto Haki do Rei, caso não possua); seu custo será reduzido em 1 ponto no próximo upgrade."
      },
      {
        nivel: 10,
        nome: "Sortudo",
        desc: "Sempre dando um jeito, mesmo quando a situação não lhe é nada favorável. Pode gastar 5 PV em troca de 1 PA temporário uma vez por turno."
      }
    ]
  },
  {
    id: "mestico",
    nome: "Mestiço",
    emoji: "🧬",
    custo: 1,
    extras: ["Escolha 1 extra de cada raça escolhida"],
    vantagens: [
      { nome: "Herança Dupla", desc: "Escolha 1 vantagem de cada raça escolhida." }
    ],
    desvantagens: [
      { nome: "Conflito Genético", desc: "Escolha 1 desvantagem de cada raça escolhida." }
    ],
    evolucoes: [
      {
        nivel: null,
        nome: "Evoluções Mistas",
        desc: "Escolha evoluções de ambas as raças, não podendo ser inteiramente de uma raça só. A escolha é feita na criação da ficha e não pode ser alterada posteriormente:\n• Evolução do primeiro nível de uma das raças.\n• Evolução do segundo nível de uma das raças.\n• Evolução do terceiro nível de uma das raças."
      }
    ]
  },
  {
    id: "modificado",
    nome: "Modificado",
    emoji: "⚙️",
    custo: 1,
    extras: ["1 extra da raça original + 1 extra coerente com a modificação"],
    vantagens: [
      { nome: "Aprimoramento", desc: "1 vantagem da raça escolhida com coerência ao seu personagem e 1 vantagem fruto da sua modificação." }
    ],
    desvantagens: [
      { nome: "Efeito Colateral", desc: "1 desvantagem da raça escolhida com coerência ao seu personagem e 1 desvantagem fruto da sua modificação." }
    ],
    evolucoes: [
      {
        nivel: null,
        nome: "Evoluções Narrativas",
        desc: "Escolha evoluções de sua raça principal caso sejam coerentes. Se não forem, serão criadas evoluções narrativas e mecânicas frutos da sua modificação."
      }
    ]
  }
]
