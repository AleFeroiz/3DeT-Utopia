// ============================================================
//  dados/niveis.js — Tabela de Progressão (Livro pág. 26)
// ============================================================

export const TABELA_NIVEIS = [
  { nivel: 1,  pt: 10, maestriaLimite: 0, escalaMax: 3, profissaoNivel: 1, recompensa: "Início + Profissão Nível 1" },
  { nivel: 2,  pt: 3,  maestriaLimite: 0, escalaMax: 3, profissaoNivel: null, recompensa: "" },
  { nivel: 3,  pt: 3,  maestriaLimite: 1, escalaMax: 3, profissaoNivel: null, recompensa: "Maestria (Limite 1)" },
  { nivel: 4,  pt: 3,  maestriaLimite: 1, escalaMax: 3, profissaoNivel: null, recompensa: "" },
  { nivel: 5,  pt: 5,  maestriaLimite: 1, escalaMax: 3, profissaoNivel: 2,    recompensa: "Profissão Nível 2" },
  { nivel: 6,  pt: 3,  maestriaLimite: 1, escalaMax: 3, profissaoNivel: null, recompensa: "" },
  { nivel: 7,  pt: 3,  maestriaLimite: 1, escalaMax: 3, profissaoNivel: null, recompensa: "" },
  { nivel: 8,  pt: 3,  maestriaLimite: 2, escalaMax: 3, profissaoNivel: null, recompensa: "Maestria (Limite 2)" },
  { nivel: 9,  pt: 3,  maestriaLimite: 2, escalaMax: 4, profissaoNivel: null, recompensa: "Libera Escala 4" },
  { nivel: 10, pt: 5,  maestriaLimite: 2, escalaMax: 4, profissaoNivel: 3,    recompensa: "Profissão Nível 3" },
  { nivel: 11, pt: 3,  maestriaLimite: 2, escalaMax: 4, profissaoNivel: null, recompensa: "" },
  { nivel: 12, pt: 3,  maestriaLimite: 2, escalaMax: 4, profissaoNivel: null, recompensa: "" },
  { nivel: 13, pt: 3,  maestriaLimite: 3, escalaMax: 4, profissaoNivel: null, recompensa: "Maestria (Limite 3)" },
  { nivel: 14, pt: 3,  maestriaLimite: 3, escalaMax: 5, profissaoNivel: null, recompensa: "Libera Escala 5" },
  { nivel: 15, pt: 5,  maestriaLimite: 3, escalaMax: 5, profissaoNivel: 4,    recompensa: "Profissão Nível 4" },
  { nivel: 16, pt: 3,  maestriaLimite: 3, escalaMax: 5, profissaoNivel: null, recompensa: "" },
  { nivel: 17, pt: 3,  maestriaLimite: 3, escalaMax: 5, profissaoNivel: null, recompensa: "" },
  { nivel: 18, pt: 3,  maestriaLimite: 4, escalaMax: 5, profissaoNivel: null, recompensa: "Maestria (Limite 4)" },
  { nivel: 19, pt: 3,  maestriaLimite: 4, escalaMax: 6, profissaoNivel: null, recompensa: "Libera Escala 6" },
  { nivel: 20, pt: 5,  maestriaLimite: 4, escalaMax: 6, profissaoNivel: null, recompensa: "Ápice do Poder" },
]

/** Retorna os dados acumulados até o nível dado */
export function getDadosNivel(nivel) {
  const n = Math.max(1, Math.min(20, nivel))
  const linha = TABELA_NIVEIS[n - 1]

  // PT total = soma de todos os PTs até este nível
  const ptTotal = TABELA_NIVEIS.slice(0, n).reduce((acc, l) => acc + l.pt, 0)

  return {
    ...linha,
    ptTotal,
    // Nível de profissão desbloqueado = maior profissaoNivel até este nível
    profissaoNivelAtual: TABELA_NIVEIS.slice(0, n)
      .map(l => l.profissaoNivel)
      .filter(Boolean)
      .pop() ?? 1
  }
}
