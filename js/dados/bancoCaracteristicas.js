// ============================================================
//  dados/bancoCaracteristicas.js
//  Tabelas de Características (Fontes de Poder) — Livro de Regras
// ============================================================

// Orçamento máximo por Escala de Poder
export const ORCAMENTO_POR_ESCALA = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 35
}

/**
 * Cada aba possui:
 *   tipo: "empilhavel" | "unico"
 *   dados: Array de opções
 *
 * Para "empilhavel": o usuário pode selecionar a mesma linha várias vezes.
 * Para "unico": apenas uma linha pode estar ativa.
 */
export const TABELAS = {

  // ── IMPACTO DIRETO ─────────────────────────────────────

  potencia: {
    label: "Potência",
    base: "0 (sem potência)",
    descricao: "Usada para dano, cura e força de efeitos diretos.",
    tipo: "empilhavel",
    dados: [
      { valor: 1,  orcamento: 1,  pm: 1 },
      { valor: 3,  orcamento: 3,  pm: 2 },
      { valor: 5,  orcamento: 5,  pm: 4 },
      { valor: 10, orcamento: 10, pm: 8 }
    ]
  },

  pressao: {
    label: "Pressão",
    base: "0 (sem pressão)",
    descricao: "Usada para testes resistidos, controle e imposição de condições.",
    tipo: "empilhavel",
    dados: [
      { valor: 1,  orcamento: 1,  pm: 1 },
      { valor: 3,  orcamento: 3,  pm: 2 },
      { valor: 5,  orcamento: 5,  pm: 4 },
      { valor: 10, orcamento: 10, pm: 8 }
    ]
  },

  // ── BASE DE USO ────────────────────────────────────────

  execucao: {
    label: "Execução",
    base: "Padrão (1 Ação) — gratuito",
    descricao: "Execuções mais lentas aliviam o custo; mais rápidas exigem mais PM.",
    tipo: "unico",
    dados: [
      { nome: "Padrão (Base)",  orcamento: 0, pm:  0, gratuita: true },
      { nome: "Completa",       orcamento: 2, pm: -3 },
      { nome: "Movimento",      orcamento: 8, pm:  3 },
      { nome: "Reação",         orcamento: 6, pm:  2 }
    ]
  },

  alcance: {
    label: "Alcance",
    base: "Pessoal — gratuito",
    descricao: "Distância máxima que a característica pode atingir.",
    tipo: "unico",
    dados: [
      { nome: "Pessoal (Base)", orcamento: 0,  pm: 0, gratuita: true },
      { nome: "Toque",          orcamento: 1,  pm: 0 },
      { nome: "Perto",          orcamento: 2,  pm: 1 },
      { nome: "Longe",          orcamento: 4,  pm: 2 },
      { nome: "Muito Longe",    orcamento: 8,  pm: 4 },
      { nome: "Fora de Alcance",orcamento: 16, pm: 8 }
    ]
  },

  duracao: {
    label: "Duração",
    base: "Instantânea — gratuito",
    descricao: "Escolha um tipo de duração e empilhe ele. Trocar de linha descarta o stack anterior.",
    tipo: "empilhavel_mono",
    dados: [
      { nome: "Instantânea (Base)", orcamento: 0,  pm: 0, gratuita: true  },
      { nome: "1 Rodada",           orcamento: 1,  pm: 1  },
      { nome: "1 Cena",             orcamento: 5,  pm: 3  },
      { nome: "1 Hora",             orcamento: 12, pm: 6  },
      { nome: "1 Dia",              orcamento: 24, pm: 12 }
    ]
  },

  // ── INFLIGIR AOS SERES (escolha apenas um dos dois) ───

  area: {
    label: "Área",
    base: "1 alvo (base) — sem custo",
    descricao: "Expande quem a técnica atinge em raio. Mutuamente exclusivo com Alvos Adicionais.",
    tipo: "empilhavel",
    grupoExclusivo: "infligir",
    dados: [
      { nome: "1 metro",  orcamento: 2,  pm: 2 },
      { nome: "3 metros", orcamento: 6,  pm: 4 },
      { nome: "9 metros", orcamento: 14, pm: 8 }
    ]
  },

  alvos: {
    label: "Alvos Adicionais",
    base: "1 alvo (base) — sem custo",
    descricao: "Permite atingir mais de um alvo individualmente. Mutuamente exclusivo com Área.",
    tipo: "empilhavel",
    grupoExclusivo: "infligir",
    dados: [
      { nome: "1 alvo",   orcamento: 1, pm: 1 },
      { nome: "3 alvos",  orcamento: 4, pm: 2 },
      { nome: "6 alvos",  orcamento: 9, pm: 5 }
    ]
  },

  // ── MODIFICADORES ESPECIAIS ────────────────────────────

  condicoes: {
    label: "Condições",
    descricao: "Pré-requisitos para a técnica funcionar. Pode empilhar (sem repetir a mesma).",
    tipo: "empilhavel",
    dados: [
      { nome: "Condição Fraca",          orcamento: 2, pm: -2 },
      { nome: "Característica X Ativa",  orcamento: 3, pm: -4 },
      { nome: "Condição Mediana",        orcamento: 3, pm: -4 },
      { nome: "Perto da Derrota",        orcamento: 4, pm: -6 },
      { nome: "Condição Forte",          orcamento: 4, pm: -6 }
    ]
  },

  descontos: {
    label: "Descontos",
    descricao: "Refinamento da técnica. Redução máxima de PM = metade do custo total original.",
    tipo: "empilhavel",
    dados: [
      { nome: "Desconto Baixo",  orcamento: 1, pm: -1 },
      { nome: "Desconto Médio",  orcamento: 3, pm: -2 },
      { nome: "Desconto Alto",   orcamento: 6, pm: -4 }
    ]
  }
}

// ============================================================
//  TABELAS_PASSIVA — Lojinha de Características Passivas
//
//  REGRAS DE DESIGN:
//  • Sem coluna PM (campo pm ausente em todos os dados)
//  • "execucao" substituído por "gatilho"
//  • Sem "duracao", "condicoes", "descontos"
//  • Potência e Pressão têm orçamento maior (sem PM pra compensar)
//  • Alcance, Área e Alvos também com custo ajustado
// ============================================================

export const TABELAS_PASSIVA = {

  // ── IMPACTO DIRETO ─────────────────────────────────────

  potencia: {
    label: "Potência",
    base: "0 (sem potência)",
    descricao: "Usada para força de efeitos diretos e intensidade de resultados.",
    tipo: "empilhavel",
    dados: [
      { valor: 1,  orcamento: 2  },
      { valor: 3,  orcamento: 5  },
      { valor: 5,  orcamento: 8  },
      { valor: 10, orcamento: 15 }
    ]
  },

  pressao: {
    label: "Pressão",
    base: "0 (sem pressão)",
    descricao: "Usada para testes resistidos quando a passiva afeta outros seres.",
    tipo: "empilhavel",
    dados: [
      { valor: 1,  orcamento: 2  },
      { valor: 3,  orcamento: 5  },
      { valor: 5,  orcamento: 8  },
      { valor: 10, orcamento: 15 }
    ]
  },

  // ── GATILHO (substitui Execução) ───────────────────────

  gatilho: {
    label: "Gatilho",
    base: "Obrigatório — escolha um",
    descricao: "Define quando a passiva dispara. Não há PM — o custo está no orçamento.",
    tipo: "unico",
    dados: [
      { nome: "Sempre",                    orcamento: 10 },
      { nome: "Por turno",                 orcamento: 6  },
      { nome: "Ao usar uma característica",orcamento: 4  },
      { nome: "Ao receber algo",           orcamento: 4  },
      { nome: "Condição externa",          orcamento: 2  }
    ]
  },

  // ── ALCANCE ────────────────────────────────────────────

  alcance: {
    label: "Alcance",
    base: "Pessoal — gratuito",
    descricao: "Distância máxima que a passiva pode atingir quando dispara.",
    tipo: "unico",
    dados: [
      { nome: "Pessoal (Base)", orcamento: 0,  gratuita: true },
      { nome: "Toque",          orcamento: 2  },
      { nome: "Perto",          orcamento: 4  },
      { nome: "Longe",          orcamento: 7  },
      { nome: "Muito Longe",    orcamento: 12 }
    ]
  },

  // ── INFLIGIR AOS SERES ─────────────────────────────────

  area: {
    label: "Área",
    base: "1 alvo (base) — sem custo",
    descricao: "Expande quem a passiva atinge em raio. Mutuamente exclusivo com Alvos Adicionais.",
    tipo: "empilhavel",
    grupoExclusivo: "infligir",
    dados: [
      { nome: "1 metro",  orcamento: 4  },
      { nome: "3 metros", orcamento: 9  },
      { nome: "9 metros", orcamento: 18 }
    ]
  },

  alvos: {
    label: "Alvos Adicionais",
    base: "1 alvo (base) — sem custo",
    descricao: "Permite atingir mais de um alvo individualmente. Mutuamente exclusivo com Área.",
    tipo: "empilhavel",
    grupoExclusivo: "infligir",
    dados: [
      { nome: "1 alvo",  orcamento: 2  },
      { nome: "3 alvos", orcamento: 6  },
      { nome: "6 alvos", orcamento: 12 }
    ]
  }
}
