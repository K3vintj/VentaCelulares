import { RefObject, useEffect, useRef } from "react"

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

const getFocusable = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  )

/**
 * Trampa de foco para diálogos/modales (WCAG 2.4.3 / 2.1.2).
 * Enfoca el contenedor al abrir, cicla Tab dentro y restaura el foco al cerrar.
 */
export const useFocusTrap = (
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) => {
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusable = getFocusable(container)
    const initial =
      container.querySelector<HTMLElement>("[data-autofocus]") ||
      focusable[0] ||
      container
    initial.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onEscapeRef.current?.()
        return
      }
      if (event.key !== "Tab") return
      const items = getFocusable(container)
      if (items.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault()
        last.focus()
        return
      }
      if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [active, containerRef])
}
