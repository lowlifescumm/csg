# PowerShell script to create GitHub Pull Request
# This script opens the GitHub web interface to create a PR

$repo = "lowlifescumm/csg"
$baseBranch = "master"
$headBranch = "feature/premium-ebook-pdf-generator-clean"
$title = "fix: Credit System SSOT + Production Build Fixes"

# GitHub web URL to create PR (title will be pre-filled in browser)
$prUrl = "https://github.com/$repo/compare/$baseBranch...$headBranch?expand=1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pull Request Creation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository: $repo" -ForegroundColor Yellow
Write-Host "Base Branch: $baseBranch" -ForegroundColor Yellow
Write-Host "Head Branch: $headBranch" -ForegroundColor Yellow
Write-Host "Title: $title" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening GitHub PR creation page..." -ForegroundColor Green
Write-Host ""
Write-Host "PR URL: $prUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the description from PR_DESCRIPTION.md and paste it into the PR description field." -ForegroundColor Yellow
Write-Host ""

# Open in default browser
Start-Process $prUrl

Write-Host "GitHub page opened in your default browser." -ForegroundColor Green
Write-Host "Please copy the description from PR_DESCRIPTION.md and paste it into the PR description field." -ForegroundColor Yellow

