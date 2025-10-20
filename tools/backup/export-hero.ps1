Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-MagickPath {
  $cmd = Get-Command magick -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    'C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.2-Q16\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe'
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  throw 'ImageMagick not found. Ensure magick.exe is in PATH or installed in Program Files.'
}

$magick = Get-MagickPath
$projRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$src = Join-Path $projRoot 'assets/img/hero-bg.svg'
$outDir = Join-Path $projRoot 'assets/img'
if (!(Test-Path $src)) { throw "Source SVG not found: $src" }

# width x height list (filename suffixes)
$targets = @(
  @{w=768; h=1024; name='hero-bg-768x1024'},
  @{w=1280; h=800; name='hero-bg-1280x800'},
  @{w=1920; h=1080; name='hero-bg-1920x1080'},
  @{w=2560; h=1440; name='hero-bg-2560x1440'}
)

foreach ($t in $targets) {
  $w=$t.w; $h=$t.h; $base=$t.name
  $png = Join-Path $outDir ("$base.png")
  $webp = Join-Path $outDir ("$base.webp")
  $avif = Join-Path $outDir ("$base.avif")

  # Cover-fit crop: keep center, fill and crop as needed
  & $magick $src -strip -resize ${w}x${h}^ -gravity center -extent ${w}x${h} $png
  & $magick $png -strip -quality 78 $webp
  # AVIF tuning: quality around 38~45 is usually good, speed 6 for balance
  & $magick $png -strip -quality 42 -define heic:speed=6 -define heic:chroma-subsampling=4:2:0 $avif

  Write-Host "Wrote: $png, $webp, $avif"
}

Write-Host 'Done.'

