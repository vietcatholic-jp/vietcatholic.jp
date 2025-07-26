---
type: "always_apply"
description: "Các bước khi có yêu cầu giải quyết issuse"
---
1. Pull the latest code from the staging branch
2. Read the issue carefully, understand the user's requirements based on the user's description and code base.
3. Recreate the error by real browser, see how the error looks like, check again the codebase is correct, check again where the error can be
4. Rewrite the issue into a detailed prompt
5. Create small tasks based on the content of the prompt, each task has 2 smaller tasks: 1 task is to write code, 1 task is to test by real browser
6. Send the smaller tasks to AI to solve
7. Run real browser tests after completing each task to ensure the functionality works as expected
8. When AI completes the smaller tasks, combine them into a PR
9. Send the PR to Github, wait for about 2 minutes and check if Github Action checks for lint, build, test have any errors
10. If there are errors, request AI to fix them until there are no errors and repeat steps 7 to 10
11. I will merge to staging branch manually

