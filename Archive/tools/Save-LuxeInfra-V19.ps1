$ErrorActionPreference = 'Stop'
$sourceRoot = 'C:\Users\Rajeev Ratan Rai\Documents\Codex\2026-10-11\i\work\luxeweb'
$desktopRoot = 'C:\Users\Rajeev Ratan Rai\OneDrive\Desktop\LuxeWeb'
$snapshotRoot = Join-Path $desktopRoot 'luxeinfra-refined-v19'
$archivePath = Join-Path $desktopRoot 'LuxeInfra-Refined-v19.zip'
$evidenceRoot = Join-Path $desktopRoot 'review-evidence-v19'
if (-not (Test-Path -LiteralPath $desktopRoot -PathType Container)) { throw 'Desktop LuxeWeb folder is missing.' }
if ((Test-Path -LiteralPath $snapshotRoot) -or (Test-Path -LiteralPath $archivePath)) { throw 'The v19 snapshot already exists; inspect it before resuming this save.' }
$sourceFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($folder in @('src','scripts','tests','public','owner-inputs')) {
  Get-ChildItem -LiteralPath (Join-Path $sourceRoot $folder) -File -Recurse | ForEach-Object { $sourceFiles.Add($_) }
}
$topNames = @('Dockerfile','.dockerignore','.gitignore','.prettierignore','.prettierrc','.env.example','.env.review')
Get-ChildItem -LiteralPath $sourceRoot -File | Where-Object { $_.Extension -in @('.md','.json','.ts','.js','.cmd') -or $_.Name -in $topNames } | ForEach-Object { $sourceFiles.Add($_) }
$manifest = [ordered]@{}
New-Item -ItemType Directory -Path $snapshotRoot | Out-Null
foreach ($sourceFile in ($sourceFiles | Sort-Object FullName)) {
  $relative = [System.IO.Path]::GetRelativePath($sourceRoot, $sourceFile.FullName)
  if ($relative -match '(^|[\\/])(node_modules|dist|outputs|\.private|\.git|\.npm-cache|\.tanstack)([\\/]|$)') { throw ('Excluded source path: ' + $relative) }
  if ($sourceFile.Name -like '.env*' -and $sourceFile.Name -notin @('.env.example','.env.review')) { throw 'Unapproved environment file.' }
  $destination = Join-Path $snapshotRoot $relative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  Copy-Item -LiteralPath $sourceFile.FullName -Destination $destination
  $sourceHash = (Get-FileHash -LiteralPath $sourceFile.FullName -Algorithm SHA256).Hash
  if ($sourceHash -ne (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash) { throw ('Copy hash mismatch: ' + $relative) }
  $manifest[$relative.Replace('\','/')] = $sourceHash
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($relative in $manifest.Keys) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $snapshotRoot $relative), ('luxeinfra-refined-v19/' + $relative), [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $archive.Dispose() }
$verifyArchive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
  if ($verifyArchive.Entries.Count -ne $manifest.Count) { throw 'Archive entry count mismatch.' }
  foreach ($entry in $verifyArchive.Entries) {
    $relative = $entry.FullName.Substring('luxeinfra-refined-v19/'.Length)
    $stream = $entry.Open()
    try { $zipHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($stream)) } finally { $stream.Dispose() }
    if ($zipHash -ne $manifest[$relative]) { throw ('Archive hash mismatch: ' + $relative) }
  }
} finally { $verifyArchive.Dispose() }
New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
Get-ChildItem -LiteralPath (Join-Path $sourceRoot 'outputs/review-v19') -File | ForEach-Object {
  $destination = Join-Path $evidenceRoot $_.Name
  Copy-Item -LiteralPath $_.FullName -Destination $destination
  if ((Get-FileHash -LiteralPath $_.FullName).Hash -ne (Get-FileHash -LiteralPath $destination).Hash) { throw ('Evidence mismatch: ' + $_.Name) }
}
foreach ($name in @('workdone.md','README.md','UI-REFINEMENTS-V19.md','QA-REPORT-V19.md','UI-UX-AUDIT-2026-10-22.md','LAUNCH-CHECKLIST.md','LAUNCH-README.md','RELEASE-VERIFICATION.md')) {
  Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination $desktopRoot
  if ((Get-FileHash -LiteralPath (Join-Path $sourceRoot $name)).Hash -ne (Get-FileHash -LiteralPath (Join-Path $desktopRoot $name)).Hash) { throw ('Current note mismatch: ' + $name) }
}
Copy-Item -LiteralPath (Join-Path $sourceRoot 'owner-inputs/AFTER-UI-AUDIT-V19.md') -Destination $desktopRoot
$summary = [ordered]@{ version = 19; files = $manifest.Count; sourceCopy = 'SHA256 verified'; archiveEntries = 'SHA256 verified'; archiveSHA256 = (Get-FileHash -LiteralPath $archivePath).Hash; archiveBytes = (Get-Item -LiteralPath $archivePath).Length; snapshot = $snapshotRoot; archive = $archivePath }
$summary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $evidenceRoot 'SAVE-VERIFICATION.json')
$summary | ConvertTo-Json
