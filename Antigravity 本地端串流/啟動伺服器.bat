@echo off
echo ========================================
echo   本地端 HLS 串流伺服器
echo ========================================
echo.
echo 正在啟動伺服器...
echo 請在瀏覽器開啟: http://localhost:8000
echo.
echo 按 Ctrl+C 可停止伺服器
echo ========================================
echo.

python -m http.server 8000
