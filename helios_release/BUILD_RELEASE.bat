@echo off
setlocal EnableDelayedExpansion
title Helios Theme Generator — Release Builder
color 0A

echo.
echo  ================================================================
echo   Helios II QSS Theme Generator — Release Builder
echo  ================================================================
echo.

:: ── Step 1: Find Python ───────────────────────────────────────────────────
echo  [1/5]  Locating Python...

set PYTHON=
for %%P in (python python3 py) do (
    if not defined PYTHON (
        %%P --version >nul 2>&1 && set "PYTHON=%%P"
    )
)

if not defined PYTHON (
    echo.
    echo  [ERROR] Python not found.
    echo  Install from https://www.python.org — tick "Add Python to PATH"
    echo.
    pause & exit /b 1
)

for /f "tokens=*" %%V in ('%PYTHON% --version 2^>^&1') do set PYVER=%%V
echo  [OK] Found: %PYVER%
echo.

:: ── Step 2: Install dependencies silently ────────────────────────────────
echo  [2/5]  Installing PyQt5 and PyInstaller...

%PYTHON% -m pip install --upgrade pip -q
%PYTHON% -m pip install PyQt5 pyinstaller --upgrade -q

if errorlevel 1 (
    echo  [ERROR] Dependency install failed. Check internet connection.
    pause & exit /b 1
)
echo  [OK] Dependencies ready
echo.

:: ── Step 3: Clean previous build output ──────────────────────────────────
echo  [3/5]  Cleaning previous build...

if exist "build"                       rmdir /s /q "build"
if exist "dist"                        rmdir /s /q "dist"
if exist "Helios Theme Generator.spec" del /q "Helios Theme Generator.spec"
if exist "Helios_Theme_Generator.zip"  del /q "Helios_Theme_Generator.zip"

echo  [OK] Clean
echo.

:: ── Step 4: Compile with PyInstaller ─────────────────────────────────────
echo  [4/5]  Compiling executable (60-120 seconds)...
echo.

%PYTHON% -m PyInstaller ^
    --noconfirm ^
    --onefile ^
    --windowed ^
    --name "Helios Theme Generator" ^
    --icon "assets\logo\themegen.ico" ^
    --add-data "assets;assets" ^
    --clean ^
    helios_theme_builder.py

echo.

if errorlevel 1 (
    echo  [ERROR] PyInstaller failed. See output above.
    echo.
    echo  Common fixes:
    echo    1. Run as Administrator
    echo    2. Temporarily disable antivirus
    echo    3. Delete build\ and dist\ then retry
    echo.
    pause & exit /b 1
)

if not exist "dist\Helios Theme Generator.exe" (
    echo  [ERROR] EXE not found in dist\ after build.
    pause & exit /b 1
)

echo  [OK] dist\Helios Theme Generator.exe created
echo.

:: ── Step 5: Package the user release ZIP ─────────────────────────────────
echo  [5/5]  Creating user release ZIP...

powershell -NoProfile -NonInteractive -Command ^
    "Compress-Archive -Path 'dist\Helios Theme Generator.exe','INSTALL.txt' ^
     -DestinationPath 'Helios_Theme_Generator.zip' -Force"

if errorlevel 1 (
    echo  [ERROR] ZIP creation failed.
    echo  The compiled exe is at:  dist\Helios Theme Generator.exe
    echo  Manually zip it with INSTALL.txt to distribute.
    pause & exit /b 1
)

if not exist "Helios_Theme_Generator.zip" (
    echo  [ERROR] ZIP file not created.
    pause & exit /b 1
)

:: Cleanup build artefacts
if exist "build"                       rmdir /s /q "build"
if exist "Helios Theme Generator.spec" del /q "Helios Theme Generator.spec"

:: ── Done ─────────────────────────────────────────────────────────────────
echo  [OK] Helios_Theme_Generator.zip created
echo.
echo  ================================================================
echo   BUILD COMPLETE
echo  ================================================================
echo.
echo   Release ZIP:  %CD%\Helios_Theme_Generator.zip
echo.
echo   Contents:
echo     Helios Theme Generator.exe
echo     INSTALL.txt
echo.
echo   Distribute Helios_Theme_Generator.zip to users.
echo   They extract and double-click the .exe. Done.
echo.

explorer "%CD%"
pause
exit /b 0
