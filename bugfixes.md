### [2026-08-17] - Email restore link cut off
**Status:** PENDING USER VERIFY
**Files:** membership-routes.js, membership-claim-guard.js, MembershipPanel.jsx, attempt-counter.js
**Result:** 30s claim 429 + form hide + token wipe blocked retries. Unlimited restore; CAPTCHA only after 10. Earlier links stay valid.


**Status:** PENDING USER VERIFY
**Files:** MembershipPanel.jsx, App.css, resolveMembershipCheckout.js
**Result:** Email field had no Continue/submit. Price tiles were the only checkout action. Added Continue next to email, gold checkout CTA, and Enter-to-submit.

### [2026-08-17] - Cancel membership spinner
**Status:** PENDING USER VERIFY
**Files:** useMembership.js, MembershipUnsubscribePage.jsx, stripe-membership-sync.js, stripe-membership-cancel.js
**Result:** Page stuck on "Loading cancellation options…" because VITE_MEMBERSHIP_DEV_ACTIVE skipped the eligibility API. Eligibility now loads; local-dev D1 rows without a Stripe id sync from Stripe before cancel.
