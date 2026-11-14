param([Parameter(Mandatory=$true)][string]$Email)
$ErrorActionPreference = 'Stop'
$taskRepository = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$taskPassword = Read-Host 'Nueva contraseña (mínimo 14 caracteres)' -AsSecureString
$taskConfirmation = Read-Host 'Repite la contraseña nueva' -AsSecureString
$taskPlain = [System.Net.NetworkCredential]::new('', $taskPassword).Password
$taskRepeat = [System.Net.NetworkCredential]::new('', $taskConfirmation).Password
try {
    if ($taskPlain.Length -lt 14 -or $taskPlain -cne $taskRepeat) { throw 'Las contraseñas no coinciden o no cumplen el mínimo.' }
    $taskPayload = @{ email=$Email; password=$taskPlain } | ConvertTo-Json -Compress
    # The password is passed through stdin, never through arguments, Git or a log.
    $taskPayload | & (Join-Path $taskRepository 'backend/node_modules/.bin/tsx.cmd') (Join-Path $taskRepository 'backend/src/scripts/recover-admin.ts') --stdin
    if ($LASTEXITCODE -ne 0) { throw 'No se completó la recuperación.' }
} finally {
    $taskPlain = $null; $taskRepeat = $null; $taskPayload = $null
    $taskPassword.Dispose(); $taskConfirmation.Dispose()
}
