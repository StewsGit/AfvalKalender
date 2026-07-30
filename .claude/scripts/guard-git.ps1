$inputJson = [Console]::In.ReadToEnd()
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }
$command = [string]$data.tool_input.command
if (-not $command) { exit 0 }

$blocked = @(
  '(?i)(^|[;&|]\s*)git\s+push\b',
  '(?i)(^|[;&|]\s*)git\s+(merge|rebase)\b',
  '(?i)(^|[;&|]\s*)git\s+reset\s+--hard\b',
  '(?i)(^|[;&|]\s*)git\s+clean\s+-[^\s]*f',
  '(?i)(^|[;&|]\s*)git\s+(checkout|restore)\s+--\s'
)
foreach ($pattern in $blocked) {
  if ($command -match $pattern) {
    [Console]::Error.WriteLine("Blocked by project policy: destructive or remote git command requires explicit user execution.")
    exit 2
  }
}
exit 0
