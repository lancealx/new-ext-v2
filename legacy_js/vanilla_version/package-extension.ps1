# Create dist directory if it doesn't exist
if (-not (Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" | Out-Null }

# Get version from manifest.json
$manifest = Get-Content manifest.json | ConvertFrom-Json
$version = $manifest.version

# Get today's date in YYYYMMDD format
$date = Get-Date -Format "yyyyMMdd"

# Set the zip file name
$zipName = "dist/northstar-nano-ext-$version-$date.zip"

# List of files/folders to include
$items = @(
    "manifest.json",
    "grid.html",
    "content.js",
    "js",
    "css",
    "libs",
    "src",
    "northstar.css",
    "sidepanel.html",
    "popup.js",
    "popup.html",
    "background.js",
    "chrome_ext.code-workspace",
    "cropped-NorthStar-Logo-Icon-32x32.png",
    "icon-128x128.png"
    "side-panel-task-list.png"
)

# Remove old zip if it exists
if (Test-Path $zipName) { Remove-Item $zipName }

# Create the zip
Compress-Archive -Path $items -DestinationPath $zipName

Write-Host "Created $zipName"