param(
  [Parameter(Mandatory=$true)][ValidateSet('feat','fix','test','refactor','docs','chore')][string]$Type,
  [Parameter(Mandatory=$true)][string]$Message
)
$ErrorActionPreference = 'Stop'
$branch = (git branch --show-current).Trim()
if (-not $branch) { throw 'Detached HEAD: refusing to commit.' }
if ($branch -match '^(main|master|develop)$' -or $branch -match '^release[/\-]') {
  throw "Protected branch '$branch': create a feature branch first."
}
$status = git status --porcelain
if (-not $status) { throw 'Nothing to commit.' }
if ($status -match '(^|\n).*(\.env($|\.)|id_rsa|\.pem$|credentials|secrets?)') {
  throw 'Possible secret file detected. Review and stage manually.'
}
git add --all
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Whitespace/error check failed.' }
git commit -m "$Type`: $Message"
