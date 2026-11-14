import { useEffect } from "react"

/** Mueve el foco al contenido principal al cambiar de vista (2.4.3). */
export const useViewFocus = (viewKey: string) => {
  useEffect(() => {
    const main = document.getElementById("main-content")
    if (!main) return
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1")
    main.focus({ preventScroll: true })
    window.scrollTo({ top: 0, left: 0 })
  }, [viewKey])
}
