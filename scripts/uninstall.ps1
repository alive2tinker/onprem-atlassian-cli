param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\atli",
  [string]$BinDir = "$HOME\.local\bin"
)

$ErrorActionPreference = "Stop"
Remove-Item -LiteralPath $InstallRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "$env:LOCALAPPDATA\Programs\onprem-atlassian-cli" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $BinDir "atli.cmd") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $BinDir "onprem-atlassian.cmd") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $BinDir "atlas-ai.cmd") -Force -ErrorAction SilentlyContinue
Write-Output "Removed atli CLI."
