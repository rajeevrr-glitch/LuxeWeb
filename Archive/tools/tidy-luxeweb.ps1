$ErrorActionPreference = 'Stop'
$projectRoot = 'C:\Users\Rajeev Ratan Rai\Documents\Codex\2026-10-11\i\work\luxeweb'
$workRoot = Split-Path -Parent $projectRoot
$desktopRoot = 'C:\Users\Rajeev Ratan Rai\OneDrive\Desktop\LuxeWeb'
$archiveRoot = Join-Path $desktopRoot 'Archive'
$versionsRoot = Join-Path $archiveRoot 'versions'
$summary = [ordered]@{ verifiedSourceFoldersRemoved = 0; unmatchedSourcesPreserved = 0; duplicateFilesRemoved = 0; historicalItemsOrganised = 0; privateFoldersUntouched = 0 }

function Assert-InRoot([string]$candidate, [string]$root) {
  $full = [IO.Path]::GetFullPath($candidate).TrimEnd('\')
  $parent = [IO.Path]::GetFullPath($root).TrimEnd('\')
  if (-not $full.StartsWith($parent + '\', [StringComparison]::OrdinalIgnoreCase)) { throw ('Target escapes intended directory: ' + $full) }
  return $full
}
foreach ($root in @($projectRoot, $workRoot, $desktopRoot)) {
  if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw ('Missing expected directory: ' + $root) }
}
$preCleanup = Join-Path $desktopRoot 'LuxeInfra-Refined-v22.zip'
$archivedPreCleanup = Join-Path $versionsRoot 'LuxeInfra-Refined-v22.zip'
$backup = if (Test-Path -LiteralPath $preCleanup) { $preCleanup } else { $archivedPreCleanup }
if (-not (Test-Path -LiteralPath $backup)) { throw 'The verified pre-cleanup source backup is missing.' }
if ((Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash -ne '412C746CE140E2A8EE2ADB9A25527743C185821DDB7AC222115466D7EF493B3C') { throw 'The pre-cleanup archive no longer matches its verified hash.' }
foreach ($folder in @($archiveRoot, $versionsRoot, (Join-Path $archiveRoot 'notes'), (Join-Path $archiveRoot 'evidence'), (Join-Path $archiveRoot 'original'), (Join-Path $archiveRoot 'source-history'), (Join-Path $archiveRoot 'tools'))) {
  New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

function Archive-File([IO.FileInfo]$file, [string]$target) {
  $destination = Assert-InRoot $target $archiveRoot
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  if (Test-Path -LiteralPath $destination) {
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    if ($hash -eq (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash) {
      Remove-Item -LiteralPath $file.FullName
      $summary.duplicateFilesRemoved++
      return
    }
    $destination = Join-Path (Split-Path -Parent $destination) ($file.BaseName + '-' + $hash.Substring(0,8).ToLowerInvariant() + $file.Extension)
    if (Test-Path -LiteralPath $destination) {
      if ($hash -ne (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash) { throw 'Archive conflict.' }
      Remove-Item -LiteralPath $file.FullName
      $summary.duplicateFilesRemoved++
      return
    }
  }
  Move-Item -LiteralPath $file.FullName -Destination $destination
  $summary.historicalItemsOrganised++
}

function Archive-Directory([string]$source, [string]$target, [string]$sourceRoot) {
  $sourcePath = Assert-InRoot $source $sourceRoot
  $destination = Assert-InRoot $target $archiveRoot
  if ((Get-Item -LiteralPath $sourcePath -Force).LinkType) { throw 'Refusing to move a folder link.' }
  if (Test-Path -LiteralPath $destination) { throw ('Archive folder already exists: ' + $destination) }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  Move-Item -LiteralPath $sourcePath -Destination $destination
  $summary.historicalItemsOrganised++
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
function Matches-Archive([string]$folder, [string]$zipFile) {
  if (-not (Test-Path -LiteralPath $zipFile)) { return $false }
  if ((Get-Item -LiteralPath $folder -Force).LinkType) { return $false }
  if (Get-ChildItem -LiteralPath $folder -Directory -Recurse -Force | Where-Object LinkType) { return $false }
  $files = @(Get-ChildItem -LiteralPath $folder -File -Recurse -Force)
  $zip = [IO.Compression.ZipFile]::OpenRead($zipFile)
  try {
    $entries = @($zip.Entries | Where-Object { -not $_.FullName.EndsWith('/') })
    if ($entries.Count -ne $files.Count) { return $false }
    $roots = @($entries | ForEach-Object { $_.FullName.Split('/')[0] } | Sort-Object -Unique)
    $prefix = if ($roots.Count -eq 1 -and $entries[0].FullName.Contains('/')) { $roots[0] + '/' } else { '' }
    $map = @{}
    foreach ($entry in $entries) {
      $relative = $entry.FullName.Substring($prefix.Length)
      if ($map.ContainsKey($relative)) { return $false }
      $map[$relative] = $entry
    }
    foreach ($file in $files) {
      $relative = [IO.Path]::GetRelativePath($folder, $file.FullName).Replace('\','/')
      if (-not $map.ContainsKey($relative)) { return $false }
      $stream = $map[$relative].Open()
      try { $zipHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($stream)) } finally { $stream.Dispose() }
      if ($zipHash -ne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { return $false }
    }
    return $true
  } finally { $zip.Dispose() }
}

Get-ChildItem -LiteralPath $desktopRoot -File | Where-Object Name -Match '^LuxeInfra-(Preview|Redesign|Refined|Review|Welcome|Sales|Launch)-.*\.zip$' | ForEach-Object {
  Archive-File $_ (Join-Path $versionsRoot $_.Name)
}
foreach ($sourceRoot in @($desktopRoot, $workRoot)) {
  $historyFolders = @(Get-ChildItem -LiteralPath $sourceRoot -Directory | Where-Object Name -Match '^luxeinfra-(preview|redesign|refined|review|welcome|sales|launch)-(v\d+|\d{8})$')
  foreach ($folder in $historyFolders) {
    if ((Test-Path -LiteralPath (Join-Path $folder.FullName '.private')) -or (Test-Path -LiteralPath (Join-Path $folder.FullName '.env.local'))) {
      $summary.privateFoldersUntouched++
      continue
    }
    $zipName = 'LuxeInfra-' + $folder.Name.Substring('luxeinfra-'.Length) + '.zip'
    $zipFile = Join-Path $versionsRoot $zipName
    $checkedSource = Assert-InRoot $folder.FullName $sourceRoot
    if (Matches-Archive $checkedSource $zipFile) {
      # Exact file count and every source/ZIP-entry hash matched before removal.
      Remove-Item -LiteralPath $checkedSource -Recurse -Force
      $summary.verifiedSourceFoldersRemoved++
    } else {
      $label = if ($sourceRoot -eq $desktopRoot) { 'desktop-' } else { 'workspace-' }
      Archive-Directory $checkedSource (Join-Path $archiveRoot ('source-history/' + $label + $folder.Name)) $sourceRoot
      $summary.unmatchedSourcesPreserved++
    }
  }
}

if (Test-Path -LiteralPath (Join-Path $desktopRoot 'infra-luxe-visions-main.zip')) {
  Archive-File (Get-Item -LiteralPath (Join-Path $desktopRoot 'infra-luxe-visions-main.zip')) (Join-Path $archiveRoot 'original/infra-luxe-visions-main.zip')
}
if (Test-Path -LiteralPath (Join-Path $desktopRoot 'infra-luxe-visions-main')) {
  Archive-Directory (Join-Path $desktopRoot 'infra-luxe-visions-main') (Join-Path $archiveRoot 'original/source') $desktopRoot
}
foreach ($folder in @(Get-ChildItem -LiteralPath $desktopRoot -Directory | Where-Object Name -Match '^(review-evidence-v\d+|ui-audit-.*|blueprints|research)$')) {
  Archive-Directory $folder.FullName (Join-Path $archiveRoot ('evidence/' + $folder.Name)) $desktopRoot
}
foreach ($file in @(Get-ChildItem -LiteralPath $desktopRoot -File | Where-Object { $_.Extension -in @('.md','.jpg','.png') -and $_.Name -notin @('README.md','workdone.md') })) {
  $group = if ($file.Extension -eq '.md') { 'notes/' } else { 'evidence/' }
  Archive-File $file (Join-Path $archiveRoot ($group + $file.Name))
}
$desktopLog = Join-Path $desktopRoot 'workdone.md'
if (Test-Path -LiteralPath $desktopLog) {
  $oldLog = (Get-Content -LiteralPath $desktopLog -Raw).TrimEnd()
  $activeLog = Get-Content -LiteralPath (Join-Path $projectRoot 'workdone.md') -Raw
  if ($activeLog.StartsWith($oldLog, [StringComparison]::Ordinal)) {
    Remove-Item -LiteralPath $desktopLog
    $summary.duplicateFilesRemoved++
  } else { Archive-File (Get-Item -LiteralPath $desktopLog) (Join-Path $archiveRoot 'notes/previous-desktop-worklog.md') }
}
foreach ($file in @(Get-ChildItem -LiteralPath $projectRoot -File | Where-Object { $_.Extension -eq '.md' -and $_.Name -notin @('README.md','workdone.md','AGENTS.md') })) {
  Archive-File $file (Join-Path $archiveRoot ('notes/' + $file.Name))
}
if (Test-Path -LiteralPath (Join-Path $projectRoot 'owner-inputs')) {
  Archive-Directory (Join-Path $projectRoot 'owner-inputs') (Join-Path $archiveRoot 'notes/previous-owner-inputs') $projectRoot
}
if (Test-Path -LiteralPath (Join-Path $projectRoot 'outputs')) {
  Archive-Directory (Join-Path $projectRoot 'outputs') (Join-Path $archiveRoot 'evidence/working-project') $projectRoot
}
foreach ($file in @(Get-ChildItem -LiteralPath $projectRoot -File -Filter '*.log')) {
  Archive-File $file (Join-Path $archiveRoot ('evidence/' + $file.Name))
}
foreach ($file in @(Get-ChildItem -LiteralPath $workRoot -File | Where-Object Name -Match '^(Save-LuxeInfra-V\d+\.ps1|verify-live-v\d+\.mjs|delivery-demo-v\d+\.mjs)$')) {
  Archive-File $file (Join-Path $archiveRoot ('tools/' + $file.Name))
}
# Preserve template/generator metadata in the archive. Do not delete caches or private data.
if (Test-Path -LiteralPath (Join-Path $projectRoot '.lovable')) {
  Archive-Directory (Join-Path $projectRoot '.lovable') (Join-Path $archiveRoot 'tools/original-template-metadata') $projectRoot
}
if (Test-Path -LiteralPath (Join-Path $projectRoot 'components.json')) {
  Archive-File (Get-Item -LiteralPath (Join-Path $projectRoot 'components.json')) (Join-Path $archiveRoot 'tools/components.json')
}

$website = Assert-InRoot (Join-Path $desktopRoot 'website') $desktopRoot
if (-not (Test-Path -LiteralPath $website)) { New-Item -ItemType Junction -Path $website -Target $projectRoot | Out-Null }
elseif ((Get-Item -LiteralPath $website -Force).Target -ne $projectRoot) { throw 'The existing website entry points somewhere else; it was preserved.' }
@'
# LuxeInfra

- Open **website** for the single active project and its workdone.md.
- Run **Start website.cmd**, then browse http://127.0.0.1:3000 yourself.
- Put your Gemini key only in **website/.env.local**, after GEMINI_API_KEY=. Instructions: website/docs/AI-SETUP.md.
- **Archive** holds the original download, earlier verified ZIPs, old notes and review evidence. No new numbered preview packages will be made unless requested.

The website folder links to the working project in Documents/Codex. It is one local source folder, not a second copy or a cloud backup. Private credentials/data remain in the active project and were not archived.
'@ | Set-Content -LiteralPath (Join-Path $desktopRoot 'README.md') -Encoding utf8
@'
@echo off
call "%~dp0website\Start-website.cmd"
'@ | Set-Content -LiteralPath (Join-Path $desktopRoot 'Start website.cmd') -Encoding ascii
$summary | ConvertTo-Json
