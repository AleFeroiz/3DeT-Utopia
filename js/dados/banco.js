// ============================================================
//  dados/banco.js — Banco de vantagens, desvantagens e técnicas
//  (dados do livro de regras 3DeT One Piece)
// ============================================================

export const BANCO_ELEMENTOS = [
  // ── VANTAGENS ─────────────────────────────────────────────
  {
    id: "aceleracao",
    nome: "Aceleração",
    tipo: "vantagem",
    custo: 1,
    descricao: "Pode gastar 2 PM para um movimento extra ou para receber Ganho em iniciativa e testes de Habilidade para correr, fugir ou perseguir."
  },
  {
    id: "mais_acao",
    nome: "+Ação",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 Pontos de Ação (PA). Pode ser comprada várias vezes para aumentos cumulativos."
  },
  {
    id: "acumulador",
    nome: "Acumulador",
    tipo: "vantagem",
    custo: 1,
    descricao: "Ao acertar um ataque, pode gastar 4 PM para ganhar Poder +1 no próximo (máximo +5). O bônus zera se errar ou não causar dano."
  },
  {
    id: "agil",
    nome: "Ágil",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 em testes de agilidade e iniciativa. Pode gastar 4 PM antes do teste para um Acerto Crítico com 5 ou 6."
  },
  {
    id: "ajudante",
    nome: "Ajudante",
    tipo: "vantagem",
    custo: 1,
    descricao: "Invoque um aliado uma vez por rodada. Efeitos variam (Cura, Especialista, Lutador, etc) e custam 6 PM (Familiar e Montaria custam 2 PM)."
  },
  {
    id: "alcance",
    nome: "Alcance",
    tipo: "vantagem",
    custo: 1,
    descricao: "Nível 1 (1 PT): Ataca Longe sem penalidade. Nível 2 (2 PT): Ataca Muito Longe sem penalidade."
  },
  {
    id: "anulacao",
    nome: "Anulação",
    tipo: "vantagem",
    custo: 1,
    descricao: "Gasta 6 PM para tentar cancelar uma vantagem de um alvo (Resistência 12 anula). Apenas uma vantagem anulada por vez."
  },
  {
    id: "arena",
    nome: "Arena",
    tipo: "vantagem",
    custo: 1,
    descricao: "Escolha um terreno. Nele, você pode gastar 10 PM para ter Ganho em todos os testes até o fim da cena."
  },
  {
    id: "ataque_especial",
    nome: "Ataque Especial",
    tipo: "vantagem",
    custo: 1,
    descricao: "Permite comprar modificadores de ataque (Área, Penetrante, Potente, etc) gastando PMs específicos ao atacar."
  },
  {
    id: "carismatico",
    nome: "Carismático",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 em testes sociais. Pode gastar 4 PM antes do teste para um Acerto Crítico com 5 ou 6."
  },
  {
    id: "cura",
    nome: "Cura",
    tipo: "vantagem",
    custo: 1,
    descricao: "Gasta 4 PM para curar 1D de PV, limitado ao seu valor de Habilidade em dados."
  },
  {
    id: "defesa_especial",
    nome: "Defesa Especial",
    tipo: "vantagem",
    custo: 1,
    descricao: "Permite comprar modificadores de defesa (Reflexão, Proteção, Tenaz, etc) gastando PMs específicos ao ser atacado."
  },
  {
    id: "devoto",
    nome: "Devoto",
    tipo: "vantagem",
    custo: 1,
    descricao: "Gasta 6 PM para ter Ganho em testes que defendam sua causa (máximo 2 vezes por cena)."
  },
  {
    id: "famoso",
    nome: "Famoso",
    tipo: "vantagem",
    custo: 1,
    descricao: "Gasta 6 PM para receber Ganho em situações sociais com NPCs que o reconheçam."
  },
  {
    id: "forte",
    nome: "Forte",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 em testes de esforço físico. Pode gastar 4 PM antes do teste para um Acerto Crítico com 5 ou 6."
  },
  {
    id: "genio",
    nome: "Gênio",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 em testes de inteligência e raciocínio. Pode gastar 4 PM antes do teste para um Acerto Crítico com 5 ou 6."
  },
  {
    id: "imitar",
    nome: "Imitar",
    tipo: "vantagem",
    custo: 1,
    descricao: "Gasta 6 PM para copiar uma vantagem vista. Requer teste de Percepção (9) ou conhecimento prévio da técnica."
  },
  {
    id: "improviso",
    nome: "Improviso",
    tipo: "vantagem",
    custo: 2,
    descricao: "Gasta 10 PM para aprender temporariamente uma perícia que não possui até o fim da cena."
  },
  {
    id: "inimigo",
    nome: "Inimigo",
    tipo: "vantagem",
    custo: 1,
    descricao: "Escolha um arquétipo. Contra ele, você consegue Acerto Crítico rolando 5 ou 6 em qualquer teste."
  },
  {
    id: "inofensivo",
    nome: "Inofensivo",
    tipo: "vantagem",
    custo: 1,
    descricao: "Ganha ação extra por surpresa no início do combate. Pode gastar 6 PM para Ganho em testes de enganação."
  },
  {
    id: "instrutor",
    nome: "Instrutor",
    tipo: "vantagem",
    custo: 1,
    descricao: "Usa 1 Ação e 4 PM para permitir que um aliado use uma perícia ou vantagem sua até o próximo turno dele."
  },
  {
    id: "irresistivel",
    nome: "Irresistível",
    tipo: "vantagem",
    custo: 1,
    descricao: "A cada 4 PM gastos, aumenta em +3 a dificuldade do teste do alvo para resistir às suas vantagens."
  },
  {
    id: "mais_mana",
    nome: "+Mana",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +20 Pontos de Mana (PM). Pode ser comprada múltiplas vezes."
  },
  {
    id: "mentor",
    nome: "Mentor",
    tipo: "vantagem",
    custo: 1,
    descricao: "Uma vez por cena, ganha Ganho em um teste da perícia escolhida. Técnicas ligadas à perícia custam -4 PM (mínimo 2)."
  },
  {
    id: "obstinado",
    nome: "Obstinado",
    tipo: "vantagem",
    custo: 2,
    descricao: "Permite gastar Pontos de Vida (PV) no lugar de Mana (PM) na proporção de 2 PV para cada 1 PM."
  },
  {
    id: "paralisia",
    nome: "Paralisia",
    tipo: "vantagem",
    custo: 1,
    descricao: "Ao acertar um ataque e gastar 4 PM, o alvo fica Imobilizado até sofrer dano ou passar em teste de Resistência."
  },
  {
    id: "punicao",
    nome: "Punição",
    tipo: "vantagem",
    custo: 1,
    descricao: "Escolha uma Desvantagem. Ao acertar ataque e gastar 4 PM, o alvo sofre o efeito da desvantagem no lugar do dano."
  },
  {
    id: "resoluto",
    nome: "Resoluto",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 em testes de força de vontade e morte. Pode gastar 4 PM para um Acerto Crítico com 5 ou 6."
  },
  {
    id: "sentido",
    nome: "Sentido",
    tipo: "vantagem",
    custo: 1,
    descricao: "Escolha um sentido. Você sempre tem Ganho em testes de Percepção usando esse sentido específico."
  },
  {
    id: "torcida",
    nome: "Torcida",
    tipo: "vantagem",
    custo: 1,
    descricao: "Com torcida presente (ou motivação de aliado), recebe 1 Ganho por rodada em qualquer teste."
  },
  {
    id: "mais_vida",
    nome: "+Vida",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +20 Pontos de Vida (PV). Pode ser comprada múltiplas vezes."
  },
  {
    id: "vigoroso",
    nome: "Vigoroso",
    tipo: "vantagem",
    custo: 1,
    descricao: "Recebe +2 em testes de saúde física e morte. Pode gastar 4 PM para um Acerto Crítico com 5 ou 6."
  },

  // ── DESVANTAGENS ──────────────────────────────────────────
  {
    id: "ambiente",
    nome: "Ambiente",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Dependência de um ambiente específico. No início de cada cena, rola 1D: com resultado 1, o ambiente não está presente e você sofre Perda em todos os testes."
  },
  {
    id: "antipatico",
    nome: "Antipático",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre Perda e nunca tem Acertos Críticos em testes de Poder envolvendo interação social."
  },
  {
    id: "assombrado",
    nome: "Assombrado",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Em situações de tensão, role 1D. Nível 1 (-1 PT): com resultado 1, sofre Perda em tudo até o fim da cena. Nível 2 (-2 PT): sofre Perda com qualquer resultado ímpar."
  },
  {
    id: "atrapalhado",
    nome: "Atrapalhado",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre Perda e nunca tem Acertos Críticos em testes de Habilidade envolvendo coordenação e agilidade."
  },
  {
    id: "aura",
    nome: "Aura",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Nível 1 (-1 PT): Qualquer teste de outras pessoas Perto de você sofre Perda. Nível 2 (-2 PT): Qualquer teste Longe (ou menos) de você sofre Perda."
  },
  {
    id: "codigo",
    nome: "Código",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Segue uma conduta moral estrita. Sempre que violar seu código, sofre Perda em todos os testes até se redimir cumprindo o código na próxima chance."
  },
  {
    id: "dependencia",
    nome: "Dependência",
    tipo: "desvantagem",
    custo: -2,
    descricao: "Depende de algo raro ou proibido todos os dias. Se não satisfazer a dependência, sofre Perda em todos os testes."
  },
  {
    id: "fracote",
    nome: "Fracote",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre Perda e nunca tem Acertos Críticos ao fazer testes de Poder envolvendo esforço físico."
  },
  {
    id: "fragil",
    nome: "Frágil",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre Perda e nunca tem Acertos Críticos ao fazer testes de Resistência envolvendo saúde física (doenças, venenos, morte)."
  },
  {
    id: "fraqueza",
    nome: "Fraqueza",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Vulnerável a uma condição ou objeto. Perto da fonte, sofre Perda em tudo. Incomum (-1 PT, raramente aparece). Comum (-2 PT, frequentemente aparece)."
  },
  {
    id: "furia",
    nome: "Fúria",
    tipo: "desvantagem",
    custo: -2,
    descricao: "Ao sofrer dano/irritação, faça teste de Resistência (9 ou dano). Se falhar, ataca o alvo, sofre Perda em ações não-ataque e Vantagens gastam o dobro de PM."
  },
  {
    id: "inapto",
    nome: "Inapto",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Escolha uma perícia que não possui. Sempre sofre Perda nela, e qualquer falha é considerada uma Falha Crítica (como se rolasse 1)."
  },
  {
    id: "inculto",
    nome: "Inculto",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Dificuldade em ler ou falar a língua local (Teste Difícil). Testes sociais com personagens que não o entendem sofrem Perda."
  },
  {
    id: "indeciso",
    nome: "Indeciso",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre Perda e nunca tem Acertos Críticos em testes de Resistência envolvendo força de vontade."
  },
  {
    id: "infame",
    nome: "Infame",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre sempre Perda quando faz testes sociais relacionados a um NPC que o reconhece."
  },
  {
    id: "insano",
    nome: "Insano",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Possui um problema mental grave (Fobia, Paranoia, Mitomania, etc.). A superação de uma insanidade em momentos críticos exige um teste de Resistência 9."
  },
  {
    id: "lento",
    nome: "Lento",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre sempre Perda em testes de iniciativa e gasta 1 movimento a mais para cruzar cada distância."
  },
  {
    id: "maldicao",
    nome: "Maldição",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Vítima de maldição constante. Suave (-1 PT, causa Perda em situações específicas e constrangedoras). Grave (-2 PT, causa efeitos danosos ou limitadores severos)."
  },
  {
    id: "monstruoso",
    nome: "Monstruoso",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Exceto em surpresa, sempre sofre Perda em testes de iniciativa. Também sofre Perda em testes sociais que envolvem aparência."
  },
  {
    id: "municao",
    nome: "Munição",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Exige 1 Movimento para recarregar após atacar com Ação. Se não recarregar, não soma o Poder ao ataque nem multiplica em críticos."
  },
  {
    id: "ponto_fraco",
    nome: "Ponto Fraco",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Possui uma falha explorável. Adversários que a conheçam podem gastar 2 PM para ter Ganho contra você em testes explorando essa falha."
  },
  {
    id: "protegido",
    nome: "Protegido",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Precisa proteger alguém. Se o protegido for ferido ou sumir, você sofre Perda em tudo. Se morrer, você adquire Assombrado (-2 PT)."
  },
  {
    id: "restricao",
    nome: "Restrição",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Condição que encarece poderes. Quando ocorre, gasta o dobro de PM. Incomum (-1 PT, raramente acontece). Comum (-2 PT, frequentemente acontece)."
  },
  {
    id: "tapado",
    nome: "Tapado",
    tipo: "desvantagem",
    custo: -1,
    descricao: "Sofre Perda e nunca tem Acertos Críticos ao fazer testes de Habilidade relacionados a inteligência e raciocínio."
  },

  // ── TÉCNICAS: HAKI DO ARMAMENTO (Busoshoku Haki) ──────────
  {
    id: "endurecimento",
    nome: "Endurecimento",
    tipo: "tecnica",
    custo: 1,
    descricao: "[Requisito: Resistência 3] Gaste 2 PM antes de um Bloqueio ou Ataque C.C para somar +(2 x Nível) ao teste."
  },
  {
    id: "infusao",
    nome: "Infusão",
    tipo: "tecnica",
    custo: 1,
    descricao: "[Requisitos: Resistência 3, Nível 3] Gaste 6 PM: Arma causa dano de HAKI e recebe +(2 x Nível) em ataques pela cena."
  },
  {
    id: "fluxo",
    nome: "Fluxo",
    tipo: "tecnica",
    custo: 2,
    descricao: "[Requisitos: Resistência 3, Nível 5] Habilidades com dano tipo HAKI recebem um Ganho naturalmente."
  },
  {
    id: "emissao",
    nome: "Emissão",
    tipo: "tecnica",
    custo: 2,
    descricao: "[Requisitos: Resistência 3, Nível 6] Ataque menos previsível: soma o dano base da sua arma duas vezes ao golpe."
  },
  {
    id: "ryuo",
    nome: "Ryuo",
    tipo: "tecnica",
    custo: 3,
    descricao: "[Requisitos: Resistência 3, Nível 10] Gaste 8 PM: O ataque ignora completamente os valores de Armadura da defesa inimiga."
  },
  {
    id: "lamina_negra",
    nome: "Lâmina Negra",
    tipo: "tecnica",
    custo: 3,
    descricao: "[Requisitos: Resistência 3, Nível 12] Após um descanso longo, sua arma principal recebe o bônus de Endurecimento permanentemente."
  },

  // ── TÉCNICAS: HAKI DA OBSERVAÇÃO (Kenbunshoku Haki) ───────
  // Nota geral: Não é possível utilizar mais de uma habilidade de Observação ao mesmo tempo.
  {
    id: "presenca_aguda",
    nome: "Presença Aguda",
    tipo: "tecnica",
    custo: 1,
    descricao: "[Requisito: Habilidade 3] Recebe +(2 x Nível) para detectar auras. Gaste 4 ou 8 PM para notar presenças escondidas em alcance Longe ou Muito Longe."
  },
  {
    id: "instinto_apurado",
    nome: "Instinto Apurado",
    tipo: "tecnica",
    custo: 1,
    descricao: "[Requisitos: Habilidade 3, Nível 2] Recebe +(3 x Nível) em testes para evitar ficar Desprevenido."
  },
  {
    id: "intencao",
    nome: "Intenção",
    tipo: "tecnica",
    custo: 1,
    descricao: "[Requisitos: Habilidade 3, Nível 2] Gaste 2 PM: Teste de Influência vs Manha do alvo para ler se a intenção dele é Hostil, Amigável ou Neutra."
  },
  {
    id: "previsao",
    nome: "Previsão",
    tipo: "tecnica",
    custo: 2,
    descricao: "[Requisitos: Habilidade 3, Nível 5] Gaste 4 PM: Se um ataque te acertar, você pode refazer seu teste de defesa (1x por ataque)."
  },
  {
    id: "visao_do_futuro",
    nome: "Visão do Futuro",
    tipo: "tecnica",
    custo: 3,
    descricao: "[Requisitos: Habilidade 3, Nível 12] Gaste 6 PM: Dobra o valor da sua Esquiva. Uso limitado a [Habilidade] vezes por batalha."
  },

  // ── TÉCNICAS: HAKI DO REI (Haoshoku Haki) ─────────────────
  {
    id: "presenca_marcante",
    nome: "Presença Marcante",
    tipo: "tecnica",
    custo: 1,
    descricao: "[Requisitos: Poder 3, Comprado no Nível 1] Gaste 4 PM: Seres com Poder inferior em alcance Médio devem testar Poder ou ficam Inconscientes por 1D rodadas."
  },
  {
    id: "opressao_do_rei",
    nome: "Opressão do Rei",
    tipo: "tecnica",
    custo: 2,
    descricao: "[Requisitos: Poder 3, Comprado no Nível 1, Nível 5] Reação (6 PM): Anula o Haki de Observação de um alvo próximo (Teste de Poder vs Poder)."
  },
  {
    id: "revestimento",
    nome: "Revestimento",
    tipo: "tecnica",
    custo: 3,
    descricao: "[Requisitos: Poder 3, Comprado no Nível 1, Nível 12] Gaste 8 PM: Todos os dados do ataque são considerados Sucesso Crítico. Uso limitado a [Poder] vezes por batalha."
  }
];

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
];

// ── SUBTIPOS DE FONTE DE PODER ────────────────────────────
export const SUBTIPOS_FONTE = [
  { id: "paramecia", nome: "Paramecia (Akuma no Mi)",  custo: 1 },
  { id: "zoan",      nome: "Zoan (Akuma no Mi)",       custo: 2 },
  { id: "logia",     nome: "Logia (Akuma no Mi)",      custo: 3 },
  { id: "haki",      nome: "Haki",                     custo: 1 },
  { id: "livre",     nome: "Fonte Livre / Homebrew",   custo: 1 }
];