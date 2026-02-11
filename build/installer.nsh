; Custom NSIS installer script for VoxGen
; Kills any running VoxGen instance before install/uninstall to prevent:
;   - File locks on native .node modules (uiohook-napi, nut-js)
;   - Single-instance lock preventing new version from launching
;   - Corrupted DLL overwrites

!macro customInit
  ; Try to gracefully close VoxGen first, then force-kill if still running
  nsExec::ExecToLog 'taskkill /im "VoxGen.exe"'
  ; Brief pause to allow process to exit cleanly
  Sleep 1000
  ; Force-kill if still hanging (e.g., stuck on IPC or native module cleanup)
  nsExec::ExecToLog 'taskkill /f /im "VoxGen.exe"'
  Sleep 500
!macroend

!macro customUnInit
  ; Also kill before uninstall to release file locks
  nsExec::ExecToLog 'taskkill /im "VoxGen.exe"'
  Sleep 1000
  nsExec::ExecToLog 'taskkill /f /im "VoxGen.exe"'
  Sleep 500
!macroend
