param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\onprem-atlassian-cli",
  [string]$BinDir = "$HOME\.local\bin"
)

$ErrorActionPreference = "Stop"
Remove-Item -LiteralPath $InstallRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $BinDir "onprem-atlassian.cmd") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $BinDir "atlas-ai.cmd") -Force -ErrorAction SilentlyContinue
Write-Output "Removed onprem-atlassian CLI."
