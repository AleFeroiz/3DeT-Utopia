// ============================================================
//  ui/uiToast.js — Sistema de notificações (substitui alert)
// ============================================================

let _container = null

function _getContainer() {
  if (!_container) {
    _container = document.createElement("div")
    _container.id = "toast-container"
    document.body.appendChild(_container)
  }
  return _container
}

/**
 * @param {string} mensagem
 * @param {"info"|"sucesso"|"erro"|"aviso"} tipo
 * @param {number} duracao ms
 */
export function toast(mensagem, tipo = "info", duracao = 3500) {
  const container = _getContainer()

  const el = document.createElement("div")
  el.className = `toast toast-${tipo}`

  const icones = { info: "ℹ️", sucesso: "✅", erro: "❌", aviso: "⚠️" }
  el.innerHTML = `
    <span class="toast-icon">${icones[tipo] ?? "ℹ️"}</span>
    <span class="toast-msg">${mensagem}</span>
    <button class="toast-close">×</button>
  `

  el.querySelector(".toast-close").onclick = () => remover(el)
  container.appendChild(el)

  // Entra com animação
  requestAnimationFrame(() => el.classList.add("toast-visible"))

  // Sai automaticamente
  const timer = setTimeout(() => remover(el), duracao)
  el._timer = timer

  return el
}

function remover(el) {
  clearTimeout(el._timer)
  el.classList.remove("toast-visible")
  el.addEventListener("transitionend", () => el.remove(), { once: true })
}

// Atalhos
export const toastErro   = (msg) => toast(msg, "erro",    4000)
export const toastAviso  = (msg) => toast(msg, "aviso",   3500)
export const toastSucesso= (msg) => toast(msg, "sucesso", 2500)
export const toastInfo   = (msg) => toast(msg, "info",    3000)
