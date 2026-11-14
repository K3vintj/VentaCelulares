import { State, Title } from "@/components/admin/AdminUi"
import { PasswordForm } from "@/components/admin/PasswordForm"
import { Field } from "@/components/ui"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import type { BusinessConfig } from "@/types/models"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"

export function ConfigPage({
  notices,
  onChanged,
}: {
  notices: boolean
  onChanged: (config: BusinessConfig) => void
}) {
  const { data, error, loading, reload } = useData(api.config)
  const [config, setConfig] = useState<BusinessConfig | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    if (data) setConfig(data.config)
  }, [data])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!config || busy) return
    setBusy(true)
    setMessage("")
    try {
      const result = await api.saveConfig(config)
      onChanged(result.config)
      setMessage("Cambios guardados")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="admin-content page-enter">
      <Title
        title={notices ? "Avisos comerciales" : "Configuración del negocio"}
        text="Los cambios se guardan en el servidor y se muestran en la tienda."
      />
      <State loading={loading} error={error} retry={reload} />
      {config && (
        <form className="settings-card" onSubmit={submit}>
          {!notices ? (
            <div className="form-grid">
              <Field label="Nombre del negocio">
                <input
                  required
                  value={config.businessName}
                  onChange={(e) =>
                    setConfig({ ...config, businessName: e.target.value })
                  }
                />
              </Field>
              <Field label="WhatsApp con código de país">
                <input
                  required
                  pattern="[0-9]{10,15}"
                  value={config.whatsapp}
                  onChange={(e) =>
                    setConfig({ ...config, whatsapp: e.target.value })
                  }
                />
              </Field>
              <Field label="Días de garantía">
                <input
                  required
                  type="number"
                  min={1}
                  max={3650}
                  value={config.warrantyDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      warrantyDays: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
          ) : (
            <>
              {config.noticesJson.map((notice, i) => (
                <section className="form-section" key={notice.id}>
                  <Field label="Título">
                    <input
                      required
                      maxLength={180}
                      value={notice.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          noticesJson: config.noticesJson.map((n, j) =>
                            j === i ? { ...n, title: e.target.value } : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Texto del aviso">
                    <textarea
                      required
                      maxLength={2000}
                      value={notice.text}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          noticesJson: config.noticesJson.map((n, j) =>
                            j === i ? { ...n, text: e.target.value } : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <button
                    className="text-link"
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        noticesJson: config.noticesJson.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  >
                    Eliminar aviso
                  </button>
                </section>
              ))}
              <button
                className="btn btn-secondary"
                disabled={config.noticesJson.length >= 12}
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    noticesJson: [
                      ...config.noticesJson,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        text: "",
                        icon: "info",
                        featured: config.noticesJson.length === 0,
                        positive: true,
                      },
                    ],
                  })
                }
              >
                Agregar aviso
              </button>
            </>
          )}
          {message && <p role="status">{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}
      {!notices && <PasswordForm />}
    </div>
  )
}
