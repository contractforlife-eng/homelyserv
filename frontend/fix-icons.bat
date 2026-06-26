@echo off
echo Fixing icon imports in all files...

cd src/pages

echo Fixing WorkerProfile.jsx...
powershell -Command "(Get-Content WorkerProfile.jsx) -replace 'BookmarkCheck,', '' | Set-Content WorkerProfile.jsx"
powershell -Command "(Get-Content WorkerProfile.jsx) -replace 'BookmarkCheck', 'Bookmark' | Set-Content WorkerProfile.jsx"

echo Fixing Search.jsx...
powershell -Command "(Get-Content Search.jsx) -replace 'BookmarkCheck,', '' | Set-Content Search.jsx"
powershell -Command "(Get-Content Search.jsx) -replace 'BookmarkCheck', 'Bookmark' | Set-Content Search.jsx"

echo Fixing MyHires.jsx...
powershell -Command "(Get-Content MyHires.jsx) -replace 'BookmarkCheck,', '' | Set-Content MyHires.jsx"
powershell -Command "(Get-Content MyHires.jsx) -replace 'BookmarkCheck', 'Bookmark' | Set-Content MyHires.jsx"

echo Fixing WorkerView.jsx...
powershell -Command "(Get-Content WorkerView.jsx) -replace 'BookmarkCheck,', '' | Set-Content WorkerView.jsx"
powershell -Command "(Get-Content WorkerView.jsx) -replace 'BookmarkCheck', 'Bookmark' | Set-Content WorkerView.jsx"

echo Fixing EmployerView.jsx...
powershell -Command "(Get-Content EmployerView.jsx) -replace 'BookmarkCheck,', '' | Set-Content EmployerView.jsx"
powershell -Command "(Get-Content EmployerView.jsx) -replace 'BookmarkCheck', 'Bookmark' | Set-Content EmployerView.jsx"

echo Done! Now run: npm run build
pause