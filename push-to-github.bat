@echo off
echo Adding GitHub remote...
git remote add origin https://github.com/GustavKlint/slime-soccer.git

echo Pushing to GitHub...
git push -u origin main

echo Done! Your game should be live at: https://gustavklint.github.io/slime-soccer/
pause