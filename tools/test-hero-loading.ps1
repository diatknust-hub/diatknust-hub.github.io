$ErrorActionPreference = 'Stop'

$indexPath = Join-Path $PSScriptRoot '..\index.html'
$stylesPath = Join-Path $PSScriptRoot '..\diat-styles.css'
$html = Get-Content -Raw $indexPath
$css = Get-Content -Raw $stylesPath

$covers = [regex]::Matches($html, '<picture class="slide-cover"[\s\S]*?</picture>')
if ($covers.Count -ne 8) { throw "Expected 8 hero covers; found $($covers.Count)." }

$eager = [regex]::Matches($covers[0].Value, '<img[^>]+src="https://res.cloudinary.com/diatknust/')
if ($eager.Count -ne 1) { throw 'The initial hero image must be immediately discoverable.' }
if ($covers[0].Value -notmatch 'fetchpriority="high"') { throw 'The initial hero image must have high fetch priority.' }
if ($covers[0].Value -notmatch 'media="\(max-width: 768px\)"') { throw 'The initial hero image must have a mobile source.' }

foreach ($cover in $covers[1..7]) {
  if ($cover.Value -match '<img[^>]+\ssrc=') { throw 'A non-initial hero image is still eagerly requested.' }
  if ($cover.Value -notmatch 'data-src=') { throw 'A non-initial hero image is missing its deferred source.' }
  if ($cover.Value -notmatch 'data-srcset=') { throw 'A non-initial hero image is missing its deferred mobile source.' }
}

if ($html -notmatch 'function loadCover\(idx, done\)') { throw 'The carousel does not load a deferred cover before activation.' }
if ($css -notmatch '\.slide-cover img') { throw 'The responsive hero image is not styled to cover the slide.' }
if ($html -match '<script src="https://www\.gstatic\.com/firebasejs/') { throw 'Firebase must not be loaded during the initial page request.' }
if ($html -notmatch 'function loadFirebase\(\)') { throw 'The newsletter form is missing deferred Firebase loading.' }
if ($html -notmatch 'script\.integrity = integrity') { throw 'Deferred Firebase loading must retain subresource integrity.' }

Write-Output 'Homepage performance checks passed.'
