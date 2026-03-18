Dim p
p = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
Dim c
c = "C:\Program Files\Google\Chrome\Application\chrome.exe"
CreateObject("WScript.Shell").Run """" & c & """ --app=""file:///" & p & "\index.html"""