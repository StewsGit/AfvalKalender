$branch = (git branch --show-current 2>$null)
$status = (git status --porcelain 2>$null)
$config = '.claude/project.config.json'
Write-Output "Project workflow active. Branch: $branch. Dirty files: $(@($status).Count). Config: $config. Never push automatically."
