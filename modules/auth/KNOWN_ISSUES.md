# KNOWN ISSUES

# Active Issues

| Issue ID | Description | Severity | Status |
|---|---|---|---|
| UI-AUTH-001 | Auth UI implementation has started with login/role landing and protected routes | HIGH | CLOSED |
| UI-AUTH-002 | Token storage remains in-memory only; browser reload sends user back to login until `/auth/me`/refresh behavior is implemented | HIGH | OPEN |
| UI-AUTH-003 | Non-auth module API handoff is captured, but screen implementation still needs approved module prompts | MEDIUM | CLOSED |
| UI-AUTH-004 | Existing merged Auth scaffold used unapproved `axios` and `zustand` dependencies | HIGH | CLOSED |
| UI-AUTH-005 | Local approved dependencies are installed and build verification passed | MEDIUM | CLOSED |
| UI-AUTH-006 | Demo role login uses placeholder sample tokens for UI review only | MEDIUM | OPEN |

---

# Technical Limitations

- Login / Role Landing and protected route guard are implemented.
- Automated lint/build evidence exists; browser/manual auth evidence is still pending.
- Auth service/state scaffold now uses native `fetch` and React Context.
- Persistent session restore and `/auth/me` profile refresh are still pending.

---

# AI Warnings

- Do not record raw tokens, passwords, or password hashes.
- Do not implement non-auth module screens from Auth permissions/pages alone.
