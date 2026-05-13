param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\onprem-atlassian-cli",
  [string]$BinDir = "$HOME\.local\bin"
)

$ErrorActionPreference = "Stop"
$SourceRoot = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 20 or newer is required. Install Node.js, then rerun this script."
}
$NodePath = (Get-Command node).Source

if (Test-Path -LiteralPath $InstallRoot) {
  Remove-Item -LiteralPath $InstallRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
Get-ChildItem -LiteralPath $SourceRoot -Force | Copy-Item -Destination $InstallRoot -Recurse -Force

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$CmdPath = Join-Path $BinDir "onprem-atlassian.cmd"
$AliasPath = Join-Path $BinDir "atlas-ai.cmd"

$Cmd = "@echo off`r`n`"$NodePath`" `"$InstallRoot\bin\onprem-atlassian.js`" %*`r`n"
Set-Content -LiteralPath $CmdPath -Value $Cmd -Encoding ASCII
Set-Content -LiteralPath $AliasPath -Value $Cmd -Encoding ASCII

Write-Output "Installed onprem-atlassian to $InstallRoot"
Write-Output "Command shims created in $BinDir"
Write-Output "Using Node.js at $NodePath"
Write-Output "Add $BinDir to PATH if it is not already there."
