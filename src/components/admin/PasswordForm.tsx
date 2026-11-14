import { Field } from "@/components/ui"
import { api } from "@/services/api"
import type { FormEvent } from "react"
import { useState } from "react"

export function PasswordForm() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get("newPassword"))
    if (password !== form.get("confirmPassword")) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }
    setBusy(true)
    setError("")
    try {
      await api.changePassword(String(form.get("currentPassword")), password)
      window.dispatchEvent(new Event("vc:unauthorized"))
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cambiar la contraseña",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="settings-card" onSubmit={submit}>
      <h2>Cambiar contraseña</h2>
      <p>
        Al guardar se cerrarán todas las sesiones. Vuelve a ingresar con tu
        contraseña nueva.
      </p>
      <div className="form-grid">
        <Field label="Contraseña actual">
          <input
            type="password"
            autoComplete="current-password"
            name="currentPassword"
            required
            maxLength={256}
          />
        </Field>
        <Field label="Nueva contraseña (mínimo 14 caracteres)">
          <input
            type="password"
            autoComplete="new-password"
            name="newPassword"
            required
            minLength={14}
            maxLength={256}
          />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <input
            type="password"
            autoComplete="new-password"
            name="confirmPassword"
            required
            minLength={14}
            maxLength={256}
          />
        </Field>
      </div>
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Cambiar contraseña y salir"}
      </button>
    </form>
  )
}
