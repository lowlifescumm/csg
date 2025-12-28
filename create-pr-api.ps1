# PowerShell script to create GitHub Pull Request via API
# Requires GITHUB_TOKEN environment variable or GitHub CLI (gh)

param(
    [string]$GitHubToken = $env:GITHUB_TOKEN
)

$repo = "lowlifescumm/csg"
$owner = "lowlifescumm"
$repoName = "csg"
$baseBranch = "master"
$headBranch = "feature/premium-ebook-pdf-generator-clean"
$title = "fix: Credit System SSOT + Production Build Fixes"

# Read PR description
$description = Get-Content "PR_DESCRIPTION.md" -Raw

# Create PR body JSON
$prBody = @{
    title = $title
    head = $headBranch
    base = $baseBranch
    body = $description
} | ConvertTo-Json

Write-Host "Creating Pull Request..." -ForegroundColor Cyan
Write-Host "Repository: $owner/$repoName" -ForegroundColor Yellow
Write-Host "Base: $baseBranch" -ForegroundColor Yellow
Write-Host "Head: $headBranch" -ForegroundColor Yellow
Write-Host "Title: $title" -ForegroundColor Yellow
Write-Host ""

if ($GitHubToken) {
    Write-Host "Using GitHub Token for API request..." -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $apiUrl = "https://api.github.com/repos/$owner/$repoName/pulls"
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $prBody -ContentType "application/json"
        Write-Host "✅ Pull Request created successfully!" -ForegroundColor Green
        Write-Host "PR URL: $($response.html_url)" -ForegroundColor Cyan
        Write-Host "PR Number: #$($response.number)" -ForegroundColor Cyan
        Start-Process $response.html_url
    }
    catch {
        Write-Host "❌ Error creating PR via API:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "Falling back to web interface..." -ForegroundColor Yellow
        $webUrl = "https://github.com/$owner/$repoName/compare/$baseBranch...$headBranch?expand=1"
        Write-Host "Web URL: $webUrl" -ForegroundColor Cyan
        Start-Process $webUrl
    }
}
else {
    Write-Host "⚠️  No GitHub token found. Opening web interface..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create PR via API, set GITHUB_TOKEN environment variable:" -ForegroundColor Yellow
    Write-Host '  $env:GITHUB_TOKEN = "your_token_here"' -ForegroundColor Gray
    Write-Host ""
    $webUrl = "https://github.com/$owner/$repoName/compare/$baseBranch...$headBranch?expand=1"
    Write-Host "Opening web interface: $webUrl" -ForegroundColor Cyan
    Start-Process $webUrl
    Write-Host ""
    Write-Host "Please copy the description from PR_DESCRIPTION.md" -ForegroundColor Yellow
}


