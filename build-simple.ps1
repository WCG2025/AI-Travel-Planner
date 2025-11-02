# 简化的 Docker 构建脚本

Write-Host "构建 Docker 镜像..." -ForegroundColor Green

# 从 .env.local 读取变量
$content = Get-Content ".env.local" -Raw
$lines = $content -split "`n"

$supabaseUrl = ""
$supabaseKey = ""
$xfyunAppId = ""
$xfyunApiKey = ""
$xfyunSecret = ""
$amapKey = ""
$amapSecret = ""

foreach ($line in $lines) {
    if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.+)") {
        $supabaseUrl = $matches[1].Trim()
    }
    elseif ($line -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)") {
        $supabaseKey = $matches[1].Trim()
    }
    elseif ($line -match "NEXT_PUBLIC_XFYUN_APP_ID=(.+)") {
        $xfyunAppId = $matches[1].Trim()
    }
    elseif ($line -match "NEXT_PUBLIC_XFYUN_API_KEY=(.+)") {
        $xfyunApiKey = $matches[1].Trim()
    }
    elseif ($line -match "NEXT_PUBLIC_XFYUN_API_SECRET=(.+)") {
        $xfyunSecret = $matches[1].Trim()
    }
    elseif ($line -match "NEXT_PUBLIC_AMAP_KEY=(.+)") {
        $amapKey = $matches[1].Trim()
    }
    elseif ($line -match "NEXT_PUBLIC_AMAP_SECRET=(.+)") {
        $amapSecret = $matches[1].Trim()
    }
}

Write-Host "Supabase URL: $($supabaseUrl.Substring(0, 30))..."
Write-Host "Supabase Key Length: $($supabaseKey.Length)"
Write-Host "开始构建..."

docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$supabaseUrl" `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabaseKey" `
  --build-arg NEXT_PUBLIC_XFYUN_APP_ID="$xfyunAppId" `
  --build-arg NEXT_PUBLIC_XFYUN_API_KEY="$xfyunApiKey" `
  --build-arg NEXT_PUBLIC_XFYUN_API_SECRET="$xfyunSecret" `
  --build-arg NEXT_PUBLIC_AMAP_KEY="$amapKey" `
  --build-arg NEXT_PUBLIC_AMAP_SECRET="$amapSecret" `
  -t ai-travel-planner:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功！" -ForegroundColor Green
} else {
    Write-Host "构建失败！" -ForegroundColor Red
}
