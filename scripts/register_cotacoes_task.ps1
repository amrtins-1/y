$ErrorActionPreference = "Stop"

$taskName = "Instituto-Cotacoes-Atualizacao-Diaria"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runnerPath = Join-Path $scriptDir "run_atualiza_precos.ps1"

if (!(Test-Path $runnerPath)) {
    throw "Runner nao encontrado: $runnerPath"
}

$escapedRunner = '"' + $runnerPath + '"'
$taskRun = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File ' + $escapedRunner

schtasks /Delete /TN $taskName /F | Out-Null 2>&1

$result = schtasks /Create `
    /TN $taskName `
    /SC DAILY `
    /ST 05:00 `
    /RL LIMITED `
    /TR $taskRun `
    /F

$null = $result
Write-Host "Tarefa criada: $taskName (diariamente as 05:00)."

schtasks /Query /TN $taskName /V /FO LIST
