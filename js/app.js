// ============================================================
//  app.js — Ponto de entrada da Ficha.html
//  Cola todos os módulos e gerencia o estado global
// ============================================================

import { Storage } from "./storage.js"
import { Ficha   } from "./modelos/Ficha.js"

import {
  sincronizarAtributosParaFicha,
  renderAtributos,
  renderStatus,
  renderPontos,
  atualizarBarras
} from "./ui/uiAtributos.js"

import {
  renderElementos,
  renderPericias
} from "./ui/uiElementos.js"

import {
  registrarCallbacks,
  abrirListaLivro,
  abrirCriarElemento,
  confirmarCriacaoElemento,
  abrirCriarFonte,
  atualizarCustoFonte,
  atualizarSubtipoFonte,
  confirmarSalvarFonte,
  abrirCriarCaracteristica,
  atualizarEscala,
  confirmarCriarCaracteristica,
  renderCaracteristicasFonte,
  trocarAbaCarac,
  fecharModal
} from "./ui/uiModal.js"

// ─────────────────────────────────────────────────────────
//  ESTADO GLOBAL
// ─────────────────────────────────────────────────────────

let ficha = null

// ─────────────────────────────────────────────────────────
//  INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {

  // Carrega ficha do localStorage
  const dados = Storage.carregarFichaAtual()

  if (dados) {
    ficha = Ficha.fromJSON(dados.ficha)
  } else {
    // Fallback: ficha nova (não deveria acontecer em fluxo normal)
    ficha = Ficha.nova()
  }

  // Calcula status antes de renderizar
  ficha.calcularStatus()
  ficha.calcularPontos()

  // Registra callbacks dos modais
  registrarCallbacks({
    onSalvarElemento: (elemento) => {
      if (elemento) ficha.adicionarElemento(elemento)
      renderTudo()
      salvar()
    },
    onSalvarFonte: (fonte) => {
      ficha.adicionarElemento(fonte)
      renderTudo()
      salvar()
    }
  })

  // Expõe funções para o HTML (onclick inline)
  expor()

  // Renderiza tudo
  renderTudo()

  // Bind dos inputs de status (barras)
  document.getElementById("paAtual").oninput = () => {
    ficha.status.pa.atual = +document.getElementById("paAtual").value || 0
    atualizarBarras(ficha)
    salvar()
  }
  document.getElementById("pmAtual").oninput = () => {
    ficha.status.pm.atual = +document.getElementById("pmAtual").value || 0
    atualizarBarras(ficha)
    salvar()
  }
  document.getElementById("pvAtual").oninput = () => {
    ficha.status.pv.atual = +document.getElementById("pvAtual").value || 0
    atualizarBarras(ficha)
    salvar()
  }

  // Bind do custo da fonte
})

// ─────────────────────────────────────────────────────────
//  RENDER CENTRAL
// ─────────────────────────────────────────────────────────

function renderTudo() {
  renderAtributos(ficha)
  renderStatus(ficha)
  renderPontos(ficha)
  renderPericias(ficha, (id) => {
    ficha.togglePericia(id)
    renderPontos(ficha)
    salvar()
  })
  renderElementos(ficha, {
    onEditar:  (id) => {
      const el = ficha.encontrarElemento(id)
      if (el) abrirCriarElemento(el.tipo, el)
    },
    onRemover: (id) => {
      ficha.removerElemento(id)
      renderTudo()
      salvar()
    }
  })
}

// ─────────────────────────────────────────────────────────
//  PERSISTÊNCIA
// ─────────────────────────────────────────────────────────

function salvar() {
  Storage.salvarFichaAtual(ficha.toJSON())
}

// ─────────────────────────────────────────────────────────
//  FUNÇÕES EXPOSTAS PARA O HTML (onclick="...")
//  Necessário pois usamos type="module" (escopo fechado)
// ─────────────────────────────────────────────────────────

function expor() {

  // Troca de aba principal
  window.trocarAba = (i) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"))
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"))
    document.querySelectorAll(".tab")[i].classList.add("active")
    document.querySelectorAll(".section")[i].classList.add("active")
  }

  // Atributos — disparado pelo oninput dos círculos
  window.atualizar = () => {
    sincronizarAtributosParaFicha(ficha)
    ficha.calcularStatus()
    ficha.calcularPontos()
    renderStatus(ficha)
    renderPontos(ficha)
    salvar()
  }

  // Elementos
  window.abrirLista    = (tipo) => abrirListaLivro(tipo)
  window.criarElemento = (tipo) => abrirCriarElemento(tipo)
  window.confirmarCriacao = () => {
    confirmarCriacaoElemento()
    renderTudo()
    salvar()
  }

  // Fontes de poder
  window.criarFonte               = abrirCriarFonte
  window.salvarFonte              = confirmarSalvarFonte
  window.atualizarCustoFonte      = atualizarCustoFonte
  window.atualizarSubtipoFonte    = atualizarSubtipoFonte
  window.abrirModalCaracteristica = () => abrirCriarCaracteristica(null)
  window.adicionarCaracteristica  = confirmarCriarCaracteristica
  window.atualizarEscala          = atualizarEscala

  // Abas internas da característica
  window.trocarAbaCarac = trocarAbaCarac

  // Fechar modais
  window.fecharModal             = (id) => fecharModal(id)
  window.fecharModalCriar        = () => fecharModal("modalCriar")
  window.fecharModalFonte        = () => fecharModal("modalFonte")
  window.fecharModalCaracteristica = () => fecharModal("modalCaracteristica")
}
