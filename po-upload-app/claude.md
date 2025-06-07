# Claude Instructions for PO-Upload-App

## Project Overview
This document contains essential instructions for AI assistance on the PO-Upload-App project.

## Critical Git Guidelines

### ⚠️ NEVER Force Push or Remove Commits
- **NEVER** use `git push --force` or `git push -f`
- **NEVER** use `git reset --hard` to remove previous commits
- **NEVER** use `git rebase -i` to squash or remove existing commits
- **NEVER** use any commands that would rewrite Git history

### Safe Git Practices
- Always use `git push` without force flags
- Use `git revert` instead of removing commits to undo changes
- Create new commits to fix issues rather than modifying existing ones
- Always pull before pushing: `git pull origin main` then `git push origin main`
- Use feature branches for new development when possible

## Development Guidelines

### Code Changes
- Make incremental, logical commits with clear commit messages
- Test changes thoroughly before committing
- Preserve existing commit history at all costs
- If mistakes are made, fix them with new commits

### Collaboration
- Respect the existing commit history as it may contain important context
- When in doubt about Git operations, ask for clarification
- Maintain a clean, readable commit history through good practices, not history rewriting

## Emergency Procedures
If there's ever a suggestion to force push or remove commits:
1. **STOP** - Do not proceed
2. Clarify the issue and explore alternative solutions
3. Use safe Git commands like `git revert` or create corrective commits
4. Preserve all existing history

## Additional Notes
- This project values Git history preservation above all else
- All team members and AI assistants must follow these guidelines
- When working with pull requests, use merge commits or rebase only on feature branches, never on main/master

---
*Remember: A messy but complete Git history is always better than a clean but incomplete one.*