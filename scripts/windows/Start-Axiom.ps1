param([string]$EnginePath,[string]$SettingsRoot,[switch]$CheckOnly,[switch]$PrepareOnly,[switch]$NoBrowser)
$ErrorActionPreference='Stop'
try {
 [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
 $builtInModules=Join-Path $PSHOME 'Modules';if(($env:PSModulePath -split [IO.Path]::PathSeparator) -notcontains $builtInModules){$env:PSModulePath=$builtInModules+[IO.Path]::PathSeparator+$env:PSModulePath}
 $platformRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
 $bundleRoot=Split-Path -Parent $platformRoot
 if(-not $EnginePath){$EnginePath=Join-Path $bundleRoot 'AxiomEngine'}
 $EnginePath=[IO.Path]::GetFullPath($EnginePath)
 if(-not (Test-Path -LiteralPath (Join-Path $EnginePath 'platform/product.json'))){throw 'AxiomEngine was not found next to AxiomPlatform. Extract the complete bundle before starting.'}
 if(-not $SettingsRoot){if(Test-Path -LiteralPath (Join-Path $bundleRoot 'PerfilPruebas/platform.json')){$SettingsRoot=Join-Path $bundleRoot 'PerfilPruebas'}else{$SettingsRoot=Join-Path $env:APPDATA 'AxiomPlatform'}}
 $dataRoot=Join-Path $platformRoot '.axiom';$runtimeRoot=Join-Path $dataRoot 'runtimes'
 Import-Module (Join-Path $PSScriptRoot 'Bootstrap.psm1') -Force -DisableNameChecking
 Write-Host 'Axiom Platform - dependency check' -ForegroundColor Cyan
 if($CheckOnly){
  $node=Get-Command node.exe -ErrorAction SilentlyContinue;$dotnet=Get-Command dotnet.exe -ErrorAction SilentlyContinue
  $readyNode=$node -and (Test-Node $node.Source);$readyDotNet=$dotnet -and (Test-DotNet $dotnet.Source)
  Write-Host ('Node.js 24+: '+$readyNode);Write-Host ('.NET 10 + wasm-tools: '+$readyDotNet)
  Write-Host ('Built editor: '+(Test-Path -LiteralPath (Join-Path $EnginePath 'dist/editor/axiom-kernel.wasm')))
  if(-not $readyNode -or -not $readyDotNet){exit 1};exit 0
 }
 New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
 $node=Use-Node $runtimeRoot;$env:PATH=(Split-Path -Parent $node)+';'+$env:PATH
 $env:DOTNET_CLI_TELEMETRY_OPTOUT='1';$env:DOTNET_NOLOGO='1'
 $dotnet=Use-DotNet $runtimeRoot
 Write-Host ('Using Node: '+$node);Write-Host ('Using .NET: '+$dotnet)
 $npm=Join-Path (Split-Path -Parent $node) 'npm.cmd'
 if(-not (Test-Path -LiteralPath $npm)){$npm=(Get-Command npm.cmd -ErrorAction Stop).Source}
 $lock=Join-Path $EnginePath 'package-lock.json';$stamp=Join-Path $dataRoot 'engine-dependencies.sha256';$hash=(Get-AxiomFileHash $lock 'SHA256')
 $prepared=(Test-Path -LiteralPath $stamp) -and ((Get-Content -LiteralPath $stamp -Raw).Trim() -eq $hash) -and (Test-Path -LiteralPath (Join-Path $EnginePath 'node_modules/axiom-platform/package.json'))
 if(-not $prepared){Write-Host 'Installing locked Engine dependencies ...';Push-Location $EnginePath;try{& $npm ci --no-audit --no-fund --cache (Join-Path $dataRoot 'npm-cache');if($LASTEXITCODE -ne 0){throw 'npm ci failed. Check your internet connection and the npm output above.'}}finally{Pop-Location};Set-Content -LiteralPath $stamp -Value $hash -Encoding ASCII}
 if(-not (Test-Path -LiteralPath (Join-Path $EnginePath 'dist/editor/axiom-kernel.wasm'))){Write-Host 'No built editor found. Building from source (Rust 1.90 is required) ...';Push-Location $EnginePath;try{& $npm run build;if($LASTEXITCODE -ne 0){throw 'Editor build failed. Download the complete prepared ZIP or install the Rust toolchain shown above.'}}finally{Pop-Location}}
 $mathPath=Join-Path $bundleRoot 'AxiomMathLab'
 if(Test-Path -LiteralPath (Join-Path $mathPath 'platform/product.json')){
  Write-Host 'Preparing Axiom Math Lab ...';Push-Location $mathPath;try{& $npm ci --no-audit --no-fund --cache (Join-Path $dataRoot 'npm-cache');if($LASTEXITCODE -ne 0){throw 'Math Lab dependency installation failed.'}}finally{Pop-Location}
 }
 if($PrepareOnly){Write-Host 'Dependencies are ready.' -ForegroundColor Green;exit 0}
 $arguments=@((Join-Path $platformRoot 'services/local-host/cli.mjs'),'--product',(Join-Path $EnginePath 'platform/product.json'),'--settings-root',$SettingsRoot,'--port','0')
 if(Test-Path -LiteralPath (Join-Path $mathPath 'platform/product.json')){$arguments+=@('--product',(Join-Path $mathPath 'platform/product.json'))}
 if(-not (Test-Path -LiteralPath (Join-Path $SettingsRoot 'platform.json'))){$documents=[Environment]::GetFolderPath('MyDocuments');$arguments+=@('--projects-root',(Join-Path $documents 'Axiom Projects'))}
 if(-not $NoBrowser){$arguments+='--open'}
 Write-Host 'Starting Axiom Platform. Keep this console open; Ctrl+C stops the session.' -ForegroundColor Green
 & $node @arguments
 if($LASTEXITCODE -ne 0){throw ('Platform exited with code '+$LASTEXITCODE)}
} catch {
 Write-Host '';Write-Host ('Startup error: '+$_.Exception.Message) -ForegroundColor Red
 Write-Host $_.ScriptStackTrace
 exit 1
}

