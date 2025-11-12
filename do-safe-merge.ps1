# Safe Merge Script - Protects Working Cron Jobs
# Run this from the csg directory

Write-Host "=== Safe Merge: Transit Tracker ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we're on master
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "master") {
    Write-Host "ERROR: Not on master branch. Current branch: $currentBranch" -ForegroundColor Red
    Write-Host "Please run: git checkout master" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ On master branch" -ForegroundColor Green

# Step 2: Check if working directory is clean
$status = git status --porcelain
if ($status) {
    Write-Host "WARNING: Working directory has uncommitted changes:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        exit 1
    }
}

# Step 3: Backup is already created (backup-master-working-cron)
Write-Host "✓ Backup branch exists: backup-master-working-cron" -ForegroundColor Green

# Step 4: Start merge
Write-Host ""
Write-Host "Starting merge of feature/transit-tracker-system..." -ForegroundColor Cyan
Write-Host ""

git merge feature/transit-tracker-system --no-ff --no-commit

# Check merge status
$mergeStatus = git status --porcelain

if ($LASTEXITCODE -ne 0 -or $mergeStatus) {
    Write-Host ""
    Write-Host "=== Merge conflicts or changes detected ===" -ForegroundColor Yellow
    Write-Host ""
    
    # Check if cron files are in conflict
    $cronFiles = @(
        "app/api/cron/transit-monitor/route.js",
        "app/api/cron/generate-forecasts/route.js"
    )
    
    foreach ($file in $cronFiles) {
        if (Test-Path $file) {
            $conflict = git diff --check $file 2>&1
            if ($conflict -match "<<<<<<") {
                Write-Host "⚠ Conflict in $file" -ForegroundColor Yellow
                Write-Host "  Keeping master's version (working fix)..." -ForegroundColor Cyan
                git checkout --ours $file
                git add $file
                Write-Host "  ✓ Resolved: using master's version" -ForegroundColor Green
            }
        }
    }
    
    Write-Host ""
    Write-Host "=== Remaining files to review ===" -ForegroundColor Cyan
    Write-Host "Review the following files and stage what you want:" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    
    Write-Host ""
    Write-Host "When ready, run:" -ForegroundColor Cyan
    Write-Host "  git commit -m 'Merge transit-tracker-system: preserve working cron fixes'" -ForegroundColor White
    
} else {
    Write-Host "✓ Merge completed with no conflicts!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Committing merge..." -ForegroundColor Cyan
    git commit -m "Merge transit-tracker-system: preserve working cron fixes"
}

Write-Host ""
Write-Host "=== Merge Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "⚠ IMPORTANT: Test cron jobs after merge!" -ForegroundColor Yellow
Write-Host "Run: curl https://csg-sj6e.onrender.com/api/cron/transit-monitor -H 'Authorization: Bearer c7e09d0b4e614ff0ac23a67e861d49d1a4b62eaa5f0199cf73a50286dc61d7f0'" -ForegroundColor White
Write-Host ""
Write-Host "If something breaks, rollback with:" -ForegroundColor Yellow
Write-Host "  git reset --hard backup-master-working-cron" -ForegroundColor White






