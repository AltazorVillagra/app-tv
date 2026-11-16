param([string]$Destino, [string]$Prefijo = 'icono', [ValidateSet('degradado','oscuro')][string]$Variante = 'degradado')
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Destino | Out-Null

function C([int]$r,[int]$g,[int]$b,[int]$a=255) { [System.Drawing.Color]::FromArgb($a,$r,$g,$b) }
function P([double]$x,[double]$y) { New-Object System.Drawing.PointF ([single]$x), ([single]$y) }

# Desplaza un poligono convexo hacia adentro (para el trazo "hueco")
function Inset($pts, [double]$d) {
  $n = $pts.Count; $cx = 0; $cy = 0
  foreach ($p in $pts) { $cx += $p.X; $cy += $p.Y }; $cx /= $n; $cy /= $n
  $lines = @()
  for ($i=0; $i -lt $n; $i++) {
    $a = $pts[$i]; $b = $pts[($i+1) % $n]
    $dx = $b.X - $a.X; $dy = $b.Y - $a.Y; $len = [Math]::Sqrt($dx*$dx + $dy*$dy)
    $nx = -$dy/$len; $ny = $dx/$len
    $mx = ($a.X+$b.X)/2; $my = ($a.Y+$b.Y)/2
    if ((($cx-$mx)*$nx + ($cy-$my)*$ny) -lt 0) { $nx = -$nx; $ny = -$ny }
    $lines += ,@(($a.X + $nx*$d), ($a.Y + $ny*$d), $dx, $dy)
  }
  $out = @()
  for ($i=0; $i -lt $n; $i++) {
    $l1 = $lines[($i-1+$n) % $n]; $l2 = $lines[$i]
    $den = $l1[2]*$l2[3] - $l1[3]*$l2[2]
    $t = (($l2[0]-$l1[0])*$l2[3] - ($l2[1]-$l1[1])*$l2[2]) / $den
    $out += P ($l1[0] + $t*$l1[2]) ($l1[1] + $t*$l1[3])
  }
  return [System.Drawing.PointF[]]$out
}

function Dibujar([int]$n, [string]$ruta, [double]$k = 1) {
  $bmp = New-Object System.Drawing.Bitmap $n, $n
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.PixelOffsetMode = 'HighQuality'
  $s = $n / 512.0
  $full = New-Object System.Drawing.Rectangle 0, 0, $n, $n

  # ---------- Fondo ----------
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $full, (C 0 0 0), (C 0 0 0), 45
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend 3
  if ($Variante -eq 'degradado') {
    $blend.Colors = @((C 255 94 58), (C 236 38 110), (C 92 33 208))
  } else {
    $blend.Colors = @((C 34 12 74), (C 22 9 52), (C 10 6 28))
  }
  $blend.Positions = @([single]0, [single]0.5, [single]1)
  $bg.InterpolationColors = $blend
  $g.FillRectangle($bg, $full)

  # Brillo suave
  $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glowPath.AddEllipse([single](-140*$s), [single](-240*$s), [single](792*$s), [single](560*$s))
  $glow = New-Object System.Drawing.Drawing2D.PathGradientBrush $glowPath
  $glow.CenterColor = $(if ($Variante -eq 'degradado') { C 255 255 255 60 } else { C 150 80 255 70 })
  $glow.SurroundColors = @((C 255 255 255 0))
  $g.FillPath($glow, $glowPath)

  $g.ScaleTransform([single]$s, [single]$s)   # desde aqui todo en coordenadas de 512
  if ($k -lt 1) {
    $g.TranslateTransform([single](512*(1-$k)/2), [single](512*(1-$k)/2))
    $g.ScaleTransform([single]$k, [single]$k)
  }

  # ---------- La "A" grande ----------
  # Pierna derecha: hueca (borde blanco + relleno de color), como la X de referencia
  $der = [System.Drawing.PointF[]]@((P 236 52), (P 290 52), (P 386 292), (P 332 292))
  $g.FillPolygon([System.Drawing.Brushes]::White, $der)
  $dentro = Inset $der 9
  $rect = New-Object System.Drawing.RectangleF ([single]236), ([single]52), ([single]150), ([single]240)
  $relleno = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (C 0 0 0), (C 0 0 0), ([single]90)
  $b2 = New-Object System.Drawing.Drawing2D.ColorBlend 3
  if ($Variante -eq 'degradado') {
    $b2.Colors = @((C 40 10 90), (C 70 20 150), (C 150 90 255))
  } else {
    $b2.Colors = @((C 18 8 44), (C 120 40 220), (C 236 38 110))
  }
  $b2.Positions = @([single]0, [single]0.55, [single]1)
  $relleno.InterpolationColors = $b2
  $g.FillPolygon($relleno, $dentro)

  # Pierna izquierda: solida, pasa por encima en la punta
  $izq = [System.Drawing.PointF[]]@((P 232 52), (P 290 52), (P 186 292), (P 126 292))
  $sombra = New-Object System.Drawing.SolidBrush (C 20 0 50 70)
  $g.TranslateTransform([single]4, [single]5)
  $g.FillPolygon($sombra, $izq)
  $g.TranslateTransform([single]-4, [single]-5)
  $g.FillPolygon([System.Drawing.Brushes]::White, $izq)

  # Boton "play" en el hueco de la A
  $playBrush = New-Object System.Drawing.SolidBrush $(if ($Variante -eq 'degradado') { C 255 255 255 } else { C 255 120 170 })
  $tri = [System.Drawing.PointF[]]@((P 246 196), (P 246 252), (P 288 224))
  $g.FillPolygon($playBrush, $tri)

  # ---------- ALTAZOR ----------
  $font = New-Object System.Drawing.Font 'Bahnschrift SemiBold', ([single]74), ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  $estado = $g.Save()
  $g.TranslateTransform([single]256, [single]350)
  $g.ScaleTransform([single]1.28, [single]1)          # letras anchas
  $txtSombra = New-Object System.Drawing.SolidBrush (C 20 0 50 80)
  $g.DrawString('ALTAZOR', $font, $txtSombra, (New-Object System.Drawing.RectangleF ([single]-200), ([single]-41), ([single]400), ([single]90)), $sf)
  $g.DrawString('ALTAZOR', $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF ([single]-200), ([single]-45), ([single]400), ([single]90)), $sf)
  $g.Restore($estado)

  # ---------- —— TV —— ----------
  $acento = $(if ($Variante -eq 'degradado') { C 255 255 255 } else { C 255 110 170 })
  $linea = New-Object System.Drawing.Pen $acento, ([single]5)
  $linea.StartCap = 'Round'; $linea.EndCap = 'Round'
  $g.DrawLine($linea, [single]118, [single]428, [single]206, [single]428)
  $g.DrawLine($linea, [single]306, [single]428, [single]394, [single]428)
  $fTv = New-Object System.Drawing.Font 'Bahnschrift SemiBold', ([single]50), ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $estado = $g.Save()
  $g.TranslateTransform([single]256, [single]430)
  $g.ScaleTransform([single]1.25, [single]1)
  $g.DrawString('TV', $fTv, (New-Object System.Drawing.SolidBrush $acento), (New-Object System.Drawing.RectangleF ([single]-60), ([single]-30), ([single]120), ([single]60)), $sf)
  $g.Restore($estado)

  $bmp.Save($ruta, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Dibujar 192 (Join-Path $Destino "$Prefijo-192.png")
Dibujar 512 (Join-Path $Destino "$Prefijo-512.png")
Dibujar 512 (Join-Path $Destino "$Prefijo-maskable-512.png") 0.8
Get-ChildItem $Destino -Filter "$Prefijo*" | Select-Object Name, Length
