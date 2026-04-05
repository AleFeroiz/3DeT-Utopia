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
      { nome: "Mestre do Sumiço", desc: "Esconder-se vira ação de movimento (3 PM → ação livre)." },
      { nome: "Cadê o Pequeno?", desc: "Ganho em furtividade. Gaste 3 PM para +1 ganho adicional." }
    ],
    desvantagens: [
      { nome: "Ingenuidade", desc: "Perda em testes de duvidar de alguém. Falha crítica em 1 e 2." },
      { nome: "Corpo Fraco", desc: "Perda em testes de Resistência por porte físico." }
    ],
    evolucoes: [
      { nivel: 3,  nome: "Piscar", desc: "Gaste 2 PM: teleporte curto. Se for pra se esconder, +1 ganho. Usos = HABILIDADE por combate." },
      { nivel: 5,  nome: "Hospedeiro", desc: "Esconde-se nas roupas de um aliado (bônus HABILIDADE×2 em furtividade). Dano dividido ao ser acertado." },
      { nivel: 10, nome: "Ataque Sorrateiro", desc: "Ataque furtivo usa teste de furtividade. Se falhar, gaste 6 PM para se esconder novamente." }
    ]
  },
  {
    id: "celestial",
    nome: "Celestiais",
    emoji: "🪽",
    custo: 0,
    extras: ["Resistência a vento", "Perícia: Influência (grátis)"],
    vantagens: [
      { nome: "Voo", desc: "Pode voar usando ação de movimento. Levantar voo custa 1 PM no combate." },
      { nome: "Oh Belo Ser…", desc: "Ganho em situações sociais onde precise convencer alguém." },
      { nome: "Ataque Aéreo", desc: "Atacar do ar contra alvo no solo: +1 ganho. Mergulho (3 PM extra): mais um ganho, move-se ao solo." }
    ],
    desvantagens: [
      { nome: "Anjo Caído", desc: "Em ambientes fechados: perda em agilidade e testes de defesa." },
      { nome: "O Chão me Incomoda", desc: "Luta corpo a corpo sem voo: perda no teste de defesa." }
    ],
    evolucoes: [
      { nivel: 3,  nome: "Asa Leve", desc: "Levantar voo sem custo. Gaste 2 PM para recuperar um movimento no ar." },
      { nivel: 6,  nome: "Auréola de Influência", desc: "Maestria de Influência (sem limite). Resistência a ataques mentais." },
      { nivel: 10, nome: "Exaltação / Queda Redentora", desc: "Voando: soma atributo de ataque novamente em testes de ataque." }
    ]
  },
  {
    id: "lunario",
    nome: "Lunarios",
    emoji: "🔥",
    custo: 0,
    extras: ["Resistência a fogo", "Perícia: Mística (grátis)"],
    vantagens: [
      { nome: "O Domo do Fogo!", desc: "Início do turno: gaste 1 PM para manter o domo ativo. Libera: Ataque Flamejante (3 PM, dano fogo) e Haja Luz! (1 PM, iluminação curta)." }
    ],
    desvantagens: [
      { nome: "Caçados", desc: "Em público: role 1D; se <2, aparece um caçador." },
      { nome: "Isolados", desc: "Testes sociais: perda. Se o opositor te desgosta, ele tem ganho." }
    ],
    evolucoes: [
      { nivel: 3,  nome: "O Calor Tá de Matar", desc: "Reação (4 PM): explosão de fogo ao receber dano. Ataque místico c/ 2 ganhos em alcance curto." },
      { nivel: 7,  nome: "Eu Sou um Com o Fogo", desc: "Com Domo ativo, alterne modos (2 PM): Ofensivo (ataque×2, mov extra, fica indefeso) ou Defensivo (+Resistência e ganho na defesa, perda no ataque)." },
      { nivel: 12, nome: "Eu Sou Seu Pesadelo", desc: "Com Domo ativo: 15 PM, sem ações ofensivas → invulnerável e imune a efeitos negativos durante a rodada." }
    ]
  },
  {
    id: "mink",
    nome: "Minks",
    emoji: "🐾",
    custo: 0,
    extras: ["Resistência a choque", "Esquiva +3"],
    vantagens: [
      { nome: "Super Choque", desc: "Gaste 2 PM: muda tipo de dano do ataque para choque." },
      { nome: "Velocidade Animalesca", desc: "Possui uma ação de movimento extra." },
      { nome: "Forma Sulong", desc: "Lua cheia: mente dominada, atributos +4 até fim da cena." }
    ],
    desvantagens: [
      { nome: "Instinto Animal", desc: "Escolha uma obsessão animal. Ao avistar, teste Resistência (9) pra evitar DISTRAÇÃO." },
      { nome: "Adoro um Humano!", desc: "Com humanos: tende a apoiá-los. Testes para convencer/ferir humanos: perda." },
      { nome: "Forma Sulong (Descontrole)", desc: "Lua cheia: teste Resistência (12) por turno. Falha = ataca o mais próximo." }
    ],
    evolucoes: [
      { nivel: 1,  nome: "Poder Animal I",  desc: "Crie uma habilidade especial de Mink (Escala 3)." },
      { nivel: 9,  nome: "Poder Animal II", desc: "Melhore para Escala 4." },
      { nivel: 14, nome: "Poder Animal III",desc: "Melhore para Escala 5." }
    ]
  },
  {
    id: "gigante",
    nome: "Gigantes",
    emoji: "🏔",
    custo: 0,
    extras: ["Resistência a impacto", "Contra-ataque +3"],
    vantagens: [
      { nome: "Força Colossal", desc: "Situações de força física ou C.C: crítico em 5 e 6." },
      { nome: "Corpo Assustador", desc: "+3 em testes de intimidação e medo." },
      { nome: "Lento, mas Grande", desc: "Deslocamento = 18m (dobro do normal)." }
    ],
    desvantagens: [
      { nome: "Corpo Devagar", desc: "Testes de agilidade: perda." },
      { nome: "Que Diabos é Isso?", desc: "Raciocínio, enigmas, tecnologia: perda e falha crítica em 1 e 2." },
      { nome: "Acerta o Grandão Ali!", desc: "Testes de esquiva: perda." }
    ],
    evolucoes: [
      { nivel: 3,  nome: "O Grandão Vai Te Pegar", desc: "Manobra agarrar: +3×Nível no teste." },
      { nivel: 6,  nome: "Isso Tá Ficando Emocionante!", desc: "Abaixo da metade de PV em combate: estado de Fúria." },
      { nivel: 10, nome: "Sumam da Vista!", desc: "Ataque C.C: atinge todos em alcance curto do alvo principal." }
    ]
  },
  {
    id: "povo_mar",
    nome: "Povo do Mar",
    emoji: "🦈",
    custo: 0,
    extras: ["Resistência a impacto", "Contra-ataque +3"],
    vantagens: [
      { nome: "Vem pra Porrada Aquática", desc: "Combate dentro d'água: ganho em ataque e defesa." },
      { nome: "Respiração Aquática", desc: "Respira embaixo d'água. Deslocamento aquático ×3." }
    ],
    desvantagens: [
      { nome: "Ódio Generalizado", desc: "Ao ver tenryuubito (ou raça escolhida): teste Resistência (12) pra não atacar." },
      { nome: "Cadê Minha Água?", desc: "Ambiente seco ou quente: perda em todos os testes." }
    ],
    evolucoes: [
      { nivel: 1,  nome: "10× Mais Fortes", desc: "A cada nível, escolha Poder ou Resistência (ambos <4) para subir 1 ponto." },
      { nivel: 5,  nome: "Potencial Aquático", desc: "Técnica ofensiva perto/submerso em água: 4 PM → +PODER×Nível no ataque." },
      { nivel: 10, nome: "A Maré Vai Virar", desc: "4 PM: cria espiral de água em alcance médio. Usos = Poder÷2 por descanso longo." }
    ]
  },
  {
    id: "humano",
    nome: "Humanos",
    emoji: "🧍",
    custo: 0,
    extras: ["1 PA extra"],
    vantagens: [
      { nome: "Adaptação", desc: "Escolha 3 perícias para serem treinadas." },
      { nome: "Esforçados", desc: "Começa com 2 Pontos de Ficha adicionais." }
    ],
    desvantagens: [
      { nome: "Aspectos Humanos", desc: "Escolha um defeito: Ganância, Gula, Inveja, Ira, Luxúria, Preguiça ou Orgulho." }
    ],
    evolucoes: [
      { nivel: 3,  nome: "Diversificado", desc: "+1 maestria de limite. Custo de maestria reduzido a 1 ponto." },
      { nivel: 6,  nome: "Treinado", desc: "Desbloqueie um Haki (exceto Rei) com 1 ponto de desconto no próximo upgrade." },
      { nivel: 10, nome: "Sortudo", desc: "Gaste 5 PV → 1 PA temporário (1× por turno)." }
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
      { nivel: null, nome: "Evoluções Mistas", desc: "Escolha evoluções de ambas as raças (não pode ser tudo de uma só). Definido na criação." }
    ]
  },
  {
    id: "modificado",
    nome: "Modificado",
    emoji: "⚙️",
    custo: 1,
    extras: ["1 extra da raça original + 1 extra coerente com a modificação"],
    vantagens: [
      { nome: "Aprimoramento", desc: "1 vantagem da raça original + 1 vantagem fruto da modificação." }
    ],
    desvantagens: [
      { nome: "Efeito Colateral", desc: "1 desvantagem da raça original + 1 desvantagem fruto da modificação." }
    ],
    evolucoes: [
      { nivel: null, nome: "Evoluções Narrativas", desc: "Evoluções coerentes com a raça base e a modificação, definidas com o mestre." }
    ]
  }
]
