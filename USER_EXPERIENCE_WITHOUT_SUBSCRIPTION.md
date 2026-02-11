# User Experience: Active User Without Subscription

## Scenario
- ✅ User account exists and is active
- ✅ User's email/password are correct
- ✅ Tenant exists with `status = "active"`
- ❌ **NO subscription exists** (or all subscriptions have `status != "active"`)

---

## Step-by-Step User Flow

### Step 1: User Visits Subdomain
```
User navigates to: https://acme.fayohealthtech.so
```

**What happens:**
- Middleware checks if user is logged in
- User is NOT logged in
- ➡️ **Redirect to `/login`**

---

### Step 2: User Sees Login Page
```
URL: https://acme.fayohealthtech.so/login
```

**Page displays:**
- Email input field
- Password input field
- "Sign In" button
- Company logo

---

### Step 3: User Enters Credentials
```
Email: admin@acme.com
Password: ********
```

**User clicks "Sign In"**

---

### Step 4: NextAuth Validates Credentials

**Backend checks (in `src/lib/auth-options.ts`):**
1. ✅ Does user exist? → YES
2. ✅ Does password match? → YES
3. ✅ Does user's tenantId match subdomain? → YES
4. ✅ Is user a platform admin trying to access subdomain? → NO (correct)

**Result:** ✅ **Login SUCCEEDS**

**Session created with:**
```json
{
  "user": {
    "id": "user-123",
    "email": "admin@acme.com",
    "name": "Admin User",
    "tenantId": "acme-tenant-id",
    "isPlatformAdmin": false,
    "permissions": ["tickets.view", "visas.view", ...]
  }
}
```

---

### Step 5: Login Success - Redirect to Dashboard

**After successful login, user is redirected to:**
```
URL: https://acme.fayohealthtech.so/
```

---

### Step 6: Middleware Intercepts Request

**Middleware runs (`src/middleware.ts` lines 110-148):**

```typescript
// Check 1: Is user logged in?
✅ YES - User has valid session

// Check 2: Is this a subdomain?
✅ YES - acme.fayohealthtech.so

// Check 3: Is user platform admin?
✅ NO - Continue checks

// Check 4: Does tenant exist?
const tenant = await prisma.tenant.findUnique({
  where: { id: "acme-tenant-id" }
});
✅ YES - Tenant found

// Check 5: Is tenant status = "active"?
if (tenant.status !== "active") { ... }
✅ YES - Tenant is active

// Check 6: Does tenant have active subscription?
const subscription = await prisma.subscription.findFirst({
  where: {
    tenantId: "acme-tenant-id",
    status: "active"
  }
});
❌ NO - No subscription found!

// BLOCK ACCESS
return NextResponse.redirect(
  new URL("/subscription-expired", req.url)
);
```

---

### Step 7: User Redirected to Subscription Page

**User sees:**
```
URL: https://acme.fayohealthtech.so/subscription-expired
```

**Page Content:**

```
┌────────────────────────────────────────┐
│                                        │
│           [!] Red Alert Icon           │
│                                        │
│      Subscription Required             │
│                                        │
│  Your account does not have an active  │
│  subscription. Please contact support  │
│  to activate or renew your            │
│  subscription plan.                    │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Contact Support:                │ │
│  │  📞 +252 907 700 949             │ │
│  └──────────────────────────────────┘ │
│                                        │
│         ← Back to Login                │
│                                        │
└────────────────────────────────────────┘
```

---

### Step 8: User Tries to Access Any Page

**User tries to navigate to:**
- `/tickets` → Redirected to `/subscription-expired`
- `/visas` → Redirected to `/subscription-expired`
- `/dashboard` → Redirected to `/subscription-expired`
- `/customers` → Redirected to `/subscription-expired`
- Any other page → Redirected to `/subscription-expired`

**Only accessible pages:**
- ✅ `/login` (public page)
- ✅ `/subscription-expired` (public page)
- ✅ `/tenant-suspended` (public page)

---

## What User CANNOT Do

❌ View dashboard  
❌ Create/view tickets  
❌ Create/view visas  
❌ Create/view Haj & Umrah bookings  
❌ View customers  
❌ View expenses  
❌ View reports  
❌ Access ANY protected page  

---

## What User CAN Do

✅ Log in successfully  
✅ View subscription-expired page  
✅ See support contact number  
✅ Log out  
✅ Go back to login  

---

## How to Fix This Situation

### Option 1: Platform Admin Creates Subscription (Recommended)

**Platform Admin Steps:**
1. Go to `https://fayohealthtech.so/platform`
2. Log in with platform admin credentials
3. Navigate to **Tenants** page
4. Find "ACME" tenant
5. Click on tenant to view details
6. Click "Create Subscription" or "Add Subscription"
7. Fill in:
   - **Plan:** Select from available plans (e.g., "Basic Plan - $99/month")
   - **Status:** Set to `"active"`
   - **Start Date:** Today
   - **Billing Cycle:** Monthly/Yearly
8. Click "Save"

**Result:** User can now access the system immediately (next page refresh)

---

### Option 2: Automatic Trial Creation (If Configured)

If your platform is configured to auto-create trials:

**In tenant creation flow:**
```typescript
// Create tenant
const tenant = await prisma.tenant.create({
  data: {
    subdomain: "acme",
    name: "ACME Company",
    status: "active"
  }
});

// Auto-create trial subscription
const subscription = await prisma.subscription.create({
  data: {
    tenantId: tenant.id,
    planId: "trial-plan-id",
    status: "trial", // Treated as active
    startDate: new Date(),
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});
```

---

### Option 3: Manual Database Insert (Emergency Only)

**Run this SQL in your database:**

```sql
-- First, get the tenant ID
SELECT id, subdomain FROM "Tenant" WHERE subdomain = 'acme';

-- Then create subscription
INSERT INTO "Subscription" (
  "id",
  "tenantId",
  "planId",
  "status",
  "startDate",
  "currentPeriodStart",
  "currentPeriodEnd",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'TENANT_ID_FROM_ABOVE', -- Replace with actual tenant ID
  'PLAN_ID_HERE',         -- Replace with actual plan ID
  'active',
  NOW(),
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);
```

---

## Timeline Example

```
09:00 AM - User created by platform admin
09:01 AM - User receives credentials via email
09:05 AM - User visits https://acme.fayohealthtech.so
09:05 AM - User clicks login
09:06 AM - User enters email/password
09:06 AM - ✅ Login succeeds
09:06 AM - ❌ Redirected to /subscription-expired
09:07 AM - User calls support: +252 907 700 949
09:10 AM - Support team contacts platform admin
09:15 AM - Platform admin creates subscription with status="active"
09:15 AM - ✅ User refreshes page
09:15 AM - ✅ User can now access dashboard
```

---

## Why This Design?

### Benefits:

1. **Security:** Prevents unauthorized access to system without payment
2. **Revenue Protection:** Enforces subscription requirements
3. **Clear Communication:** User knows exactly why they're blocked and who to contact
4. **No Partial Access:** Clean all-or-nothing access (no confusing limited features)
5. **Graceful Degradation:** User can log in and see a helpful message (not a cryptic error)

### Alternatives Considered & Rejected:

❌ **Block at login level:** User would see "Invalid credentials" which is confusing  
❌ **Allow limited access:** Creates complexity and confusion  
❌ **Show error on every page:** Annoying user experience  
❌ **Silent failure:** User wouldn't know what's wrong  

---

## Important Notes

### 1. Login Always Works
Even without subscription, login will **succeed** because:
- Authentication (verifying identity) ≠ Authorization (granting access)
- Login only verifies: user exists, password correct, tenant matches
- Access control happens AFTER login in middleware

### 2. Middleware is the Gatekeeper
The middleware (`src/middleware.ts`) is responsible for:
- Checking subscription status
- Redirecting to appropriate error pages
- Enforcing access control rules

### 3. API Routes Not Affected by Middleware
API routes have their own authentication:
- They check `tenantId` in the session
- They verify permissions
- But they don't auto-redirect (they return 401/403 errors instead)

### 4. Platform Admins Bypass All Checks
If `isPlatformAdmin = true`:
- ✅ Can access `/platform` on root domain
- ❌ Cannot access tenant subdomains
- ✅ Not affected by subscription checks
- ✅ Not affected by tenant status

---

## Summary

**Question:** *"The user is active but the tenant has no subscription plan at all, so what would happen?"*

**Answer:**

1. ✅ User **CAN log in** successfully
2. ❌ User is **immediately redirected** to `/subscription-expired` after login
3. 🚫 User **CANNOT access** any protected pages (dashboard, tickets, visas, etc.)
4. 📞 User sees a message to contact **+252 907 700 949** to activate subscription
5. 🔧 Platform admin must **create an active subscription** to grant access
6. ⚡ Once subscription is active, user can access the system **immediately** (next page load)

**This is working as designed** to enforce subscription requirements for SaaS access.
