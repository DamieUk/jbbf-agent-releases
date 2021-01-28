!macro preInit
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files\JBBFAgent"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files\JBBFAgent"
    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files\JBBFAgent"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files\JBBFAgent"
 !macroend
