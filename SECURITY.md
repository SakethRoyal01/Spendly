# Security Policy

## Supported versions

Security fixes are provided for the current default branch. Older branches may not receive updates.

## Reporting a vulnerability

Please do not publish credentials, exploit details, private financial data, or an unpatched vulnerability in a public issue.

Use GitHub's private vulnerability reporting feature for this repository if it is enabled. Otherwise, contact the maintainer through the GitHub profile and request a private disclosure channel.

Include a concise description, affected component or route, safe reproduction steps, and potential impact. Please allow reasonable time for investigation and remediation before public disclosure.

## Secret handling

- Never commit `.env.local`, production environment files, Supabase secret/service-role keys, database passwords, access tokens, or private keys.
- Treat all `VITE_*` variables as public because they are bundled into the browser application.
- Use Supabase Row Level Security to enforce per-user data access.
- Do not use real personal financial records in screenshots, issues, fixtures, or test data.
- If a credential is exposed, revoke or rotate it immediately. Removing it from the latest commit does not remove it from Git history or invalidate the credential.