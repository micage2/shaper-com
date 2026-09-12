$oldDir = Get-Location
cd "$HOME\developer\projects" # start search path

# $pattern = "\.sort\("
$pattern = "localeCompare"

rg $pattern -g "*.js" -g "!**/ollama/**" -g "!**/WebGPU/**" -g "!**/node_modules/**" -g "!**/*Laravel*/**" -n . |
  ForEach-Object {
    $parts = $_ -split ':'
    "$($parts[0]), line $($parts[1])"
  } | Out-File "C:\Users\user\developer\projects\search-for-sort.md" -Encoding utf8

cd $oldDir