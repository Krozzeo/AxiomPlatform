$ErrorActionPreference='Stop'
$platformRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(-not (Test-Path -LiteralPath $compiler)){throw 'The Windows .NET Framework compiler is required to rebuild the launcher.'}
& $compiler /nologo /target:exe /optimize+ ('/win32icon:'+(Join-Path $platformRoot 'apps/hub/icons/axiom.ico')) ('/out:'+(Join-Path $PSScriptRoot 'Axiom Hub.exe')) (Join-Path $PSScriptRoot 'AxiomHub.cs')
if($LASTEXITCODE -ne 0){throw 'Axiom Hub compilation failed.'}
$source=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'AxiomHub.cs')).Replace("`r`n","`n")
$sha=[Security.Cryptography.SHA256]::Create()
try{$sourceHash=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($source)))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
$record=@{sourceSha256=$sourceHash;sourceNormalization='UTF-8/LF';executableSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'Axiom Hub.exe') -Algorithm SHA256).Hash.ToLowerInvariant();iconSha256=(Get-FileHash -LiteralPath (Join-Path $platformRoot 'apps/hub/icons/axiom.ico') -Algorithm SHA256).Hash.ToLowerInvariant();compiler='Windows .NET Framework C# compiler';compilerVersion=(Get-Item -LiteralPath $compiler).VersionInfo.FileVersion}
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'launcher-build.json'),($record|ConvertTo-Json)+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
