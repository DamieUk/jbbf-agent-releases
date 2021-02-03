write-host "`n  ## Copy all files ## `n"

mkdir "C:\Program Files\JBBFAgentService"
mkdir "C:\ProgramData\JBBFAgentService"
mkdir "C:\ProgramData\JBBFAgentService\logs"
copy "D:\package.json" "C:\Program Files\JBBFAgentService\package.json"
copy "D:\main.prod.js" "C:\Program Files\JBBFAgentService\main.prod.js"
copy "D:\removeWindowsService.js" "C:\Program Files\JBBFAgentService\removeWindowsService.js"
copy "D:\startWindowsService.js" "C:\Program Files\JBBFAgentService\startWindowsService.js"

write-host "Files are coppied and all folders created!"

write-host "`n  ## Install node and start Agent ## `n"

Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

choco install -y nodejs-lts

cd "C:\Program Files\JBBFAgentService"

npm install

node "C:\Program Files\JBBFAgentService\startWindowsService.js"

write-host "Agent Started!"