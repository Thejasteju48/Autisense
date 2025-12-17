Write-Host 'Installing Backend Dependencies...' -ForegroundColor Yellow
cd d:\AutismProject\backend
npm install

Write-Host 'Installing ML Service Dependencies...' -ForegroundColor Yellow
cd d:\AutismProject\ml-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

Write-Host 'Installing Frontend Dependencies...' -ForegroundColor Yellow
cd d:\AutismProject\frontend
npm install

Write-Host 'Setup Complete!' -ForegroundColor Green
Write-Host 'Next: Read QUICKSTART_INTERACTIVE.md for instructions'
