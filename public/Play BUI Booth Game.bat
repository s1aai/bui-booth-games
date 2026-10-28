@echo off
rem Opens the game full-screen in its own browser window. Press Alt+F4 to close it.
rem Uses Google Chrome in kiosk mode if it's installed. Otherwise Microsoft Edge (built into Windows) as a
rem full-screen app window: Edge's own kiosk mode is always InPrivate, which would wipe the scores on close.
rem   --user-data-dir         own profile: works even with the browser already open, and scores stay separate
rem   --disable-pinch         no pinch-zoom on touchscreens
rem   --overscroll-history-navigation=0   a sideways swipe never navigates back or forward
rem   --hide-crash-restore-bubble          no "Restore pages?" pop-up after a power cut
set "GAME=%~dp0index.html"
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER goto launch_edge
rem Neither found in the usual places: hope Chrome is on the PATH.
set "BROWSER=chrome"

:launch
start "" "%BROWSER%" --kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --hide-crash-restore-bubble --user-data-dir="%LOCALAPPDATA%\BUIBoothGames" "%GAME%"
goto :eof

:launch_edge
start "" "%BROWSER%" --start-fullscreen --app="%GAME%" --no-first-run --disable-pinch --overscroll-history-navigation=0 --hide-crash-restore-bubble --user-data-dir="%LOCALAPPDATA%\BUIBoothGamesEdge"
