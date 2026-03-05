@echo off
setlocal

cd /d "%~dp0"

echo ==== Repo status ====
git status -sb

findstr /x /c:"backups/" .gitignore >nul 2>nul || echo backups/>>.gitignore
findstr /x /c:"node_modules_old/" .gitignore >nul 2>nul || echo node_modules_old/>>.gitignore

git -c advice.addIgnoredFile=false add -A -- . ":(exclude)node_modules_old" ":(exclude)backups"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"') do set TS=%%i

git diff --cached --quiet
if errorlevel 1 (
	git commit -m "chore: update %TS%"
	git push origin main
) else (
	echo No hay cambios para subir.
)

echo ==== Final status ====
git status -sb

endlocal