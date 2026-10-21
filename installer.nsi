; ============================================================================
; installer.nsi — NSIS Windows Setup Wizard for WhatsApp (Rust WebView2)
; Allows the user to choose the installation & data storage directory,
; embeds assets/icon.ico, creates Desktop & Start Menu shortcuts, and uninstaller.
; ============================================================================

!include "MUI2.nsh"

Name "WhatsApp (Rust Lightweight)"
OutFile "dist-release\WhatsApp-Rust-Setup.exe"
Unicode True

; Default installation folder (User can change this to any folder or drive D:\, E:\, etc.)
InstallDir "$LOCALAPPDATA\Programs\WhatsAppRust"
InstallDirRegKey HKCU "Software\WhatsAppRust" "Install_Dir"

; Request user-level privileges so user can install to any folder without UAC hassle
RequestExecutionLevel user

; Branding & Custom WhatsApp Icon
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"
!define MUI_ABORTWARNING

; Welcome Page
!insertmacro MUI_PAGE_WELCOME

; Directory Selection Page Customization (User chooses where to store app & WebView2 data)
!define MUI_DIRECTORYPAGE_TEXT_TOP "Pilih folder lokasi penyimpanan untuk menginstal aplikasi WhatsApp (Rust) beserta data sesi & cache WebView2 Anda. Klik Browse untuk memilih drive atau folder lain (misal D:\WhatsAppRust)."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Folder Penyimpanan Aplikasi & Data WhatsApp:"
!insertmacro MUI_PAGE_DIRECTORY

; Installation Progress Page
!insertmacro MUI_PAGE_INSTFILES

; Finish Page — Launch App Checkbox
!define MUI_FINISHPAGE_RUN "$INSTDIR\whatsapp-rust.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Jalankan WhatsApp sekarang"
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "WhatsApp Rust Core" SecMain
  SetOutPath "$INSTDIR"

  ; Copy compiled binary, custom icon, and documentation
  File "dist-release\whatsapp-rust.exe"
  File "assets\icon.ico"
  File "README.md"

  ; Create persistent WebView2 storage folder inside the user's chosen directory
  CreateDirectory "$INSTDIR\webview2-profile"

  ; Write chosen storage path to storage-location.txt so whatsapp-rust.exe stores all data here
  FileOpen $0 "$INSTDIR\storage-location.txt" w
  FileWrite $0 "$INSTDIR\webview2-profile"
  FileClose $0

  ; Save installation directory in registry
  WriteRegStr HKCU "Software\WhatsAppRust" "Install_Dir" "$INSTDIR"
  WriteRegStr HKCU "Software\WhatsAppRust" "Storage_Dir" "$INSTDIR\webview2-profile"

  ; Register Uninstaller in Windows Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "DisplayName" "WhatsApp (Rust Lightweight)"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "Publisher" "WhatsApp Rust Open Source"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust" "NoRepair" 1

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Create Desktop & Start Menu Shortcuts with the custom WhatsApp icon
  CreateDirectory "$SMPROGRAMS\WhatsApp Rust"
  CreateShortcut "$SMPROGRAMS\WhatsApp Rust\WhatsApp.lnk" "$INSTDIR\whatsapp-rust.exe" "" "$INSTDIR\icon.ico" 0
  CreateShortcut "$SMPROGRAMS\WhatsApp Rust\Uninstall WhatsApp.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\icon.ico" 0
  CreateShortcut "$DESKTOP\WhatsApp.lnk" "$INSTDIR\whatsapp-rust.exe" "" "$INSTDIR\icon.ico" 0
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\WhatsApp.lnk"
  Delete "$SMPROGRAMS\WhatsApp Rust\WhatsApp.lnk"
  Delete "$SMPROGRAMS\WhatsApp Rust\Uninstall WhatsApp.lnk"
  RMDir "$SMPROGRAMS\WhatsApp Rust"

  Delete "$INSTDIR\whatsapp-rust.exe"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\storage-location.txt"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\webview2-profile"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsAppRust"
  DeleteRegKey HKCU "Software\WhatsAppRust"
SectionEnd
