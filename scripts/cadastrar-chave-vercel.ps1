<#
  Cadastra uma chave (Comunidade BR, Stripe) na Vercel (conta wowhelpbrasil, projeto
  wowhelp), em Production e Preview, como "Sensitive". O valor é pedido escondido,
  não aparece na tela, não vai para arquivo nem para o chat.

  Uso (PowerShell, na pasta do projeto):
    powershell -ExecutionPolicy Bypass -File scripts\cadastrar-chave-vercel.ps1 YOUTUBE_API_KEY
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('YOUTUBE_API_KEY', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'KICK_CLIENT_ID', 'KICK_CLIENT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET')]
  [string]$Nome
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

# Pelo cmd: o Windows PowerShell trata o aviso do npm (stderr) como erro e para o script.
$conta = (cmd.exe /c 'npx --yes vercel whoami 2>nul' | Select-Object -Last 1)
if ($conta -notmatch 'wowhelpbrasil') {
  Write-Host "A Vercel esta logada em '$conta', nao na conta do WoWHelp. Nada foi feito."
  exit 1
}

$seguro = Read-Host "Cole o valor de $Nome (nao aparece na tela) e aperte Enter" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
try { $valor = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if (-not $valor) { Write-Host 'Valor vazio. Nada foi feito.'; exit 1 }

# Chave do YouTube: testa no Google antes de salvar (consulta gratuita de 1 unidade).
if ($Nome -eq 'YOUTUBE_API_KEY') {
  try {
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@YouTube&key=$valor" | Out-Null
    Write-Host 'Chave do YouTube testada: funciona.'
  } catch {
    Write-Host 'O Google recusou a chave. Confira se a "YouTube Data API v3" esta ativada no projeto e se a chave esta liberada para ela. Nada foi feito.'
    exit 1
  }
}

# Chaves do Stripe: confere o formato (e testa a secreta no Stripe) antes de salvar.
$ambientes = 'production', 'preview'
if ($Nome -eq 'STRIPE_SECRET_KEY') {
  if ($valor -notmatch '^(sk|rk)_(test|live)_[A-Za-z0-9]+$') {
    Write-Host 'Isso nao parece a chave secreta do Stripe (comeca com sk_test_ ou sk_live_). Nada foi feito.'
    exit 1
  }
  try {
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 -Headers @{ Authorization = "Bearer $valor" } 'https://api.stripe.com/v1/prices?limit=1' | Out-Null
    Write-Host 'Chave do Stripe testada: funciona.'
  } catch {
    Write-Host 'O Stripe recusou a chave. Confira se copiou a "Chave secreta" inteira da conta certa. Nada foi feito.'
    exit 1
  }
  # Chave real (cobranca de verdade) so vai para a producao, nunca para os previews.
  if ($valor -match '^(sk|rk)_live_') { $ambientes = 'production' }
}
if ($Nome -eq 'STRIPE_WEBHOOK_SECRET' -and $valor -notmatch '^whsec_[A-Za-z0-9]+$') {
  Write-Host 'Isso nao parece o segredo do aviso do Stripe (comeca com whsec_). Nada foi feito.'
  exit 1
}

foreach ($ambiente in $ambientes) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo 'cmd.exe', "/c npx --yes vercel env add $Nome $ambiente --sensitive --force --yes"
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $p = [System.Diagnostics.Process]::Start($psi)
  $saida = $p.StandardOutput.ReadToEndAsync()
  $erro = $p.StandardError.ReadToEndAsync()
  # Sem quebra de linha no fim: a Vercel guarda exatamente o valor colado.
  $p.StandardInput.Write($valor)
  $p.StandardInput.Close()
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) {
    Write-Host "Falhou ao cadastrar em $ambiente."
    Write-Host $erro.Result
    exit 1
  }
  Write-Host "$Nome cadastrada em $ambiente."
}
$valor = $null
Write-Host 'Pronto. Avise o Claude: ele publica de novo e testa.'
