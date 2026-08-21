# Initialises and pushes the two repositories that were still single-copy on
# this laptop: the socioclimate-web product, and the dev/socioclimate root that
# holds README/CONVENTIONS/CLAUDE and infra/ (where env.sh lives).
#
# Idempotent. Safe to re-run after a partial failure: every step checks whether
# it has already happened. Guards abort the whole thing rather than pushing
# something unexpected.
#
#   powershell -ExecutionPolicy Bypass -File scripts\init-repos.ps1
#
# PowerShell 5.1: no '&&', no 'wc -l'. Counts use @(...).Count.

# NOT 'Stop'. In PowerShell 5.1, anything a native executable writes to stderr
# is wrapped in an ErrorRecord, so with 'Stop' a routine git warning aborts the
# script. Every native call below is checked explicitly via $LASTEXITCODE
# instead, which is the reliable signal.
$ErrorActionPreference = 'Continue'
$Owner = 'matthew-colborn'

# Expected staged counts on the FIRST commit only. These are the check that
# .gitignore is being honoured — a count in the thousands means node_modules
# is being staged.
#
# The site is 85, not the 84 counted earlier in the session: this script is
# itself a file inside that repo.
$SiteCount = 85
$RootCount = 15

function Write-Step { param($m) Write-Host "  $m" }
function Write-Head { param($m) Write-Host ""; Write-Host "########## $m ##########" }
function Abort { param($m) Write-Host ""; Write-Host "ABORTED: $m" -ForegroundColor Red; exit 1 }

# Git needs an identity or the commit fails halfway through.
$gitName  = (git config --get user.name)
$gitEmail = (git config --get user.email)
if ([string]::IsNullOrWhiteSpace($gitName) -or [string]::IsNullOrWhiteSpace($gitEmail)) {
  Abort "git user.name / user.email are not configured. Set them before running this."
}
Write-Host "git identity: $gitName <$gitEmail>"

function Initialize-Repo {
  param(
    [string]$Path,
    [int]$ExpectedCount,
    [string]$RepoName,
    [string]$CommitMessage,
    [switch]$ForbidProducts
  )

  Write-Head $RepoName
  if (-not (Test-Path $Path)) { Abort "$Path does not exist" }
  Push-Location $Path
  try {
    # --- 1. init ----------------------------------------------------------
    if (Test-Path (Join-Path $Path '.git')) {
      Write-Step "init      already a repo, skipping"
    } else {
      git init -b main | Out-Null
      if ($LASTEXITCODE -ne 0) { Abort "git init failed in $Path" }
      Write-Step "init      created (branch main)"
    }

    # A lock left by a killed process would block everything below.
    $lock = Join-Path $Path '.git\index.lock'
    if (Test-Path $lock) {
      Remove-Item $lock -Force
      Write-Step "lock      removed a stale .git\index.lock"
    }

    # --- 2. stage ---------------------------------------------------------
    git add -A
    if ($LASTEXITCODE -ne 0) { Abort "git add failed in $Path" }

    $status  = @(git status --short)
    $count   = $status.Count
    # --verify --quiet exits nonzero without writing to stderr when there is no
    # commit yet, which is what makes this safe to call on a fresh repo.
    git rev-parse --verify --quiet HEAD | Out-Null
    $hasHead = ($LASTEXITCODE -eq 0)

    # --- 3. guards --------------------------------------------------------
    if ($ForbidProducts) {
      $bad = @($status | Where-Object { $_ -match 'products/' })
      if ($bad.Count -gt 0) {
        Write-Host ""
        $bad | ForEach-Object { Write-Host "    $_" }
        Abort "$($bad.Count) staged path(s) under products/. The root .gitignore should exclude that tree entirely."
      }
      Write-Step "guard     no products/ paths staged"
    }

    if (-not $hasHead) {
      # First commit: the count is the check that .gitignore is being honoured.
      if ($count -ne $ExpectedCount) {
        Write-Host ""
        Write-Host "  expected $ExpectedCount staged path(s), found $count"
        Write-Host "  first 40:"
        $status | Select-Object -First 40 | ForEach-Object { Write-Host "    $_" }
        Abort "staged count mismatch in $Path - nothing was committed"
      }
      Write-Step "stage     $count path(s), matches expected $ExpectedCount"
    } else {
      Write-Step "stage     repo already has commits; $count uncommitted path(s)"
    }

    # --- 4. commit --------------------------------------------------------
    if ($count -eq 0) {
      Write-Step "commit    nothing to commit, working tree clean"
    } else {
      git commit -m $CommitMessage | Out-Null
      if ($LASTEXITCODE -ne 0) { Abort "git commit failed in $Path" }
      Write-Step "commit    $(git rev-parse --short HEAD)  $CommitMessage"
    }

    # --- 5. GitHub repo + remote -----------------------------------------
    $remotes = @(git remote)
    $hasOrigin = $remotes -contains 'origin'

    # Listing and matching, rather than `gh repo view` — view writes to stderr
    # when the repo is absent, which is the same PowerShell 5.1 trap as above.
    $existing = @(gh repo list $Owner --limit 200 --json name | ConvertFrom-Json | ForEach-Object { $_.name })
    $repoExists = ($existing -contains $RepoName)

    if (-not $repoExists) {
      Write-Step "github    creating private repo $Owner/$RepoName"
      if ($hasOrigin) {
        gh repo create "$RepoName" --private --source=. --remote=origin --push
      } else {
        gh repo create "$RepoName" --private --source=. --push
      }
      if ($LASTEXITCODE -ne 0) { Abort "gh repo create failed for $RepoName" }
      Write-Step "github    created and pushed"
    } else {
      Write-Step "github    repo $Owner/$RepoName already exists"
      if (-not $hasOrigin) {
        git remote add origin "https://github.com/$Owner/$RepoName.git"
        Write-Step "remote    added origin"
      } else {
        Write-Step "remote    origin already set to $(git remote get-url origin)"
      }
      git push -u origin main
      if ($LASTEXITCODE -ne 0) { Abort "git push failed for $RepoName" }
      Write-Step "push      pushed main to origin"
    }

    # --- 6. verify against GitHub ----------------------------------------
    $local  = (git rev-parse HEAD)
    $remote = (git ls-remote origin refs/heads/main | ForEach-Object { ($_ -split "\s+")[0] })
    if ($local -eq $remote -and -not [string]::IsNullOrWhiteSpace($remote)) {
      Write-Step "verify    IN SYNC  local $($local.Substring(0,8)) == origin/main"
    } else {
      Abort "local HEAD $local does not match origin/main $remote"
    }
  }
  finally { Pop-Location }
}

Initialize-Repo -Path 'C:\Users\Matth\dev\socioclimate\products\socioclimate-web' `
  -ExpectedCount $SiteCount -RepoName 'socioclimate-web' `
  -CommitMessage 'socioclimate.io: static marketing site on Firebase Hosting'

Initialize-Repo -Path 'C:\Users\Matth\dev\socioclimate' `
  -ExpectedCount $RootCount -RepoName 'socioclimate' `
  -CommitMessage 'SocioClimate: operating model, conventions and infra scripts' `
  -ForbidProducts

Write-Host ""
Write-Host "Done. Both repositories are on GitHub and in sync."
