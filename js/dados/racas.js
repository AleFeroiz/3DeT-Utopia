// ============================================================
//  dados/racas.js — Raças do sistema (Livro de Regras 3DeT Utopia)
// ============================================================

export const RACAS = [
  {
    id: "humano",
    nome: "Humanos",
    emoji: "🧑",
    custo: 0,
    extras: ["+2 PA"],
    vantagens: [
      { nome: "Adaptação", desc: "Humanos são um faz-tudo. Escolha três perícias para serem treinadas gratuitamente na criação do personagem." },
      { nome: "Esforçados", desc: "Humanos sempre precisaram trabalhar duro para se tornarem alguém. Comece sua ficha com +2 Pontos de Ficha adicionais." }
    ],
    desvantagens: [
      { nome: "Aspectos Humanos", desc: "Escolha um dos seguintes defeitos:\n• Ganância: Sempre que esteja diante de um tesouro ou oportunidade de lucro, qualquer teste relacionado recebe Perda.\n• Gula: Sempre que estiver perto de comida, terá que comê-la. Caso queira resistir, teste Resistência (9). Em combate, essa distração custa sua Ação.\n• Inveja: Ao ver outro personagem tirar um Sucesso Crítico, receba automaticamente -3 no seu próximo teste.\n• Ira: Você falha automaticamente em testes de Resistência contra provocações.\n• Luxúria: Sofre -3 em testes de Resistência e Defesa contra seres pelos quais sente atração.\n• Preguiça: Leva o dobro do tempo para completar um Descanso Longo e não recupera recursos em Descansos Curtos normalmente.\n• Orgulho: Em todo tipo de situação social, sofre -3 no total do teste." },
      { nome: "Cicatrizes do Mundo Antigo", desc: "Escolha um trauma. Sempre que a situação do trauma se apresentar, teste Resistência DT 9 — se passar, supera a cicatriz e age normalmente. Se falhar, sofre o efeito:\n• Poder: Em confronto direto onde claramente é o mais fraco, sua ação é forçadamente defensiva ou de fuga naquele turno.\n• Evolução: Ao se deparar com algo novo para aprender, resolver ou se adaptar, sofre Perda no teste.\n• União: Quando uma ação beneficia aliados mas não a si mesmo, não consegue executá-la naquele turno." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Diversificado",
        desc: "Humanos têm 1 Maestria a mais como limite permanente, e o custo de Maestria é reduzido para 1 ponto."
      },
      {
        nivel: 6,
        nome: "Treinado",
        desc: "Escolha uma das Técnicas de Anima para desbloquear — seu custo de aquisição é reduzido em 1 ponto (exceto Anima da Pressão, caso não possua o requisito)."
      },
      {
        nivel: 10,
        nome: "Sortudo",
        desc: "Uma vez por turno, pode gastar 5 PV para ganhar 1 PA temporário."
      }
    ]
  },
  {
    id: "mirrin",
    nome: "Mirrins",
    emoji: "🌿",
    custo: 0,
    extras: ["Esquiva +3", "Perícia: Manha (grátis)"],
    vantagens: [
      { nome: "Presença Insignificante", desc: "Em testes de furtividade, receba 2 × Nível de bônus. Em situações sociais onde o interlocutor claramente te subestime, receba Ganho em testes de blefe, negociação e persuasão." },
      { nome: "Golpe Calculado", desc: "Sempre que atacar um alvo que não sabe da sua presença, o teste de ataque pode ser baseado em Manha no lugar do atributo normal." },
      { nome: "Furtividade Irrestrita", desc: "Pode tentar se esconder em qualquer situação — mesmo sem cobertura ou escuridão. Em ambientes sem condições favoráveis, receba Perda no teste em vez de ser negado automaticamente." }
    ],
    desvantagens: [
      { nome: "Corpo Frágil", desc: "Sofra Perda em testes de Resistência que envolvam esforço físico." },
      { nome: "Inofensivo", desc: "Testes de intimidação falham automaticamente. Em situações que dependam de causar medo ou impor presença física, a falha crítica passa a ser 1, 2 e 3." },
      { nome: "Custo da Confiança", desc: "Quando alguém em quem confia te trai, sofre Perda em todos os testes pela cena inteira." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Agilidade",
        desc: "Duas habilidades são desbloqueadas:\n• Dash (Ação Livre): Gaste PM para aumentar seu deslocamento atual em +2 metros por PM gasto. Limite: Habilidade PM por uso.\n• Esquiva Ativa (1 PM): Ao ser alvo de um ataque, declare Esquiva Ativa — o teste de defesa passa a ser baseado em Manha no lugar do atributo normal."
      },
      {
        nivel: 6,
        nome: "Informação",
        desc: "Duas habilidades são desbloqueadas:\n• Leitura de Intenções (passiva): Ao interagir com qualquer ser, você automaticamente recebe uma leitura de intenção — o Mestre indica se a intenção do ser é hostil, neutra ou amigável, sem necessidade de teste.\n• Eu Conheço Alguém (1× por missão): Acione um contato na região onde o grupo se encontra. O contato pode ajudar com informação, abrigo, equipamento, conserto ou recursos — validado pelo Mestre com base no local atual e na história do personagem."
      },
      {
        nivel: 10,
        nome: "Das Sombras, Sempre",
        desc: "Ao atacar enquanto furtivo e acertar, gaste 6 PM para se esconder novamente como Ação Livre imediatamente após o golpe. Se falhar no ataque, o custo cai para 3 PM."
      }
    ]
  },
  {
    id: "lumari",
    nome: "Lumaris",
    emoji: "🔥",
    custo: 0,
    extras: ["Resistência a Fogo", "Perícia: Mística (grátis)"],
    vantagens: [
      { nome: "Voo", desc: "Pode usar sua Ação de Movimento para voar com deslocamento padrão. Levantar voo do chão usa um Movimento e custa 1 PM. Manter-se no ar não tem custo — apenas levantar novamente após pousar ou cair." },
      { nome: "Domo de Chama", desc: "A chama nas costas não é apenas símbolo — é ferramenta. Permite os seguintes usos:\n• Ataque Flamejante (3 PM): Mude o tipo de dano do seu ataque para Fogo.\n• Haja Luz! (1 PM): Projete a chama para iluminar um ponto em alcance Curto ao redor." }
    ],
    desvantagens: [
      { nome: "Caçados", desc: "Sempre que for caçado, os caçadores são 1 grau acima de dificuldade." },
      { nome: "Isolados", desc: "Em situações sociais que exijam testes, sofra Perda. Caso o interlocutor já demonstre hostilidade, ele recebe Ganho contra você." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Expansão do Domo",
        desc: "Três habilidades são desbloqueadas:\n• Reação Flamejante (4 PM): Ao receber dano de um ataque, como Reação, libere uma explosão de chama — ataque com Mística com 2 Ganhos, causando dano de Fogo a todos em alcance Curto.\n• Modo Ofensivo (2 PM): Some seu atributo de ataque duas vezes e receba um Movimento extra caso esteja voando — mas fica Indefeso.\n• Modo Defensivo (2 PM): Some sua Resistência novamente e receba 1 Ganho na Defesa — mas recebe Perda em testes de ataque.\nApenas um Modo pode estar ativo por vez. Alternar entre Modos custa 2 PM no início do seu turno."
      },
      {
        nivel: 7,
        nome: "Chama Interior",
        desc: "A chama não é só externa — ela queima por dentro também.\n• Você se torna imune a condições mentais de Grau Leve e recebe resistência a condições mentais de Grau Moderado — testes para se livrar delas são feitos com Ganho.\n• Pode gastar 1 PV para recuperar 1 PM como ação livre e pode repetir o processo como ação livre."
      },
      {
        nivel: 12,
        nome: "Eu Sou Seu Pesadelo",
        desc: "Com o Domo ativo, gaste 15 PM e não efetue ações ofensivas — você se torna completamente invulnerável e imune a qualquer efeito negativo e ataque durante a rodada. Uso limitado a 1 vez por combate."
      }
    ]
  },
  {
    id: "gigante",
    nome: "Gigantes",
    emoji: "🏔️",
    custo: 0,
    extras: ["Resistência a Impacto", "+20 PV"],
    vantagens: [
      { nome: "Força Colossal", desc: "Em situações que exigem força física ou ataques corpo a corpo, o crítico passa a ser 5 e 6." },
      { nome: "Corpo Assustador", desc: "Quando intimidando ou causando medo, receba +3 no total do teste." },
      { nome: "Passada Longa", desc: "Seu deslocamento de Movimento é o dobro do padrão (18m)." }
    ],
    desvantagens: [
      { nome: "Corpo Devagar", desc: "Em testes de agilidade, receba Perda." },
      { nome: "Que Diabos É Isso?", desc: "Em enigmas, textos complexos, entrelinhas sociais e máquinas, sofra Perda nesses testes — a falha crítica passa a ser 1 e 2." },
      { nome: "Acerta o Grandão!", desc: "Em testes de Esquiva, receba Perda. Acertar um Gigante é mais fácil — eles simplesmente aguentam." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "O Grandão Vai Te Pegar",
        desc: "Ao usar a manobra de Agarrar, receba 3 × Nível de bônus no teste."
      },
      {
        nivel: 6,
        nome: "Fúria de Guerra",
        desc: "Quando estiver abaixo da metade do PV, entra em estado de Fúria enquanto em combate — recebe 1 Ganho em todos os testes de ataque e Resistência. Uma vez por cena ao entrar em Fúria, solta um Grito de Guerra: todos os aliados em alcance Médio removem uma condição negativa de Grau Leve e recebem +3 em testes de ataque até o fim do próximo turno."
      },
      {
        nivel: 10,
        nome: "Sumam da Vista!",
        desc: "Seus ataques corpo a corpo atingem todos os alvos em alcance Curto do alvo principal simultaneamente."
      }
    ]
  },
  {
    id: "celestial",
    nome: "Celestiais",
    emoji: "🪶",
    custo: 0,
    extras: ["Resistência a Vento", "Perícia: Influência (grátis)"],
    vantagens: [
      { nome: "Voo", desc: "Pode usar sua Ação de Movimento para voar com deslocamento padrão. Levantar voo do chão usa um Movimento e custa 1 PM. Manter-se no ar não tem custo — apenas levantar novamente após pousar ou cair." },
      { nome: "Presença Celestial", desc: "Em situações sociais que exijam testes, receba Ganho — exceto intimidação." },
      { nome: "Pacifista", desc: "Em conflitos diplomáticos, receba Ganho na iniciativa e +2 em testes de ataque social." }
    ],
    desvantagens: [
      { nome: "Filho do Céu", desc: "Em ambientes fechados (casas, estruturas, cavernas), receba Perda em situações de agilidade e testes de Defesa." },
      { nome: "Pureza Frágil", desc: "Ao receber dano do tipo Veneno, some +3 no dano recebido." },
      { nome: "Pacifista", desc: "Em combates violentos, receba Perda na iniciativa e -2 em todos os testes de ataque físico." }
    ],
    evolucoes: [
      {
        nivel: 3,
        nome: "Asa Leve",
        desc: "Levantar voo não possui custo. Pode gastar 2 PM para recuperar uma Ação de Movimento enquanto no ar."
      },
      {
        nivel: 6,
        nome: "Auréola de Influência",
        desc: "Receba Maestria em Influência (sem contar no limite de Maestrias). Você recebe resistência a ataques e efeitos de natureza mental."
      },
      {
        nivel: 10,
        nome: "Exaltação / Queda Redentora",
        desc: "O ápice da natureza celestial se manifesta de duas formas:\n• Exaltado (passiva): Enquanto voando, some seu atributo de ataque novamente em testes de ataque.\n• Queda Redentora (Reação, 8 PM): Ao pousar involuntariamente ou ser derrubado, ative como Reação — libere uma onda de presença ao redor. Todos em alcance Curto testam Poder contra o seu Poder. Quem falhar recebe Perda em todos os testes por 1D rodadas. Uso limitado a 1 vez por combate."
      }
    ]
  },
  {
    id: "primal_terrestre",
    nome: "Primal Terrestre",
    emoji: "🌿",
    custo: 0,
    extras: ["Esquiva +3", "Resistência a Veneno"],
    vantagens: [
      { nome: "Faro Aguçado", desc: "Receba Ganho em todos os testes de Percepção baseados em olfato, audição ou rastreamento. Você recebe 2 × Nível em testes para evitar ser surpreendido por inimigos em até alcance Médio." },
      { nome: "Forma Fera", desc: "Quando ativada: PODER e RESISTÊNCIA recebem +4, além de PV e PM temporários (metade de seu PV/PM máximo). Custo de manutenção: 2 PM por turno. No início de cada turno na Forma, teste Resistência DT 12 — se falhar, ataca o ser mais próximo. Para sair voluntariamente: DT começa em 12, aumenta +3 a cada turno. Saída forçada: PM zerado, inconsciente ou estado Morrendo." }
    ],
    desvantagens: [
      { nome: "Forma Fera (Descontrole)", desc: "Caso PM chegue a zero dentro da Forma, o personagem entra diretamente em estado Morrendo — sem passar por inconsciente." },
      { nome: "Territorial", desc: "Em situações onde seu clã, seu território ou alguém sob sua proteção é ameaçado diretamente, teste Resistência DT 12. Se falhar, reage de forma instintiva e agressiva — ação diplomática fica impossível até o fim da cena." }
    ],
    evolucoes: [
      {
        nivel: 1,
        nome: "Poder Animal I",
        desc: "Crie uma característica especial representando seu animal de Escala de Poder 3, definida junto ao Mestre com base na linhagem do personagem."
      },
      {
        nivel: 9,
        nome: "Poder Animal II",
        desc: "Melhore sua característica para Escala de Poder 4. Além disso, passa a manter +2 em PODER ou RESISTÊNCIA (escolha na evolução) permanentemente."
      },
      {
        nivel: 14,
        nome: "Poder Animal III — Fusão",
        desc: "Melhore sua característica para Escala de Poder 5. O custo de manutenção da Forma Fera cai para 1 PM/turno. A Forma Fera não possui mais limite diário. Ao falhar no teste de controle dentro da Forma, em vez de atacar o mais próximo automaticamente, você escolhe o alvo."
      }
    ]
  },
  {
    id: "primal_aquatico",
    nome: "Primal Aquático",
    emoji: "🌊",
    custo: 0,
    extras: ["Resistência a Impacto", "Contra-ataque +3"],
    vantagens: [
      { nome: "Corpo Abissal", desc: "Primais Aquáticos são 10 vezes mais fortes que um humano comum. Receba +3 em testes de força física bruta (mover objetos pesados, arrombar estruturas, resistir a imobilização). A cada nível até o 10, escolha PODER ou RESISTÊNCIA para aumentar em +1 gratuitamente." },
      { nome: "Domínio Aquático", desc: "Em combate dentro ou imediatamente próximo à água, receba Ganho em testes de ataque e defesa. Pode respirar debaixo da água indefinidamente e tem 3 vezes o deslocamento padrão dentro dela." }
    ],
    desvantagens: [
      { nome: "Rancor das Correntes", desc: "Escolha uma raça que seu personagem carrega rancor profundo. Na primeira cena com um ser dessa raça, teste Resistência DT 12 para não agir de forma hostil. Qualquer desrespeito ou ameaça desse ser dispara o teste automaticamente novamente." },
      { nome: "Sede do Mar", desc: "Em ambientes secos ou quentes, receba Perda em todos os testes físicos (incluindo combate)." }
    ],
    evolucoes: [
      {
        nivel: 1,
        nome: "Poder Animal I + Sangue do Mar",
        desc: "Crie uma característica especial representando seu animal aquático de Escala de Poder 3. Além disso, pode gastar 4 PM para ativar um dos seguintes efeitos:\n• Pressão Profunda: Some sua Resistência novamente em um ataque corpo a corpo.\n• Pulso Vital: Cure 1D de PV em si mesmo ou em um aliado ao toque.\n• Barreira de Maré: Some sua Resistência novamente no próximo teste de Defesa."
      },
      {
        nivel: 9,
        nome: "Poder Animal II + Potencial Aquático",
        desc: "Melhore sua característica para Escala de Poder 4. Quando usar uma técnica ofensiva estando submerso ou próximo de água disponível, gaste 4 PM para somar PODER no resultado. Fora da água, pode gastar 6 PM para conjurar umidade do próprio corpo, suspendendo Sede do Mar por uma cena. Uso limitado a metade do PODER por Descanso Longo."
      },
      {
        nivel: 14,
        nome: "Poder Animal III — Rei das Profundezas",
        desc: "Melhore sua característica para Escala de Poder 5. Os efeitos de Sede do Mar são suspensos permanentemente. Uma vez por cena, ative a Pressão das Profundezas:\n• Pressão Leve (6 PM): Todos em alcance Curto testam Resistência contra seu Poder — quem falhar sofre Incapacitação Leve por 1 rodada.\n• Pressão Moderada (10 PM): Todos em alcance Curto testam Resistência contra seu Poder — quem falhar sofre Incapacitação Moderada por 1 rodada."
      }
    ]
  },
  {
    id: "primal_voador",
    nome: "Primal Voador",
    emoji: "🌬️",
    custo: 0,
    extras: ["Esquiva +3", "Resistência a Vento"],
    vantagens: [
      { nome: "Voo Natural", desc: "Levantar voo não tem custo de PM. Pode usar sua Ação de Movimento para voar com deslocamento padrão — ou gastar 2 PM para voar com deslocamento dobrado em linha reta naquele turno." },
      { nome: "Visão de Predador", desc: "Receba Ganho em testes de Percepção visual a longa distância. Nunca sofre penalidade de alcance em testes de Percepção." },
      { nome: "Laço do Bando", desc: "Quando estiver em combate ao lado de pelo menos um aliado, receba +2 em testes de Defesa." }
    ],
    desvantagens: [
      { nome: "Sem Bando", desc: "Quando estiver sozinho em combate (sem aliados em alcance Médio), sofra Perda em testes de Defesa." },
      { nome: "Ossos Leves", desc: "Quando atingido por dano do tipo Impacto ou Pancada, o dano recebido soma +2." }
    ],
    evolucoes: [
      {
        nivel: 1,
        nome: "Poder Animal I + Manobra Aérea",
        desc: "Crie uma característica especial representando seu animal de Escala de Poder 3. Além disso, duas manobras são desbloqueadas:\n• Mergulho Rasante (3 PM): Como parte de um ataque, mergulhe em alta velocidade — receba Ganho no ataque e, se acertar, o alvo testa Resistência contra seu Poder ou é empurrado para alcance Curto.\n• Saída em Voo (Reação, 2 PM): Ao ser alvo de ataque corpo a corpo, desloque-se verticalmente antes da resolução — o atacante ainda rola, mas com Perda."
      },
      {
        nivel: 9,
        nome: "Poder Animal II + Vínculo do Bando",
        desc: "Melhore sua característica para Escala de Poder 4. Uma vez por cena, gaste 4 PM para o Chamado — todos os aliados que ouvirem você recebem 1 Ganho no próximo teste. Enquanto voando, pode usar sua Ação de Movimento para reposicionar um aliado de tamanho igual ou menor até alcance Curto."
      },
      {
        nivel: 14,
        nome: "Poder Animal III — Tempestade Viva",
        desc: "Melhore sua característica para Escala de Poder 5. Enquanto voando, você pode se mover através de alvos sem provocar ataques de oportunidade. Uma vez por combate, realize um Sobrevoo Devastador — mova-se em linha reta atingindo até 3 alvos em sequência com um único teste de ataque (role uma vez, aplique contra todos)."
      }
    ]
  },
  {
    id: "mestico",
    nome: "Mestiço",
    emoji: "🔀",
    custo: 1,
    extras: ["Escolha 1 extra de cada raça de origem"],
    vantagens: [
      { nome: "Herança Dupla", desc: "Escolha 1 vantagem de cada uma das duas raças de origem." }
    ],
    desvantagens: [
      { nome: "Conflito Genético", desc: "Escolha 1 desvantagem de cada uma das duas raças de origem." }
    ],
    evolucoes: [
      {
        nivel: null,
        nome: "Evoluções Mistas",
        desc: "Escolha quais evoluções serão adotadas de ambas as raças — não podendo ser todas de apenas uma. A escolha é feita na criação e não pode ser alterada:\n• Evolução do 1º nível de uma das raças.\n• Evolução do 2º nível de uma das raças.\n• Evolução do 3º nível de uma das raças."
      }
    ]
  },
  {
    id: "modificado",
    nome: "Modificado",
    emoji: "⚙️",
    custo: 1,
    extras: ["1 extra da raça de origem + 1 extra coerente com a modificação"],
    vantagens: [
      { nome: "Aprimoramento", desc: "1 vantagem da raça de origem + 1 vantagem decorrente da modificação." }
    ],
    desvantagens: [
      { nome: "Efeito Colateral", desc: "1 desvantagem da raça de origem + 1 desvantagem decorrente da modificação." }
    ],
    evolucoes: [
      {
        nivel: null,
        nome: "Evoluções Narrativas",
        desc: "Escolha evoluções da raça de origem que sejam coerentes com o estado atual do personagem. Caso não sejam, crie com o Mestre evoluções narrativas e mecânicas que reflitam o caminho específico da modificação — sem molde fixo, sem padrão definido."
      }
    ]
  }
]
