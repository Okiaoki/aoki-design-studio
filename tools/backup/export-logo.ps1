Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve magick.exe (PATH or default install dir)
function Get-MagickPath {
  $cmd = Get-Command magick -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    'C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.2-Q16\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.0-Q16-HDRI\\magick.exe'
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  throw 'ImageMagick not found. Ensure magick.exe is in PATH or installed in Program Files.'
}

$magick = Get-MagickPath

# Paths
$projRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$src = Join-Path $projRoot 'assets/img/logo.svg'
$outDir = Join-Path $projRoot 'assets/img'
if (!(Test-Path $src)) { throw "Source SVG not found: $src" }

$sizes = @(256, 512)
foreach ($s in $sizes) {
  $png = Join-Path $outDir ("logo-$s.png")
  $webp = Join-Path $outDir ("logo-$s.webp")

  & $magick $src -background none -resize ${s}x${s} $png
  & $magick $src -background none -resize ${s}x${s} -quality 90 $webp
  Write-Host "Wrote: $png"
  Write-Host "Wrote: $webp"
}

Write-Host 'Done.'
