# Security Notice

## No Authentication on Admin Interface

**Status:** INTENTIONALLY UNPROTECTED (User Decision)
**Date:** 2026-02-09
**Decision:** User has chosen not to implement authentication

### Note

The admin interface at `/admin/index.html` and API endpoints have no authentication by design.

**Best Practices:**
- Keep the `/admin` URL private
- Monitor activity log for unauthorized access
- Regularly review OpenAI API usage for unexpected charges

This file serves as documentation of the security decision.
