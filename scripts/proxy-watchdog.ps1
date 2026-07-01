# Proxy Watchdog — check and restart VEEE / Clash if ports are dead
$log = "$env:USERPROFILE\proxy-watchdog.log"

function Test-Port($port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Restart-App($procName, $exePath, $label) {
    $running = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($running) { $running | Stop-Process -Force; Start-Sleep 2 }
    if (Test-Path $exePath) {
        Start-Process $exePath -WindowStyle Hidden
        "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$label] Restarted" | Out-File $log -Append
    }
}

# Clash: HTTP proxy on 7897
if (-not (Test-Port 7897)) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [Clash] Port 7897 down — restarting..." | Out-File $log -Append
    Restart-App "clash-verge" "C:\Program Files\Clash Verge\clash-verge.exe" "Clash"
}

# VEEE: just check port is listening (not HTTP)
if (-not (Test-Port 15236)) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [VEEE] Port 15236 down — restarting..." | Out-File $log -Append
    Restart-App "Veee" "C:\Users\Administrator\AppData\Local\Programs\Veee\Veee.exe" "VEEE"
}
