# API USAGE

## Current State
- UI uses sample data only.
- Future API integration should consume request-linked invitation access endpoints when approved.

## Security Rules
- Never request or display `token_hash`.
- Never persist raw setup tokens or links in browser storage.
- Show raw setup URL only immediately after generation if a governed API returns it once.
- Use resend/supersede when setup link is lost or expired.
