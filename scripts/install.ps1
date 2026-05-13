param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\atli",
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
$LegacyInstallRoot = "$env:LOCALAPPDATA\Programs\onprem-atlassian-cli"
if ($LegacyInstallRoot -ne $InstallRoot -and (Test-Path -LiteralPath $LegacyInstallRoot)) {
  Remove-Item -LiteralPath $LegacyInstallRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
Get-ChildItem -LiteralPath $SourceRoot -Force | Copy-Item -Destination $InstallRoot -Recurse -Force

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$CmdPath = Join-Path $BinDir "atli.cmd"
$AtlasAliasPath = Join-Path $BinDir "atlas-ai.cmd"
$LegacyAliasPath = Join-Path $BinDir "onprem-atlassian.cmd"

$Cmd = "@echo off`r`n`"$NodePath`" `"$InstallRoot\bin\atli.js`" %*`r`n"
Set-Content -LiteralPath $CmdPath -Value $Cmd -Encoding ASCII
Set-Content -LiteralPath $AtlasAliasPath -Value $Cmd -Encoding ASCII
Set-Content -LiteralPath $LegacyAliasPath -Value $Cmd -Encoding ASCII

Write-Output "Installed atli to $InstallRoot"
Write-Output "Command shims created in $BinDir"
Write-Output "Using Node.js at $NodePath"
Write-Output "Add $BinDir to PATH if it is not already there."
