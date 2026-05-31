# COMPONENT MAP

## Module
Authentication UI

| Component / Area | Purpose | Status |
|---|---|---|
| `src/pages/auth/LoginPage.tsx` | Login / role landing screen with API login form and demo profile shortcuts | IMPLEMENTED_SAMPLE_AND_API_READY |
| `src/components/auth/ProtectedRoute.tsx` | Authenticated route guard redirecting unauthenticated users to `/login` | STARTED |
| `src/api/client.ts` | Native `fetch` API request helper | STARTED |
| `src/api/session.ts` | In-memory access-token bridge for API calls | STARTED |
| `src/services/authService.ts` | Auth API client functions using native `fetch` helper | STARTED |
| `src/providers/auth-provider.tsx` | React Context auth state provider | STARTED |
| `src/hooks/useAuth.ts` | Auth state hook backed by React Context | STARTED |
| `src/hooks/useLogin.ts` | Login mutation hook | STARTED |
| `src/hooks/useLogout.ts` | Logout mutation hook | STARTED |
| `src/stores/` | Not used for Auth; unapproved `zustand` store removed | NOT_USED |
| `src/data/auth.sample.ts` | Sample Auth API-shaped login responses for Super Admin and Unit Admin demos | TEMPORARY_UI_REVIEW_ONLY |
| `src/components/` | Auth form and layout components | STARTED |
| `src/components/ui/button.tsx` | Existing shared button primitive | STARTED |
