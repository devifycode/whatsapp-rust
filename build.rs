// build.rs — Windows Resource & Manifest Compiler for whatsapp-rust.exe
// Embeds native Windows application metadata, Per-Monitor V2 DPI Awareness,
// and ensures zero console window flash on startup.

fn main() {
    #[cfg(target_os = "windows")]
    {
        let mut res = winres::WindowsResource::new();
        res.set("ProductName", "WhatsApp Native Rust");
        res.set(
            "FileDescription",
            "WhatsApp Native Rust — Lightweight Desktop Client",
        );
        res.set("OriginalFilename", "whatsapp-rust.exe");
        res.set("CompanyName", "WhatsApp Rust Open Source");
        res.set("LegalCopyright", "MIT License (2026)");
        res.set_manifest(
            r#"
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0" xmlns:asmv3="urn:schemas-microsoft-com:asm.v3">
  <asmv3:application>
    <asmv3:windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
      <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2,PerMonitor</dpiAwareness>
    </asmv3:windowsSettings>
  </asmv3:application>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="asInvoker" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
"#,
        );
        let _ = res.compile();
    }
}
