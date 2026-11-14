import { Brand } from "@/components/store/FlowLayout"
import { Field } from "@/components/ui"
import { commercialConfig } from "@/config/commercial"
import { api } from "@/services/api"
import type { Admin } from "@/types/models"
import type { FormEvent } from "react"
import { useState } from "react"
import { errorMessage } from "@/utils/errors"

export function AdminLogin({
  onLogin,
  onBack,
}: {
  onLogin: (admin: Admin) => void
  onBack: () => void
}) {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError("")
    try {
      onLogin(
        (
          await api.login(
            String(data.get("email")),
            String(data.get("password")),
          )
        ).admin,
      )
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="admin-login page-enter">
      <div className="login-brand">
        <Brand onClick={onBack} />
        <button className="text-link" onClick={onBack}>
          Volver a la tienda
        </button>
      </div>
      <section className="login-card">
        <span className="eyebrow">Acceso privado</span>
        <h1>Bienvenido de nuevo.</h1>
        <p>Administra {commercialConfig.businessName}.</p>
        <form onSubmit={submit}>
          <Field label="Correo electrónico">
            <input name="email" type="email" autoComplete="username" required />
          </Field>
          <Field label="Contraseña">
            <div className="password-field">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </Field>
          {error && (
            <p className="form-banner-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn btn-primary wide"
            type="submit"
            disabled={busy}
          >
            {busy ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  )
}
