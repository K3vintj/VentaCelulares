# Autoridad de certificación de Supabase

`supabase-root-2021.crt` es un certificado **público**, no una clave privada.

Descargado desde el endpoint HTTPS de distribución de Supabase:
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

SHA-256 del certificado X.509:
`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`

Vigencia hasta el 26 de abril de 2031. Antes de una rotación, comprobar el certificado en Database Settings de Supabase y volver a verificar la conexión. La aplicación usa `verify-full`; nunca desactiva `rejectUnauthorized`.

Referencia: https://supabase.com/docs/guides/platform/ssl-enforcement
