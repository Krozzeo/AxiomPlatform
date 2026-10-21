Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Assert-ContainedPath([string]$Root,[string]$Path) {
 $base=[IO.Path]::GetFullPath($Root).TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar
 $target=[IO.Path]::GetFullPath($Path)
 if(-not $target.StartsWith($base,[StringComparison]::OrdinalIgnoreCase)){throw "Path must stay inside $Root"}
 return $target
}
function Get-NodeArchive([string]$Text,[string]$Architecture) {
 if($Architecture -notin @('x64','arm64')){throw 'Unsupported Windows architecture'}
 $pattern='(?m)^([a-fA-F0-9]{64})\s+(node-v24\.\d+\.\d+-win-'+$Architecture+'\.zip)\s*$'
 $match=[regex]::Match($Text,$pattern)
 if(-not $match.Success){throw 'The official Node.js checksum list has no compatible Windows archive'}
 return @{Name=$match.Groups[2].Value;Hash=$match.Groups[1].Value}
}
function Get-AxiomFileHash([string]$Path,[string]$Algorithm='SHA256') {
 $stream=[IO.File]::OpenRead($Path);$hasher=[Security.Cryptography.HashAlgorithm]::Create($Algorithm)
 if(-not $hasher){$stream.Dispose();throw 'Unsupported hash algorithm'}
 try{return ([BitConverter]::ToString($hasher.ComputeHash($stream))).Replace('-','')}finally{$hasher.Dispose();$stream.Dispose()}
}
function Test-DownloadHash([string]$Path,[string]$Expected,[string]$Algorithm) {
 if((Get-AxiomFileHash $Path $Algorithm) -ne $Expected){throw "Downloaded file failed $Algorithm verification: $Path"}
}
function Expand-VerifiedZip([string]$Path,[string]$Destination) {
 Add-Type -AssemblyName System.IO.Compression
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $archive=[IO.Compression.ZipFile]::OpenRead($Path)
 try{foreach($entry in $archive.Entries){$target=Assert-ContainedPath $Destination (Join-Path $Destination $entry.FullName);if(($entry.ExternalAttributes -band 0xF0000000) -eq 0xA0000000){throw 'Linked ZIP entries are not allowed'}}}finally{$archive.Dispose()}
 New-Item -ItemType Directory -Path $Destination -Force | Out-Null
 [IO.Compression.ZipFile]::ExtractToDirectory($Path,$Destination)
}
function Get-OfficialFile([string]$Url,[string]$Destination) {
 $uri=[uri]$Url
 if($uri.Scheme -ne 'https' -or $uri.Host -notin @('nodejs.org','builds.dotnet.microsoft.com','download.visualstudio.microsoft.com')){throw 'Dependency download must use an approved official HTTPS host'}
 Write-Host "Downloading $($uri.Host)/$([IO.Path]::GetFileName($uri.AbsolutePath)) ..."
 Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $Destination -TimeoutSec 600
}
function Get-Architecture {
 if($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64'){return 'arm64'}
 if([Environment]::Is64BitOperatingSystem){return 'x64'}
 throw 'Axiom requires 64-bit Windows'
}
function Test-Node([string]$Path) {try{$version=& $Path --version 2>$null;return $LASTEXITCODE -eq 0 -and $version -match '^v(2[4-9]|[3-9][0-9])\.'}catch{return $false}}
function Use-Node([string]$RuntimeRoot) {
 $local=Get-ChildItem -LiteralPath $RuntimeRoot -Directory -Filter 'node-v24*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
 if($local -and (Test-Node (Join-Path $local.FullName 'node.exe'))){return (Join-Path $local.FullName 'node.exe')}
 $system=Get-Command node.exe -ErrorAction SilentlyContinue
 if($system -and (Test-Node $system.Source)){return $system.Source}
 $arch=Get-Architecture;$checks=(Invoke-WebRequest -UseBasicParsing -Uri 'https://nodejs.org/download/release/latest-v24.x/SHASUMS256.txt' -TimeoutSec 30).Content
 $item=Get-NodeArchive $checks $arch;$zip=Join-Path $RuntimeRoot $item.Name
 Get-OfficialFile ('https://nodejs.org/download/release/latest-v24.x/'+$item.Name) $zip;Test-DownloadHash $zip $item.Hash 'SHA256'
 $stage=Join-Path $RuntimeRoot ('node-stage-'+[guid]::NewGuid());Expand-VerifiedZip $zip $stage
 $directory=Get-ChildItem -LiteralPath $stage -Directory | Select-Object -First 1
 if(-not $directory -or -not (Test-Node (Join-Path $directory.FullName 'node.exe'))){throw 'Downloaded Node.js could not be validated'}
 $destination=Assert-ContainedPath $RuntimeRoot (Join-Path $RuntimeRoot $directory.Name)
 if(Test-Path -LiteralPath $destination){throw "An incomplete runtime already exists at $destination. Keep it for inspection and use a clean runtime folder."}
 Move-Item -LiteralPath $directory.FullName -Destination $destination
 return (Join-Path $destination 'node.exe')
}
function Test-DotNet([string]$Path) {
 try{$sdks=& $Path --list-sdks 2>$null;if($LASTEXITCODE -ne 0 -or -not ($sdks -match '^10\.')){return $false};$workloads=& $Path workload list 2>$null;return $LASTEXITCODE -eq 0 -and ($workloads -match '\bwasm-tools\b').Count -gt 0}catch{return $false}
}
function Use-DotNet([string]$RuntimeRoot) {
 $local=Get-ChildItem -LiteralPath $RuntimeRoot -Directory -Filter 'dotnet-10*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
 if($local){$exe=Join-Path $local.FullName 'dotnet.exe';$env:DOTNET_ROOT=$local.FullName;$env:PATH=$local.FullName+';'+$env:PATH;if(Test-DotNet $exe){return $exe}}
 $system=Get-Command dotnet.exe -ErrorAction SilentlyContinue
 if($system -and (Test-DotNet $system.Source)){return $system.Source}
 $metadata=Invoke-RestMethod -Uri 'https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json' -TimeoutSec 30
 $version=$metadata.'latest-sdk';$sdk=$metadata.releases | ForEach-Object {if($_.PSObject.Properties['sdk']){$_.sdk};if($_.PSObject.Properties['sdks']){$_.sdks}} | Where-Object {$_.version -eq $version} | Select-Object -First 1
 $rid='win-'+(Get-Architecture);$file=$sdk.files | Where-Object {$_.rid -eq $rid -and $_.url.EndsWith('.zip')} | Select-Object -First 1
 if(-not $file){throw 'The official .NET metadata has no compatible SDK archive'}
 $zip=Join-Path $RuntimeRoot ('dotnet-'+$version+'.zip');Get-OfficialFile $file.url $zip;Test-DownloadHash $zip $file.hash 'SHA512'
 $target=Assert-ContainedPath $RuntimeRoot (Join-Path $RuntimeRoot ('dotnet-'+$version))
 if(-not (Test-Path -LiteralPath $target)){Expand-VerifiedZip $zip $target}
 $env:DOTNET_ROOT=$target;$env:DOTNET_MULTILEVEL_LOOKUP='0';$env:PATH=$target+';'+$env:PATH
 Write-Host 'Installing the local .NET WebAssembly workload. The first setup can take several minutes ...'
 $dotnet=Join-Path $target 'dotnet.exe';& $dotnet workload install wasm-tools --skip-manifest-update | Out-Host
 if($LASTEXITCODE -ne 0 -or -not (Test-DotNet $dotnet)){throw 'The WebAssembly workload could not be installed. See the .NET output above.'}
 return $dotnet
}
Export-ModuleMember -Function Get-AxiomFileHash,Assert-ContainedPath,Get-NodeArchive,Test-DownloadHash,Expand-VerifiedZip,Test-Node,Test-DotNet,Use-Node,Use-DotNet
