// ============================================================
//  modelos/Elemento.js — Classe base para itens da ficha
// ============================================================

export class ElementoFicha {
  constructor({ id, nome, tipo, custo = 0, descricao = "", notas = "" } = {}) {
    this.id       = id ?? crypto.randomUUID()
    this.nome     = nome ?? "Sem nome"
    this.tipo     = tipo
    this.custo    = Number(custo)
    this.descricao = descricao
    this.notas    = notas || "Escreva uma nota para lembrar aqui..."
  }

  // Reconstrói a partir de um plain object (vindo do JSON)
  static fromJSON(obj) {
    return new ElementoFicha(obj)
  }
}
