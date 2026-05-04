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
    descricao: `Você se move muito rápido, reagindo e correndo muito além do comum.
Efeitos e Custos

Movimento Extra: Gaste 2 PM para realizar um movimento extra em seu turno.
Vantagem de Agilidade: Gaste 2 PM antes de rolar os dados para receber um Ganho na iniciativa, ou em testes de Habilidade para correr, fugir ou perseguir um oponente.`
  },
  {
    id: "mais_acao",
    nome: "+Ação",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem mais Pontos de Ação (PA) do que o normal oferecido pelo seu Poder.
Efeito
Cada vez que compra esta vantagem, você recebe +2 PA. (Ex: Se você tem Poder 3, que te daria 3 PA, pagando 1 ponto nesta vantagem você passa a ter 5 PA).
Você pode comprar esta vantagem várias vezes para novos aumentos de +2 PA.`
  },
  {
    id: "acumulador",
    nome: "Acumulador",
    tipo: "vantagem",
    custo: 1,
    descricao: `Quanto mais seus ataques acertam, mais forte você bate — ganhando embalo e momentum a cada golpe bem-sucedido.
Efeito e Custo
 Sempre que você acerta um ataque (causa dano), pode gastar 4 PM para ativar o Acumulador. O bônus do próximo ataque soma seu Atributo de ataque × a contagem de acertos consecutivos:

1º acerto ativado: próximo ataque +Atributo ×1
2º acerto consecutivo ativado: próximo ataque +Atributo ×2
3º acerto consecutivo ativado: próximo ataque +Atributo ×3
...e assim por diante.
Limite: O multiplicador máximo é igual à metade do seu Atributo de ataque (arredondado para baixo, mínimo 1). Exemplo: Poder 4 — limite de ×2. Poder 3 — limite de ×1.
Condição de Reset: Se você errar um ataque, fizer uma ação que não cause dano, ou não ativar o Acumulador num acerto, a contagem zera e os bônus acabam. Os ataques podem ser contra alvos diferentes.`
  },
  {
    id: "agil",
    nome: "Ágil",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem grande agilidade, coordenação motora e reflexos impecáveis. (Nota: Você não pode ser Ágil e também Lento).
Efeitos e Custos

Passivo: Recebe +2 em testes de Habilidade envolvendo agilidade, coordenação ou equilíbrio (incluindo testes de Iniciativa).
Ativo: Pode gastar 4 PM antes de fazer um desses testes para conseguir um Acerto Crítico rolando 5 ou 6.`
  },
  {
    id: "ajudante",
    nome: "Ajudante",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem algo ou alguém com quem pode contar: um aprendiz, animal, robô, veículo ou até uma espada inteligente. Uma vez por rodada, você pode invocar a ajuda desse aliado. (Você pode comprar esta vantagem mais vezes para ter ajudantes diferentes, mas só recebe uma ajuda por rodada).
Funções e Custos (6 PM por uso, exceto onde notado)

Curandeiro: Cura 2D de PV em você ou outro aliado Perto, ou permite repetir um teste de Resistência contra efeito negativo (paralisia, veneno, etc.) após ter falhado.
Especialista: Escolha uma perícia. Receba Ganho em um teste com esta perícia (exceto para atacar ou defender).
Familiar: Custa apenas 2 PM para invocar. Diminui à metade o custo em PM para você usar outra vantagem na mesma rodada.
Lutador: Receba Ganho em um teste de ataque, ou em testes de defesa por uma rodada.
Montaria: Custa 2 PM. Concede um movimento extra, ou um Ganho em teste de iniciativa, corrida ou perseguição.`
  },
  {
    id: "alcance",
    nome: "Alcance",
    tipo: "vantagem",
    custo: 1,
    descricao: `Seus ataques (e outras vantagens como Cura) acertam mais longe do que deveriam.
Efeitos
Pode atingir inimigos a 1 passo de distância do que seu ataque permite sem penalidades.`
  },
  {
    id: "anulacao",
    nome: "Anulação",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você consegue bloquear ou cancelar temporariamente o uso de uma vantagem de outro personagem. Apenas uma vantagem pode ser anulada por vez; se anular outra, a primeira é liberada.
Efeitos e Custos

Reativo (6 PM): Quando alguém usa uma vantagem Longe ou menos de você, tente anulá-la. O alvo faz um teste de Resistência contra seu Poder. Se falhar, não usa mais a vantagem até o fim da cena ou até cair. (O alvo pode testar R=12 a cada turno para tentar cancelar seu efeito).
Antecipado: Se você já sabe que o alvo tem a vantagem (por tê-lo visto usar, fama, ou teste de Saber/Manha/Percepção 12), você pode tentar anulá-la usando 1 Ação + 6 PM.`
  },
  {
    id: "arena",
    nome: "Arena",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você se dá melhor em um certo tipo de terreno (Água, Céu, Cidades, Ermos, Subterrâneo, Bares, etc.). A Arena deve ser aprovada pelo mestre.
Efeito e Custo
Quando está na sua Arena, pode gastar 10 PM para ter Ganho em todos os testes até o fim da cena.`
  },
  {
    id: "ataque_especial",
    nome: "Ataque Especial",
    tipo: "vantagem",
    custo: 1,
    descricao: `Ao fazer um ataque, você gasta energia para ativar uma técnica superior. Você pode comprar esta vantagem várias vezes para ter vários efeitos e pode escolher, na hora do ataque, quais quer combinar (somando o custo em PM de cada um).
Efeitos e Custos

Área (6 PM): Todos os personagens Perto do alvo também recebem o ataque.
Choque (4 PM): Você ataca usando Resistência em vez de Poder. (Bônus/penalidades de Poder vão para a Resistência).
Distante (2 PM): Atinge um passo de distância além. Cumulativo com Alcance, mas sofre Perda para atacar além do alcance normal.
Investida (2 PM): Ataca um alvo Longe ou mais e se move até ele na mesma ação (sem gastar movimento, mas precisa ter alcance de movimento para chegar lá).
Múltiplo (2 PM por alvo extra): Atinge mais alvos ao alcance (máximo = sua Habilidade). Um único teste de ataque seu contra testes de defesa separados dos alvos.
Penetrante (6 PM): O alvo sofre Perda na defesa.
Perigoso (2 PM): O ataque causa acerto crítico rolando 5 ou 6.
Poderoso (4 PM): Ao conseguir um crítico, gaste os PM para somar o seu Poder mais uma vez ao dano.`
  },
  {
    id: "carismatico",
    nome: "Carismático",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem facilidade para fazer com que gostem de você, exalando um magnetismo natural.
Efeitos e Custos

Passivo: Recebe +2 em Poder para testes sociais ou que envolvam interações com outras pessoas.
Ativo: Você pode gastar 4 PM antes de fazer um desses testes para conseguir um Acerto Crítico rolando 5 ou 6.`
  },
  {
    id: "cura",
    nome: "Cura",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você pode curar a si mesmo ou a alguém que possa tocar.
Efeito e Custo
Você gasta 4 PM para curar 1D de PV, até um limite de dados igual à sua Habilidade.
(Exemplo: Se você tiver Habilidade 2, pode curar até 2D de PV em um personagem, gastando um total de 8 PM).`
  },
  {
    id: "defesa_especial",
    nome: "Defesa Especial",
    tipo: "vantagem",
    custo: 1,
    descricao: `Ao receber um ataque, você pode gastar energia para ativar uma técnica de defesa (escudo, campo de força, bloqueio, etc.). Você pode comprar esta vantagem várias vezes para ter vários efeitos e escolher, no momento da defesa, quais quer ativar (somando o custo em PM).
Efeitos e Custos

Proteção (2 PM por aliado): Ajude um aliado a se defender. Se alguém Perto for atacado, você rola a sua defesa no lugar da dele. Se mesmo assim o ataque causar dano, o aliado é quem o recebe.
Provocação (2 PM): Atrai o ataque de um aliado Perto para você. Você rola a sua defesa e, se o ataque causar dano, você recebe o dano no lugar do aliado.
Reflexão (2 PM): Devolve o golpe. Caso a sua defesa seja maior que o ataque do adversário, ele sofre dano igual à diferença.
Robusta (4 PM): Quando consegue um Acerto Crítico na defesa, pode gastar 4 PM para somar sua Resistência mais uma vez.`
  },
  {
    id: "devoto",
    nome: "Devoto",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você serve a uma causa ou crença (uma entidade, filosofia, promessa solene ou vingança). Esse grande objetivo guia sua vida.
Efeito e Custo
Ao fazer um teste quando está seguindo ou defendendo ativamente a sua devoção, você pode gastar 4 PM para ter Ganho.

Limite: Você pode recorrer à devoção até no máximo 2 vezes por cena.`
  },
  {
    id: "expansao",
    nome: "Expansão",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você sabe organizar milimetricamente — ou simplesmente abusa da força bruta para carregar mais do que deveria.
Efeito
 Cada compra desta vantagem expande seu inventário usando um atributo diferente como base. Ambas podem ser compradas e seus bônus se acumulam.

1 PT — Expansão por Força: Soma PODER × 3 slots ao seu inventário.
1 PT — Expansão por Agilidade: Soma HABILIDADE × 3 slots ao seu inventário.`
  },
  {
    id: "famoso",
    nome: "Famoso",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você é conhecido ao redor do mundo. (Nota: Você não pode ser Famoso e também Infame).
Efeito e Custo
você recebe +2 naturalmente na sua reputação.

Quando faz um teste em situações sociais envolvendo NPCs que o reconhecem (normalmente rolando de 1 a 4 em 1D6 para checar o reconhecimento), você pode gastar 6 PM para receber Ganho.`
  },
  {
    id: "forte",
    nome: "Forte",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você é fisicamente muito forte e robusto.
Efeitos e Custos

Passivo: Recebe +2 em testes de Poder para empreender esforço físico (levantar peso, derrubar porta, socar vilão).
Ativo: Você pode gastar 4 PM antes de fazer um desses testes para conseguir um Acerto Crítico rolando 5 ou 6.`
  },
  {
    id: "genio",
    nome: "Gênio",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem uma inteligência formidável, muito acima da média.
Efeitos e Custos

Passivo: Recebe +2 em testes de Habilidade para resolver problemas que envolvem conhecimento, inteligência e raciocínio.
Ativo: Você pode gastar 4 PM antes de fazer um desses testes para conseguir um Acerto Crítico rolando 5 ou 6.`
  },
  {
    id: "imitar",
    nome: "Imitar",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você consegue copiar as vantagens dos seus alvos. Apenas uma vantagem pode imitada por vez (se imitar outra, a anterior é esquecida).
Efeitos e Custos

Reativo: Quando alguém usa uma vantagem Perto de você (Longe ou menos), faça um teste de Percepção (9). Se passar, gaste 6 PM para adquirir a mesma vantagem até o fim da cena.
Antecipado: Se você já sabe que o alvo tem a vantagem (por tê-lo visto usar, por ser Telepata, fama, ou teste de Saber/Manha/Percepção 12), além de gastar os 6 PM, você precisa usar 1 Ação para imitá-la.`
  },
  {
    id: "improviso",
    nome: "Improviso",
    tipo: "vantagem",
    custo: 2,
    descricao: `Na hora do aperto, você consegue usar capacidades que não deveria ter! Lembra de uma lição, baixa um dado na mente, ou tem pura sorte. Apenas uma perícia pode ser improvisada por vez.
Efeito e Custo
Você pode gastar 8 PM para aprender, na mesma hora, uma perícia que você não possui. Você pode usá-la até o fim da cena. (em caso de improvisar novamente, a perícia anterior é descartada)`
  },
  {
    id: "inimigo",
    nome: "Inimigo",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você é treinado em enfrentar certo tipo de criatura, conhecendo intimamente seus poderes e fraquezas.
Efeito
Escolha uma raça. Em todos os testes contra criaturas da raça escolhida, você consegue Acerto Crítico rolando 5 ou 6.
Atenção: O oponente precisa ter a raça na ficha em regras. Apenas ter a aparência não ativa a vantagem.`
  },
  {
    id: "inofensivo",
    nome: "Inofensivo",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você não parece perigoso, seja por parecer pequeno, fraco, um velhinho inofensivo ou um bichinho fofo. (Nota: Você não pode ser Inofensivo e Monstruoso).
Efeitos e Custos

Combate (Surpresa): Por surpreender o oponente, você ganha uma ação extra antes do primeiro turno. (Não funciona com quem já te viu lutar ou duas vezes com a mesma pessoa, mas mesmo contra estes, você tem Ganho ao rolar iniciativa).
Enganação (6 PM): Gaste os PM para ter Ganho em testes para tentar enganar alguém ou passar despercebido.`
  },
  {
    id: "instrutor",
    nome: "Instrutor",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você sabe ensinar ou inspirar outra pessoa a ser bem-sucedida, seja com dicas, gritos ou ligações telepáticas.
Efeito e Custo
Usando 1 Ação e 4 PM, você permite a um aliado fazer um teste como se ele tivesse uma perícia que você tem. Se o aliado já tiver a perícia, você pode permitir que ele use uma vantagem sua que a afete (como Maestria ou Mentor).
Os PM da vantagem usada devem ser pagos pelo aliado. O teste deve ser feito até o próximo turno do aliado.`
  },
  {
    id: "invencivel",
    nome: "Invencível",
    tipo: "vantagem",
    custo: 2,
    descricao: `Você simplesmente não cai. Enquanto outros desmoronam, você continua de pé por pura teimosia, raiva ou algo além da compreensão humana.
Efeito
 Quando você entraria no Estado morrendo, pode continuar agindo normalmente — mas mantendo a Perda característica do estado Derrotado. Você permanece funcional e age como se tivesse PV.
No entanto, o custo é brutal:

Os Testes de Morte acontecem normalmente a cada turno, com a progressão padrão de dificuldade.
Qualquer dano recebido enquanto estiver neste estado conta automaticamente como 1 Ponto de Morte, sem direito a teste.
Ao acumular 3 Pontos de Morte, você morre definitivamente — sem exceções.
Você não está ignorando a morte. Está apenas recusando chegar lá antes da hora.`
  },
  {
    id: "irresistivel",
    nome: "Irresistível",
    tipo: "vantagem",
    custo: 1,
    descricao: `Seus poderes e efeitos são muito mais difíceis de resistir.
Efeito e Custo
Quando um alvo faz um teste para evitar ser afetado por uma vantagem sua (como Anulação, Paralisia, Punição, etc.), você pode gastar PM. Para cada 4 PM gastos, a dificuldade (meta) do teste para resistir aumenta em +3.
Você deve anunciar o uso desta vantagem (e o custo gasto) antes do alvo rolar os dados.`
  },
  {
    id: "mais_mana",
    nome: "+Mana",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem mais Pontos de Mana (PM) do que o normal oferecido pela sua Habilidade.
Efeito
Cada vez que compra esta vantagem, você recebe +20 PM. (Ex: Se você tem Habilidade 4, que dá 40 PM, pagando 1 ponto aqui você passa a ter 60 PM).
Pode ser comprada várias vezes.`
  },
  {
    id: "mentor",
    nome: "Mentor",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você aprendeu uma perícia com um mestre e as lições continuam vivas na sua mente.
Efeitos
Escolha uma perícia que você já possui. 

Uma vez por combate ou cena, você pode lembrar de um ensinamento e ter Ganho em um teste daquela perícia. 
Técnicas que tenham a perícia do Mentor como pré-requisito gastam -4 PM (reduzido até um mínimo de 2 PM).`
  },
  {
    id: "obstinado",
    nome: "Obstinado",
    tipo: "vantagem",
    custo: 2,
    descricao: `Sua força de vontade é tanta que você alimenta seus poderes com sua própria energia vital.
Efeito
Você pode gastar seus Pontos de Vida (PV) no lugar de PM para ativar suas vantagens. A conversão é: 2 PV = 1 PM.
(Você ainda pode gastar PM normalmente).`
  },
  {
    id: "paralisia",
    nome: "Paralisia",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem um meio de imobilizar o alvo (congelando, rede, pontos de pressão, etc.).
Efeito e Custo
Faça um ataque e gaste 4 PM. Se vencer a defesa do alvo, em vez de sofrer dano, ele fica Imobilizado (Indefeso).
A paralisia dura até o fim da cena ou até o alvo sofrer dano. A cada turno, o alvo pode tentar se soltar rolando Resistência (Dificuldade: Teste de poder do atacante).`
  },
  {
    id: "resistente",
    nome: "Resistente",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você desenvolveu uma resiliência natural contra certos tipos de dano — seja por treinamento, constituição física ou simplesmente por ter apanhado demais da coisa certa.\nEfeito\nEscolha dois tipos de dano. Quando efetuar um teste de defesa contra esses tipos, some sua Resistência novamente ao teste (cumulativo com outras manobras de defesa).`
  },
  {
    id: "resoluto",
    nome: "Resoluto",
    tipo: "vantagem",
    custo: 1,
    descricao: `Sua determinação é inabalável frente aos horrores do mundo.
Efeitos e Custos

Passivo: Recebe +2 em testes de Resistência envolvendo força de vontade (perceber fraudes, resistir a encantos, ilusões e testes de morte).
Ativo: Pode gastar 4 PM antes de fazer o teste para conseguir um Acerto Crítico rolando 5 ou 6.`
  },
  {
    id: "sentido",
    nome: "Sentido",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem um sentido aguçado ou diferente do normal (ver no escuro, detectar o invisível, etc.).
Efeito
Escolha entre audição, faro, tato ou visão. Em testes de Percepção usando esse sentido específico, você sempre tem Ganho.`
  },
  {
    id: "torcida",
    nome: "Torcida",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você brilha sob os holofotes. Quando há gente aplaudindo, você tira forças do além!
Efeito
Quando uma torcida está presente, você tem 1 Ganho por rodada em qualquer teste que quiser. Na falta de torcida, um aliado pode usar 1 Ação para motivá-lo, concedendo o benefício no seu próximo turno.`
  },
  {
    id: "mais_vida",
    nome: "+Vida",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você tem mais Pontos de Vida (PV) do que o normal oferecido pela sua Resistência.
Efeito
Cada vez que compra esta vantagem, você recebe +20 PV. (Ex: Se tem Resistência 2, que dá 20 PV, pagando 1 ponto aqui você passa a ter 40 PV).
Pode ser comprada várias vezes.`
  },
  {
    id: "vigoroso",
    nome: "Vigoroso",
    tipo: "vantagem",
    custo: 1,
    descricao: `Você é robusto como um touro, dificilmente ficando doente ou cansado.
Efeitos e Custos

Passivo: Recebe +2 em testes de Resistência envolvendo saúde física (resistir a fadiga, doenças, venenos e testes de morte).
Ativo: Pode gastar 4 PM antes de fazer o teste para conseguir um Acerto Crítico rolando 5 ou 6.`
  },

  // ── DESVANTAGENS ──────────────────────────────────────────
  {
    id: "ambiente",
    nome: "Ambiente",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você é dependente de um certo ambiente que não existe em abundância por onde a campanha costuma passar (água, clima ártico, atmosfera de metano, cozinha equipada, etc.).
Efeito e Condição
No início de cada cena, role 1D. Com um resultado 1, nada relacionado a seu ambiente existe ali, e você sofre Perda em todos os testes.
O mestre pode dispensar a rolagem por pura lógica (ex: rolar falta de água se o grupo estiver literalmente em uma cidade submersa, ou nem rolar no deserto, pois é óbvio que você sofrerá a penalidade).`
  },
  {
    id: "antipatico",
    nome: "Antipático",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você não consegue (ou não quer) se expressar bem. Timidez, orgulho, rabugice ou só um baita chato! (Nota: Você não pode ser Antipático e também Carismático).
Efeito
Quando faz um teste de Poder envolvendo interação social, você sofre Perda e nunca tem Acertos Críticos.`
  },
  {
    id: "assombrado",
    nome: "Assombrado",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você é assombrado por um espírito, sentimento ruim, trauma ou lembrança amarga que tira sua concentração nos piores momentos.
Efeitos por Nível
Ao entrar em uma situação de tensão (como um combate ou cena de ação), role 1D:

–1 PT: Com um resultado 1, todos os seus testes sofrem Perda até o fim da cena.
–2 PT: A assombração ataca com qualquer resultado ímpar, e todos os seus testes sofrem Perda até o fim da cena.`
  },
  {
    id: "atrapalhado",
    nome: "Atrapalhado",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você se enrola com os próprios pés ou derruba tudo que toca. (Nota: Você não pode ser Atrapalhado e também Ágil).
Efeito
Quando faz um teste de Habilidade envolvendo coordenação e agilidade, você sofre Perda e nunca tem Acertos Críticos.`
  },
  {
    id: "aura",
    nome: "Aura",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você emana uma aura pesada: energia negativa, mau-cheiro, azar puro. Qualquer um sente e sabe que a culpa é sua.
Efeitos por Nível
“Ah, não me afeta, não é problema meu.” Tenta aí, fera! Boa sorte tentando jogar em equipe.

–1 PT: Qualquer teste de outras pessoas (aliados ou inimigos) realizado Perto de você sofre Perda.
–2 PT: Qualquer teste realizado Longe (ou menos) de você sofre Perda.`
  },
  {
    id: "codigo",
    nome: "Código",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você segue uma conduta moral estrita que o impede de fazer — ou deixar de fazer — algo. O código é definido junto ao Mestre e deve ser algo que aparece com frequência real na campanha.
Regra Geral
 Sempre que violar seu código, a culpa o deixará com Perda em todos os testes até se redimir — compensando o mal ou cumprindo o código na próxima oportunidade.
O custo depende do impacto do código na campanha:

–1 PT — Situacional: Afeta o personagem em contextos específicos e não impede o grupo de agir livremente. Ex: nunca matar filhotes ou fêmeas grávidas; nunca abandonar uma caça abatida; nunca atacar um oponente já em Perda; sempre focar o inimigo mais perigoso.
–2 PT — Invasivo: Afeta o personagem constantemente e pode restringir o grupo inteiro em cenas sociais, de exploração ou combate. Ex: nunca mentir ou trapacear; sempre proteger os mais fracos; jamais recusar um pedido de ajuda; obedecer qualquer ordem de uma autoridade reconhecida.

O Mestre tem a palavra final sobre o custo — um código que pareça pesado mas nunca apareça na campanha vale –1 PT no máximo.`
  },
  {
    id: "dependencia",
    nome: "Dependência",
    tipo: "desvantagem",
    custo: -2,
    descricao: `O personagem depende de algo raro, proibido ou desumano para viver (sangue, cérebros, substâncias ilícitas).
Efeito e Punição
A Dependência deve ser satisfeita todos os dias. Se não o fizer, sofre Perda em todos os testes até que a satisfaça. `
  },
  {
    id: "fracote",
    nome: "Fracote",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você é fraco, falta ódio… e força. (Nota: Você não pode ser Fracote e também Forte).
Efeito
Ao fazer um teste de Poder envolvendo esforço físico (mover pedra, derrubar porta), você sofre Perda e nunca tem Acertos Críticos.`
  },
  {
    id: "fragil",
    nome: "Frágil",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você tem pouco vigor físico e a saúde debilitada. (Nota: Você não pode ser Frágil e também Vigoroso).
Efeito
Ao fazer um teste de Resistência envolvendo saúde física (como para resistir a doenças, venenos e testes de morte), você sofre Perda e nunca tem Acertos Críticos.`
  },
  {
    id: "fraqueza",
    nome: "Fraqueza",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Existe um objeto, elemento ou condição à qual você é especialmente vulnerável.
Níveis de Frequência e Efeito
Enquanto você estiver Perto da fonte da sua Fraqueza, todos os seus testes sofrem Perda.

Incomum (–1 PT): A Fraqueza aparece raramente (rola 1 em 1D para checar se está na cena). Ex: Livros, espelhos, gatos, cor roxa, objetos de bronze.
Comum (–2 PT): A Fraqueza aparece mais frequentemente (rola 1 a 3 em 1D para checar). Ex: Lugares escuros/iluminados, vento, água, plantas, cor vermelha.`
  },
  {
    id: "furia",
    nome: "Fúria",
    tipo: "desvantagem",
    custo: -2,
    descricao: `Sua raiva é incontrolável e pode te cegar em combate.
Gatilhos, Efeitos e Consequências
Sempre que sofre dano ou fica irritado, faça um teste de Resistência (12 ou igual ao dano, o que for maior). Se falhar, entra em frenesi:

Você ataca imediatamente o alvo da irritação (ou o ser mais próximo, se ele não estiver lá).
Todos os testes que não sejam de ataque (inclusive defesa) sofrem Perda.
Todas as suas Vantagens gastam o dobro de PM.
Fim da Fúria: Termina quando você ou o oponente cai, ou se o oponente fugir. `
  },
  {
    id: "inapto",
    nome: "Inapto",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Escolha uma perícia que você não possui. Você é um completo incompetente quando se trata dela.
Efeito
Sempre que o mestre pede um teste com a perícia escolhida, você está em Perda. Além disso, qualquer falha da meta é considerada uma Falha Crítica (como se os dados rolassem 1).
Se além de tudo isso você realmente rolar 1 nos dados... melhor nem comentar.`
  },
  {
    id: "inculto",
    nome: "Inculto",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você não tem familiaridade com a cultura local (seja por ser estrangeiro, alienígena, ingênuo ou criado em isolamento).
Efeito
Você não sabe ler a língua local ou acha muito difícil (Teste Difícil). Tem a mesma dificuldade para se comunicar (mesmo para aliados, o mestre pode pedir testes de compreensão). Testes sociais com personagens que não o entendem sofrem Perda.`
  },
  {
    id: "indeciso",
    nome: "Indeciso",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você tem dificuldade para tomar decisões e uma vontade fraca. (Nota: Você não pode ser Indeciso e também Resoluto).
Efeito
Em testes de Resistência envolvendo força de vontade, você sofre Perda e nunca tem Acertos Críticos.`
  },
  {
    id: "infame",
    nome: "Infame",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você é muito conhecido, mas pela pior razão possível. (Nota: Você não pode ser Famoso e também Infame).
Efeito
você naturalmente recebe -2 na sua reputação.

Quando faz testes sociais relacionados a um NPC que o reconhece (normalmente rolando 1 a 4 em 1D), você está sempre em Perda.`
  },
  {
    id: "insano",
    nome: "Insano",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você tem um problema mental grave. (Nota: Sempre que a superação de uma insanidade exigir um teste, será um teste de Resistência 9).
Insanidades Disponíveis

Cleptomania: Rouba coisas por impulso. Sempre que houver a chance, teste para evitar. O cleptomaníaco nunca devolve e luta para não devolver.
Compulsão: Precisa fazer algo várias vezes ao dia (lavar a mão, ler, etc). No início de cada cena, tem Perda em tudo até gastar 1 rodada cumprindo a compulsão.
Distração: Não consegue se concentrar no que não interessa (qualquer coisa fora de seu Devoto/Código). Não consegue Acertos Críticos nessas situações.
Fantasia: Acredita ser o que não é (um ninja, mago, herói). Anuncia isso o tempo todo. Sofre Perda em todos os testes sociais.
Fobia: Medo irracional de algo (altura, sangue, etc). Se estiver Perto do alvo da fobia, só pode fazer movimentos (não ações). Precisa passar no teste para agir.
Megalomania: Acha que é invencível e imortal. Nunca se rende e tenta seguir lutando mesmo após ser derrotado.
Mitomania: Mente compulsivamente. Precisa passar no teste para conseguir dizer a verdade, até para aliados.
Paranoia: Não confia em ninguém, nem para receber cura. Recupera apenas metade dos recursos em descansos por não dormir direito.`
  },
  {
    id: "lento",
    nome: "Lento",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você se move e reage de forma muito devagar. (Nota: Você não pode ser Ágil e também Lento).
Efeito
Em testes de iniciativa, você está sempre em Perda, e gasta 1 movimento a mais para cruzar cada distância.`
  },
  {
    id: "maldicao",
    nome: "Maldição",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você é vítima de uma maldição que o perturba quase o tempo inteiro. A natureza e efeito exatos podem ser inventados por você, mas devem ser autorizados pelo mestre.
Níveis da Maldição

Suave (–1 PT): Mais irritante ou constrangedora que qualquer outra coisa (ex: um bicho mágico chato te persegue, suas vantagens só funcionam se tirar a roupa, muda de gênero com água fria/quente). Pode te distrair e causar Perda em momentos específicos.
Grave (–2 PT): Desafiadora e perigosa (ex: sofre todo o dano que causa aos outros; em testes de um atributo X, falhas são sempre críticas; nunca cura PV exceto descansando; um monstro te ataca toda noite).`
  },
  {
    id: "monstruoso",
    nome: "Monstruoso",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você tem uma aparência grotesca, que causa repulsa ou pavor àqueles que podem vê-lo. Outros estão sempre de prontidão contra você. (Nota: Você não pode ser Monstruoso e Inofensivo).
Efeitos

Combate: Exceto quando pega os oponentes de surpresa, você sempre sofre Perda em testes de iniciativa.
Social: Você sofre Perda em testes sociais que envolvem aparência.`
  },
  {
    id: "municao",
    nome: "Munição",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Sua arma ou técnica principal depende de projéteis, cargas ou algum tipo de recurso físico para disparar — e isso tem um custo na cadência de combate.
Definição e Efeito
 Esta desvantagem se aplica a qualquer arma ou técnica que envolva projéteis ou cargas físicas (pistolas, arcos, canhões, bestas, lançadores, etc.). Declare qual é sua arma/técnica principal sujeita à Munição na criação do personagem.
Após cada ataque com essa arma, você precisa gastar 1 Movimento para recarregar antes do próximo disparo. Se atacar sem recarregar, o ataque não pode ser realizado — a arma simplesmente não dispara.
Trocar para uma arma diferente não isenta a penalidade — a desvantagem representa sua dependência de munição como estilo de combate, não de uma arma específica.`
  },
  {
    id: "ponto_fraco",
    nome: "Ponto Fraco",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você tem um problema que seu adversário pode explorar (um desequilíbrio na postura, um tique, perder a cabeça com um assunto do passado).
Efeito e Descoberta
Seu Ponto Fraco pode ser descoberto por quem já te viu lutar, por Telepatia, fama ou em um teste resistido de Percepção contra a perícia que você está usando.
Qualquer adversário que conheça seu Ponto Fraco pode gastar 2 PM para ter Ganho contra você em testes que explorem esse problema.`
  },
  {
    id: "protegido",
    nome: "Protegido",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Existe alguém que você precisa proteger com a própria vida (outro jogador ou um NPC). Os vilões vão tentar usá-lo como chantagem!
Efeitos e Punição

Sempre que seu Protegido está desaparecido, indefeso ou ferido (qualquer PV abaixo do máximo), todos os seus testes sofrem Perda.
Se o Protegido morre ou desaparece para sempre, você adquire a versão severa de Assombrado (–2 PT). "Ah, mas eu ganho o ponto de diferença?" NÃO!`
  },
  {
    id: "restricao",
    nome: "Restrição",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Certa condição torna mais difícil usar seus poderes. (Aviso: Você não pode ter esta desvantagem se não tiver nenhuma vantagem que gasta PM. Cria vergonha nessa cara!)
Níveis de Frequência e Efeito
Quando a condição acontece, você sempre gasta o dobro de PM para usar suas vantagens.

Incomum (–1 PT): Acontece raramente (Você está molhado; com fome; lua cheia; inimigo é de certa raça; alguém soltou pum).
Comum (–2 PT): Acontece frequentemente (É de noite/dia; lugar aberto/fechado; tem alguém olhando; o bardo não parou de cantar; alguém soltou pum — cada um conhece o grupo que tem).`
  },
  {
    id: "tapado",
    nome: "Tapado",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você não é uma pessoa muito brilhante. (Nota: Você não pode ser Tapado e também Gênio).
Efeito
Quando faz testes de Habilidade relacionados a inteligência e raciocínio, você sofre Perda e nunca tem Acertos Críticos.`
  },
  {
    id: "vulneravel",
    nome: "Vulnerável",
    tipo: "desvantagem",
    custo: -1,
    descricao: `Você possui uma fraqueza terrível contra certos tipos de dano. Pode ser uma sensibilidade física, um trauma, ou simplesmente a maldição de existir.
Efeito
Escolha dois tipos de dano. Sempre que sofrer dano desses tipos, o valor final recebido é dobrado.`
  },

  {
    id: "endurecimento",
    nome: "Endurecimento",
    tipo: "tecnica",
    custo: 1,
    descricao: `[Requisito: Resistência 3] Gaste 2 PM antes de um Bloqueio ou Ataque Corpo a Corpo para somar +(2 x Nível) ao teste.`
  },
  {
    id: "infusao",
    nome: "Infusão",
    tipo: "tecnica",
    custo: 1,
    descricao: `[Requisitos: Resistência 3, Nvl 3] Gaste 6 PM: Arma causa dano de HAKI e recebe +(2 x Nível) em ataques pela cena.`
  },
  {
    id: "fluxo",
    nome: "Fluxo",
    tipo: "tecnica",
    custo: 2,
    descricao: `[Requisitos: Resistência 3, Nvl 5] Habilidades com dano tipo HAKI recebem um Ganho naturalmente.`
  },
  {
    id: "emissao",
    nome: "Emissão",
    tipo: "tecnica",
    custo: 2,
    descricao: `[Requisitos: Resistência 3, Nvl 6] Ataque menos previsível: soma o dano base da sua arma duas vezes ao golpe. além de que danos a distâncias além do normal se mantém como dano de HAKI.`
  },
  {
    id: "ryuo",
    nome: "Ryuo",
    tipo: "tecnica",
    custo: 3,
    descricao: `[Requisitos: Resistência 3, Nvl 10] Gaste 8 PM: diminui a margem de crítico da defesa em -2`
  },
  {
    id: "lamina_negra",
    nome: "Lâmina Negra",
    tipo: "tecnica",
    custo: 3,
    descricao: `[Requisitos: Resistência 3, Nvl 12] se concentre em  um descanso longo inteiro a isso, sua arma principal recebe o bônus de Infusão permanentemente. mas não permite você usar Infusão novamente, exceto que desative sua infusão.`
  },

  // ── TÉCNICAS: HAKI DA OBSERVAÇÃO (Kenbunshoku Haki) ───────
  // Nota: Não é possível utilizar mais de uma habilidade de Observação ao mesmo tempo.
  {
    id: "presenca_aguda",
    nome: "Presença Aguda",
    tipo: "tecnica",
    custo: 1,
    descricao: `[Requisito: Habilidade 3] +(2 x Nível) para detectar auras. Gaste 4/8 PM para notar presenças escondidas em alcance Longe/M. Longe.`
  },
  {
    id: "instinto_apurado",
    nome: "Instinto Apurado",
    tipo: "tecnica",
    custo: 1,
    descricao: `[Requisitos: Habilidade 3, Nvl 2] Recebe +(2 x Nível) em testes para evitar ficar Desprevenido.`
  },
  {
    id: "intencao",
    nome: "Intenção",
    tipo: "tecnica",
    custo: 1,
    descricao: `[Requisitos: Habilidade 3, Nvl 2] Gaste 2 PM: Teste de Influência vs Manha do alvo para ler se a intenção dele é Hostil, Amigável ou Neutra.`
  },
  {
    id: "previsao",
    nome: "Previsão",
    tipo: "tecnica",
    custo: 2,
    descricao: `[Requisitos: Habilidade 3, Nvl 5] Gaste 4 PM: Se um ataque te acertar, você pode refazer seu teste de defesa (1x por rodada).`
  },
  {
    id: "visao_do_futuro",
    nome: "Visão do Futuro",
    tipo: "tecnica",
    custo: 3,
    descricao: `[Requisitos: Habilidade 3, Nvl 12] Gaste 6 PM: soma HABILIDADE duas vezes a sua Esquiva novamente. Uso limitado a [Habilidade] vezes por batalha.`
  },

  // ── TÉCNICAS: HAKI DO REI (Haoshoku Haki) ─────────────────
  {
    id: "presenca_marcante",
    nome: "Presença Marcante",
    tipo: "tecnica",
    custo: 1,
    descricao: `[Requisitos: Poder 3, Comprado no Nível 1] Gaste 4 PM: Seres com Poder inferior em alcance Médio devem testar Poder ou ficam Inconscientes por 1D rodadas.`
  },
  {
    id: "opressao_do_rei",
    nome: "Opressão do Rei",
    tipo: "tecnica",
    custo: 2,
    descricao: `[Requisitos: Poder 3, Comprado no Nível 1, Nvl 5] Reação (6 PM): Anula o Haki de Observação de um alvo próximo (Teste de Poder vs Resistência).`
  },
  {
    id: "revestimento",
    nome: "Revestimento",
    tipo: "tecnica",
    custo: 3,
    descricao: `[Requisitos: Poder 3, Comprado no Nível 1, Nvl 12] Gaste 8 PM: você pode rerolar seu teste de ataque até 3 vezes, parando quando sair um Sucesso Crítico ou ao esgotar as tentativas. Se ao fim das tentativas nenhum crítico ocorreu, o melhor resultado entre as rolagens é usado. Limitado a Poder vezes por batalha.`
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