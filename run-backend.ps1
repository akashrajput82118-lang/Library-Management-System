param(
    [string]$DbUrl = "jdbc:mysql://localhost:3306/LIBRARY_MANAGEMENT?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
    [string]$DbUsername = "root"
)

$ErrorActionPreference = "Stop"

# ---- Find a usable JDK ------------------------------------------------
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    $jdk = Get-ChildItem "C:\Program Files\Java" -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.FullName "bin\java.exe") } |
        Sort-Object Name -Descending |
        Select-Object -First 1

    if ($jdk) {
        $env:JAVA_HOME = $jdk.FullName
        Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
    }
}

# ---- Find Maven (PATH first, then IntelliJ's bundled Maven) ----------
$mvn = $null
$mvnCommand = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($mvnCommand) {
    $mvn = $mvnCommand.Source
}
if (-not $mvn) {
    $mvn = Get-ChildItem "C:\Program Files\JetBrains" -Recurse -Filter "mvn.cmd" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}
if (-not $mvn) {
    throw "Maven was not found. Install Maven or run the project from IntelliJ IDEA."
}

# ---- Database password (prompted; never stored in source) -------------
if (-not $env:DB_PASSWORD) {
    $secure = Read-Host "MySQL password for user '$DbUsername'" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

$env:DB_URL = $DbUrl
$env:DB_USERNAME = $DbUsername

# ---- JWT secret -------------------------------------------------------
if (-not $env:JWT_SECRET) {
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    }
    finally {
        $rng.Dispose()
    }
    $env:JWT_SECRET = [Convert]::ToBase64String($bytes)
    Write-Host "Generated a temporary JWT secret for this run. Logins will reset when the backend restarts."
    Write-Host "For stable logins set a permanent JWT_SECRET (32+ characters) before running."
}

Write-Host ""
$port = if ($env:SERVER_PORT) { $env:SERVER_PORT } else { "8080" }
Write-Host "Starting Spring Boot on port $port..."
Write-Host "Frontend should run separately with: cd frontend; npm run dev"
Write-Host ""

& $mvn spring-boot:run
