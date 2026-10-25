param([ValidateSet('protect','unprotect')][string]$Mode)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$payload = [Console]::In.ReadToEnd()
if ($Mode -eq 'protect') {
  $plain = [Text.Encoding]::UTF8.GetBytes($payload)
  try { [Console]::Out.Write([Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($plain, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser))) }
  finally { [Array]::Clear($plain, 0, $plain.Length) }
} else {
  $plain = [Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($payload), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  try { [Console]::Out.Write([Text.Encoding]::UTF8.GetString($plain)) }
  finally { [Array]::Clear($plain, 0, $plain.Length) }
}
