import { LegalArticle } from "@/components/legal/LegalArticle"
import { resetCookieNotice } from "@/components/legal/LegalProvider"
import { StoreFooter } from "@/components/store/StoreFooter"
import { Logo } from "@/components/ui"
import type { LegalDocument } from "@/config/legal"
import { legalContent } from "@/config/legal"
import { commercialConfig } from "@/config/commercial"
import { useEffect } from "react"

export function LegalPage({ document }: { document: LegalDocument }) {
  const home = () => window.location.assign(import.meta.env.BASE_URL)
  const navigate = (hash: string) => window.location.assign(`${import.meta.env.BASE_URL}#${hash}`)
  useEffect(() => {
    window.document.title = `${legalContent[document].title} | ${commercialConfig.businessName}`
  }, [document, commercialConfig.businessName])
  return (
    <>
      <div className="legal-page-top"><Logo onClick={home} /><a href={import.meta.env.BASE_URL} className="text-link">← Volver a la tienda</a></div>
      <main id="main-content" tabIndex={-1} className="legal-page page-enter">
        <LegalArticle document={document} titleId="legal-page-title" onResetNotice={resetCookieNotice} />
      </main>
      <StoreFooter onOpenCatalog={() => navigate("catalogo")} onOpenNotices={() => navigate("condiciones")} onOpenContact={() => navigate("contacto")} />
    </>
  )
}
