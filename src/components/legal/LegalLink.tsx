import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import { legalContent, legalPath } from "@/config/legal"
import type { LegalDocument } from "@/config/legal"

export const LegalContext = createContext<((document: LegalDocument) => void) | null>(null)

export function LegalLink({ document, children, className }: {
  document: LegalDocument
  children?: ReactNode
  className?: string
}) {
  const open = useContext(LegalContext)
  return (
    <a href={legalPath(document)} className={className} onClick={(event) => {
      if (!open || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      open(document)
    }}>
      {children || legalContent[document].title}
    </a>
  )
}
