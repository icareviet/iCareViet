$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectDirectory '.runtime\php'
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
$releaseIndex = Invoke-RestMethod -Uri 'https://windows.php.net/downloads/releases/releases.json'
$releaseArchive = $releaseIndex.'8.5'.'nts-vs17-x64'.zip
$archivePath = Join-Path $projectDirectory '.runtime\php.zip'
Invoke-WebRequest -Uri ('https://windows.php.net/downloads/releases/' + $releaseArchive.path) -OutFile $archivePath
if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $releaseArchive.sha256) { throw 'PHP archive checksum mismatch.' }
Expand-Archive -LiteralPath $archivePath -DestinationPath $runtimeDirectory -Force
$extensionPath = Join-Path $runtimeDirectory 'ext'
@"
extension_dir="$extensionPath"
extension=pdo_sqlite
extension=sqlite3
extension=mbstring
extension=openssl
expose_php=Off
display_errors=Off
log_errors=On
date.timezone=Asia/Ho_Chi_Minh
"@ | Set-Content -LiteralPath (Join-Path $runtimeDirectory 'php.ini') -Encoding utf8
& (Join-Path $runtimeDirectory 'php.exe') --version
