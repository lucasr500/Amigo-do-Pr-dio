/**
 * Gera os assets PWA/iOS a partir do logo oficial.
 *
 * Entrada: public/brand/logo-oficial.png
 * Saida:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/apple-touch-icon.png
 *   app/favicon.ico
 *
 * Mantem fundo navy, simbolo legivel e safe area para iOS/Android.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const source = path.join(root, "public", "brand", "logo-oficial.png");

if (!fs.existsSync(source)) {
  throw new Error("Logo oficial nao encontrado em public/brand/logo-oficial.png");
}

const ps = String.raw`
$ErrorActionPreference = 'Stop'
$src = '__SOURCE__'
$root = '__ROOT__'
$iconDir = Join-Path $root 'public\icons'
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null
Add-Type -AssemblyName System.Drawing

function Save-IconPng($size, $dest) {
  $source = [System.Drawing.Image]::FromFile($src)
  try {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#234B63'))
      $safe = [Math]::Round($size * 0.075)
      $drawSize = $size - ($safe * 2)
      $rect = New-Object System.Drawing.Rectangle $safe, $safe, $drawSize, $drawSize
      $g.DrawImage($source, $rect)
      $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $g.Dispose()
      $bmp.Dispose()
    }
  } finally {
    $source.Dispose()
  }
}

Save-IconPng 180 (Join-Path $iconDir 'apple-touch-icon.png')
Save-IconPng 192 (Join-Path $iconDir 'icon-192.png')
Save-IconPng 512 (Join-Path $iconDir 'icon-512.png')
Save-IconPng 64  (Join-Path $iconDir 'favicon-source.png')

$pngPath = Join-Path $iconDir 'favicon-source.png'
$png = [System.IO.File]::ReadAllBytes($pngPath)
$header = [byte[]](0,0,1,0,1,0)
$dir = New-Object byte[] 16
$dir[0] = 64; $dir[1] = 64; $dir[2] = 0; $dir[3] = 0
[BitConverter]::GetBytes([UInt16]1).CopyTo($dir,4)
[BitConverter]::GetBytes([UInt16]32).CopyTo($dir,6)
[BitConverter]::GetBytes([UInt32]$png.Length).CopyTo($dir,8)
[BitConverter]::GetBytes([UInt32]22).CopyTo($dir,12)
[System.IO.File]::WriteAllBytes((Join-Path $root 'app\favicon.ico'), [byte[]]($header + $dir + $png))
Remove-Item -LiteralPath $pngPath
`;

const script = ps
  .replace("__SOURCE__", source.replace(/'/g, "''"))
  .replace("__ROOT__", root.replace(/'/g, "''"));

execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
  stdio: "inherit",
});

console.log("Icones PWA/iOS gerados a partir do logo oficial.");
