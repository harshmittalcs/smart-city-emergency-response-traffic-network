@echo off
echo ========================================================
echo   Compiling Smart City Project (C++17 + Winsock)
echo ========================================================
g++ -std=c++17 *.cpp -o pbl_smart.exe -lws2_32
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compilation failed!
    echo Please make sure g++ (MinGW) is installed and added to PATH.
    echo.
    pause
    exit /b %errorlevel%
)
echo.
echo [SUCCESS] Compilation complete!
echo Launching Web Mode...
start http://localhost:8080/
pbl_smart.exe --web
pause
