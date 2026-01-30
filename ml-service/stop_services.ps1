# Stop All ML Services

Write-Host "Stopping all ML services..." -ForegroundColor Yellow

# Find and stop all Python processes
$processes = Get-Process | Where-Object {$_.ProcessName -eq "python"}

if ($processes) {
    Write-Host "Found $($processes.Count) Python process(es)" -ForegroundColor Cyan
    $processes | ForEach-Object {
        Write-Host "  Stopping PID $($_.Id) - $($_.Path)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "✓ All services stopped" -ForegroundColor Green
} else {
    Write-Host "No Python processes running" -ForegroundColor Yellow
}
