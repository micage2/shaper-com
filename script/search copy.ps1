rg "\.sort\(" -g "*.js" -g "!**/node_modules/**" -g "!**/*laravel*/**" -Hn -o . |
  ForEach-Object {
    $parts = $_ -split ':'
    $file = $parts[0]
    $line = $parts[1]
    "$file:$line"
  } | Out-File search-for-sort.md -Encoding utf8


rg "\.sort\(" -g "*.js" -g "!**/node_modules/**" -g "!**/*laravel*/**" -Hn -o 
  "C:\Users\user\developer\projects" |
  ForEach-Object {
    $parts = $_ -split ':'
    "$($parts[0]):$($parts[1])"
  } | Out-File search-for-sort.md -Encoding utf8

rg "\.sort\(" -g "*.js" -g "!**/node_modules/**" -g "!**/*laravel*/**" -n "C:\Users\user\developer\projects\AI" |
  ForEach-Object {
    $parts = $_ -split ':'
    "$($parts[0])"
  } | Out-File "C:\Users\user\developer\projects\search-for-sort.md" -Encoding utf8