$branch = (git branch --show-current 2>$null)
$status = (git status --porcelain 2>$null)
$config = '.claude/project.config.json'
Write-Output "Project workflow active. Branch: $branch. Dirty files: $(@($status).Count). Config: $config. Never push automatically."

# The configured base branch has silently pointed at a non-existent branch
# before. Catch it at session start instead of halfway through a feature.
if (Test-Path $config) {
  $base = (Get-Content $config -Raw | ConvertFrom-Json).defaultBaseBranch
  if ($base) {
    git rev-parse --verify --quiet "$base" *> $null
    if (-not $?) {
      Write-Output "WARNING: defaultBaseBranch '$base' does not exist in this repository. Fix $config before branching."
    }
  }
}
