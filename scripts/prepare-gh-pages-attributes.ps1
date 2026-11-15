# Ensures GitHub Pages gets real binaries (no LFS pointers, no CRLF corruption).
$attributes = @"
# gh-pages only: disable LFS and line-ending conversion for published assets
* -text filter= diff= merge=
"@
Set-Content -Path "dist/.gitattributes" -Value $attributes -NoNewline -Encoding utf8
