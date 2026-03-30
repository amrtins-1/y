$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$pythonScript = Join-Path $scriptDir "atualiza_precos.py"
$logsDir = Join-Path $scriptDir "logs"

if (!(Test-Path $pythonScript)) {
    throw "Script Python nao encontrado: $pythonScript"
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logsDir ("atualiza_precos-" + $timestamp + ".log")

$pythonArgs = @($pythonScript)

Push-Location $repoRoot
try {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 @pythonArgs *>&1 | Tee-Object -FilePath $logFile
    }
    elseif (Get-Command python -ErrorAction SilentlyContinue) {
        & python @pythonArgs *>&1 | Tee-Object -FilePath $logFile
    }
    else {
        throw "Python nao encontrado no PATH (py/python)."
    }
}
finally {
    Pop-Location
}
