# PowerShell 脚本：构建 Docker 镜像（包含环境变量）

Write-Host "🐳 开始构建 AI Travel Planner Docker 镜像..." -ForegroundColor Cyan
Write-Host ""

# 检查 .env.local 文件是否存在
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ 错误：找不到 .env.local 文件" -ForegroundColor Red
    Write-Host "请确保 .env.local 文件存在并包含所有必需的环境变量" -ForegroundColor Yellow
    exit 1
}

# 读取环境变量
Write-Host "📖 读取环境变量..." -ForegroundColor Green

$envVars = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# 验证必需的环境变量
$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
    "NEXT_PUBLIC_XFYUN_APP_ID",
    "NEXT_PUBLIC_XFYUN_API_KEY",
    "NEXT_PUBLIC_XFYUN_API_SECRET",
    "NEXT_PUBLIC_AMAP_KEY"
)

$missing = @()
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrEmpty($envVars[$var])) {
        $missing += $var
    } else {
        Write-Host "  ✅ $var" -ForegroundColor Green
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ 缺少以下环境变量:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "请在 .env.local 文件中配置这些变量" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🏗️ 开始构建镜像..." -ForegroundColor Cyan

# 构建 Docker 命令
$buildArgs = @()
foreach ($var in $requiredVars) {
    $buildArgs += "--build-arg"
    $buildArgs += "$var=$($envVars[$var])"
}

# 可选的环境变量
$optionalVars = @("NEXT_PUBLIC_AMAP_SECRET")
foreach ($var in $optionalVars) {
    if ($envVars.ContainsKey($var) -and -not [string]::IsNullOrEmpty($envVars[$var])) {
        $buildArgs += "--build-arg"
        $buildArgs += "$var=$($envVars[$var])"
        Write-Host "  ✅ $var (可选)" -ForegroundColor Green
    }
}

# 执行构建
$buildCmd = @("docker", "build") + $buildArgs + @("-t", "ai-travel-planner:latest", ".")

Write-Host ""
Write-Host "执行命令:" -ForegroundColor Yellow
Write-Host ($buildCmd -join " ") -ForegroundColor Gray
Write-Host ""

try {
    & $buildCmd[0] $buildCmd[1..($buildCmd.Length-1)]
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 构建成功！" -ForegroundColor Green
        Write-Host ""
        
        # 显示镜像信息
        Write-Host "📊 镜像信息:" -ForegroundColor Cyan
        docker images | Select-String "ai-travel-planner"
        
        Write-Host ""
        Write-Host "🚀 运行命令:" -ForegroundColor Cyan
        Write-Host "docker run -d --name ai-travel-planner -p 3000:3000 \" -ForegroundColor Gray
        Write-Host "  -e DEEPSEEK_API_KEY=`"$($envVars['DEEPSEEK_API_KEY'])`" \" -ForegroundColor Gray
        Write-Host "  -e AMAP_WEB_SERVICE_KEY=`"$($envVars['AMAP_WEB_SERVICE_KEY'])`" \" -ForegroundColor Gray
        Write-Host "  ai-travel-planner:latest" -ForegroundColor Gray
        
    } else {
        Write-Host ""
        Write-Host "❌ 构建失败！退出代码: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "构建过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
