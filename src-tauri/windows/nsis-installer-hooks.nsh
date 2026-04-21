!macro NSIS_HOOK_POSTINSTALL
  SetShellVarContext all
  CreateShortCut "$DESKTOP\BatchRename.lnk" "$INSTDIR\BatchRename.exe"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  SetShellVarContext all
  Delete "$DESKTOP\BatchRename.lnk"
!macroend
