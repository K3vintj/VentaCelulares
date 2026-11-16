import { Notices } from "@/pages/public/Notices"
import { Welcome } from "@/pages/public/Welcome"
import { useCallback, useEffect, useRef } from "react"

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function IntroFlow({
  active,
  configRevision,
  onSkip,
  onContinue,
}: {
  active: "welcome" | "notices"
  configRevision: number
  onSkip: () => void
  onContinue: () => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const welcomeRef = useRef<HTMLDivElement>(null)
  const noticesRef = useRef<HTMLDivElement>(null)
  const scrollBehavior = (): ScrollBehavior =>
    prefersReducedMotion() ? "auto" : "smooth"
  const scrollToPanel = useCallback((panel: "welcome" | "notices") => {
    const scroller = scrollerRef.current
    const target =
      panel === "welcome" ? welcomeRef.current : noticesRef.current
    if (!scroller || !target) return
    scroller.scrollTo({
      top: target.offsetTop,
      behavior: scrollBehavior(),
    })
  }, [])
  useEffect(() => {
    const scroller = scrollerRef.current
    const noticesPanel = noticesRef.current
    if (!scroller || !noticesPanel) return
    if (active === "notices") {
      scroller.scrollTo({ top: noticesPanel.offsetTop, behavior: "auto" })
      return
    }
    scroller.scrollTo({ top: 0, behavior: "auto" })
  }, [active])
  useEffect(() => {
    const scroller = scrollerRef.current
    const noticesPanel = noticesRef.current
    if (!scroller || !noticesPanel) return
    if (prefersReducedMotion()) {
      noticesPanel.classList.add("is-inview")
      return
    }
    const reveal = () => noticesPanel.classList.add("is-inview")
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        reveal()
        observer.disconnect()
      },
      { root: scroller, threshold: 0.18 },
    )
    observer.observe(noticesPanel)
    const fallback = window.setTimeout(reveal, 2500)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [configRevision])
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || prefersReducedMotion()) return
    const media = window.matchMedia("(max-width: 760px)")
    if (media.matches) return
    let frame = 0
    const handleScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        scroller.style.setProperty(
          "--intro-scroll",
          String(scroller.scrollTop),
        )
      })
    }
    handleScroll()
    scroller.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener("scroll", handleScroll)
      scroller.style.removeProperty("--intro-scroll")
    }
  }, [])
  useEffect(() => {
    const scroller = scrollerRef.current
    const noticesPanel = noticesRef.current
    if (!scroller || !noticesPanel) return
    const syncLandmark = () => {
      const midpoint = scroller.scrollTop + scroller.clientHeight * 0.45
      const onNotices = midpoint >= noticesPanel.offsetTop
      scroller.setAttribute(
        "aria-label",
        onNotices
          ? "Condiciones comerciales"
          : "Bienvenida a la tienda",
      )
    }
    syncLandmark()
    scroller.addEventListener("scroll", syncLandmark, { passive: true })
    return () => scroller.removeEventListener("scroll", syncLandmark)
  }, [])
  return (
    <div
      ref={scrollerRef}
      id="main-content"
      tabIndex={-1}
      className="intro-flow"
      aria-label={
        active === "notices"
          ? "Condiciones comerciales"
          : "Bienvenida a la tienda"
      }
    >
      <div className="intro-flow-track">
        <div
          ref={welcomeRef}
          id="intro-welcome"
          className="intro-panel intro-panel--welcome"
        >
          <Welcome
            embedded
            onNext={() => scrollToPanel("notices")}
            onSkip={onSkip}
          />
        </div>
        <div
          ref={noticesRef}
          id="intro-notices"
          className="intro-panel intro-panel--notices notice-reveal"
        >
          <Notices
            key={configRevision}
            embedded
            onContinue={onContinue}
          />
        </div>
      </div>
    </div>
  )
}
