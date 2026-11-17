import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/ui"
import type { LegalDocument } from "@/config/legal"
import { LegalArticle } from "@/components/legal/LegalArticle"
import { LegalContext, LegalLink } from "./LegalLink"

const preferenceKey = "vc_cookie_notice_v1"
const preferenceLifetime = 180 * 24 * 60 * 60 * 1000

function noticeIsDismissed() {
  try {
    const value = Number(localStorage.getItem(preferenceKey))
    return value > Date.now() && value <= Date.now() + preferenceLifetime
  } catch {
    return false
  }
}

export function LegalProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [noticeVisible, setNoticeVisible] = useState(() => !noticeIsDismissed())
  const dialog = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element || !document) return
    previousFocus.current = window.document.activeElement as HTMLElement | null
    const previousOverflow = window.document.body.style.overflow
    element.showModal()
    window.document.body.style.overflow = "hidden"
    return () => {
      element.close()
      window.document.body.style.overflow = previousOverflow
      previousFocus.current?.focus()
    }
  }, [Boolean(document)])

  const dismissNotice = () => {
    try { localStorage.setItem(preferenceKey, String(Date.now() + preferenceLifetime)) } catch { /* Storage is optional. */ }
    setNoticeVisible(false)
  }
  const resetNotice = () => {
    try { localStorage.removeItem(preferenceKey) } catch { /* Storage is optional. */ }
    setNoticeVisible(true)
  }

  return (
    <LegalContext.Provider value={setDocument}>
      {children}
      {noticeVisible && (
        <aside className="cookie-notice" aria-label="Información sobre cookies">
          <div className="cookie-notice-icon"><Icon name="shield" size={22} /></div>
          <div>
            <strong>Tu privacidad cuenta.</strong>
            <p>Usamos una cookie necesaria para la sesión administrativa. Contacto incluye Google Maps, Instagram y TikTok, que pueden utilizar cookies de terceros.</p>
            <div className="cookie-notice-links">
              <LegalLink document="cookies" />
              <LegalLink document="privacy" />
            </div>
          </div>
          <button type="button" className="btn btn-secondary" onClick={dismissNotice}>Entendido</button>
        </aside>
      )}
      {createPortal(
        <dialog ref={dialog} className="legal-dialog" aria-labelledby="legal-dialog-title"
          onCancel={() => setDocument(null)} onClose={() => setDocument(null)}>
          {document && (
            <>
              <div className="legal-dialog-top">
                <span className="eyebrow">Información de la tienda</span>
                <button type="button" className="legal-close" aria-label="Cerrar información legal" onClick={() => setDocument(null)} autoFocus>
                  <Icon name="close" size={20} />
                </button>
              </div>
              <div className="legal-dialog-scroll" key={document}>
                <LegalArticle document={document} titleId="legal-dialog-title" compact onResetNotice={resetNotice} />
              </div>
            </>
          )}
        </dialog>, window.document.body,
      )}
    </LegalContext.Provider>
  )
}

export function resetCookieNotice() {
  try { localStorage.removeItem(preferenceKey) } catch { /* Storage is optional. */ }
  window.location.reload()
}
