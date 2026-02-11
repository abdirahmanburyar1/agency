# Subscription & Access Control Flow

## Current Behavior Summary

When a user tries to access a tenant subdomain, the system performs the following checks in order:

---

## Access Control Flow

```
┌─────────────────────────────────────┐
│   User accesses subdomain           │
│   (e.g., acme.example.com)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Is user logged in?                │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │ NO          │ YES
        ▼             ▼
   ┌─────────┐   ┌──────────────────────────┐
   │ Redirect│   │ Is user platform admin?  │
   │ to login│   └──────────┬───────────────┘
   └─────────┘              │
                     ┌──────┴──────┐
                     │ YES         │ NO
                     ▼             ▼
              ┌────────────┐  ┌─────────────────────┐
              │ Allow      │  │ Check Tenant Status │
              │ Access     │  └──────────┬──────────┘
              └────────────┘             │
                                         ▼
                              ┌─────────────────────────┐
                              │ Does tenant exist?      │
                              └──────────┬──────────────┘
                                  ┌──────┴──────┐
                                  │ NO          │ YES
                                  ▼             ▼
                           ┌────────────┐  ┌─────────────────────┐
                           │ Redirect   │  │ Is status="active"? │
                           │ to         │  └──────────┬──────────┘
                           │ /tenant-   │       ┌─────┴─────┐
                           │ suspended  │       │ NO        │ YES
                           └────────────┘       ▼           ▼
                                         ┌────────────┐  ┌────────────────────┐
                                         │ Redirect   │  │ Check Subscription │
                                         │ to         │  └──────────┬─────────┘
                                         │ /tenant-   │             │
                                         │ suspended  │             ▼
                                         └────────────┘  ┌────────────────────────┐
                                                         │ Has active             │
                                                         │ subscription?          │
                                                         └──────────┬─────────────┘
                                                             ┌──────┴──────┐
                                                             │ NO          │ YES
                                                             ▼             ▼
                                                      ┌────────────┐  ┌─────────┐
                                                      │ Redirect   │  │ Allow   │
                                                      │ to         │  │ Access  │
                                                      │ /subscription-│  └─────────┘
                                                      │ expired    │
                                                      └────────────┘
```

---

## Scenarios & Outcomes

### Scenario 1: User Active, Tenant Has NO Subscription
**Situation:**
- User exists and is active
- User's credentials are valid
- Tenant exists with `status = "active"`
- **NO subscription record exists** (or all subscriptions are `status != "active"`)

**What Happens:**
1. ✅ User can log in successfully
2. ❌ After login, middleware redirects to `/subscription-expired`
3. 🚫 User **CANNOT** access any protected pages
4. 📞 User sees message: "Your account does not have an active subscription. Please contact support at +252 907 700 949"

**Code Location:** `src/middleware.ts` lines 132-142

```typescript
const subscription = await prisma.subscription.findFirst({
  where: {
    tenantId,
    status: "active",
  },
});

if (!subscription) {
  return NextResponse.redirect(new URL("/subscription-expired", req.url));
}
```

---

### Scenario 2: User Active, Subscription Expired
**Situation:**
- User exists and is active
- Tenant exists with `status = "active"`
- Subscription exists but `status = "expired"` or `status = "cancelled"`

**What Happens:**
- Same as Scenario 1
- Redirected to `/subscription-expired`
- User blocked from accessing the system

---

### Scenario 3: User Active, Tenant Suspended
**Situation:**
- User exists and is active
- Tenant exists but `status = "suspended"` or `status = "banned"`
- Subscription may or may not exist

**What Happens:**
1. ✅ User can log in successfully
2. ❌ Middleware redirects to `/tenant-suspended`
3. 🚫 User **CANNOT** access any protected pages
4. 📞 User sees message: "Account Suspended. Contact support at +252 907 700 949"

**Note:** Tenant status is checked BEFORE subscription status

---

### Scenario 4: User Active, Valid Subscription
**Situation:**
- User exists and is active
- Tenant exists with `status = "active"`
- Subscription exists with `status = "active"`

**What Happens:**
1. ✅ User can log in successfully
2. ✅ User can access all authorized pages
3. ✅ Full system functionality available

---

### Scenario 5: Platform Admin
**Situation:**
- User has `isPlatformAdmin = true`

**What Happens:**
1. ✅ User can access platform admin panel at `/platform`
2. ✅ **Bypasses all tenant status and subscription checks**
3. ✅ Platform admins are NOT affected by tenant status or subscription
4. ❌ Platform admins **CANNOT** access tenant subdomains (they work only on root domain)

---

## Key Validation Points

### 1. Login (NextAuth)
**File:** `src/lib/auth-options.ts`

Validates:
- ✅ Email and password match
- ✅ User exists in database
- ✅ User's tenantId matches subdomain (for non-platform admins)

Does NOT validate:
- ❌ Tenant status
- ❌ Subscription status

**Reason:** Login validation happens first; access control happens in middleware.

---

### 2. Middleware (Access Control)
**File:** `src/middleware.ts`

Validates (in order):
1. ✅ Authentication (is user logged in?)
2. ✅ Platform admin isolation (platform admins on root domain only)
3. ✅ Tenant existence (does tenant record exist?)
4. ✅ Tenant status (`status = "active"`)
5. ✅ Subscription status (has `status = "active"` subscription)

**Applied to:**
- All subdomain pages (except `/login`, `/subscription-expired`, `/tenant-suspended`)
- Excludes `/api/*` routes (API has its own auth)

---

## Subscription Statuses

### Subscription.status values:
- `"active"` - Subscription is valid, user can access system ✅
- `"expired"` - Subscription has expired ❌
- `"cancelled"` - Subscription was cancelled by admin ❌
- `"trial"` - Free trial period (treated as active) ✅
- `"pending"` - Payment pending (blocked) ❌

**Only `"active"` and `"trial"` allow access.**

---

## Tenant Statuses

### Tenant.status values:
- `"active"` - Tenant is operational ✅
- `"suspended"` - Temporarily blocked (e.g., payment overdue) ❌
- `"banned"` - Permanently blocked (e.g., ToS violation) ❌
- `"inactive"` - Not yet activated ❌

**Only `"active"` allows access.**

---

## What Happens Without Subscription?

### If a tenant is created WITHOUT any subscription:

1. **Platform Admin View:**
   - ✅ Can see tenant in `/platform/tenants`
   - ✅ Can create subscription for tenant
   - ✅ Can create users for tenant

2. **Tenant User Experience:**
   - ✅ Can log in successfully
   - ❌ **Immediately redirected to `/subscription-expired`** after login
   - 🚫 Cannot access dashboard, tickets, visas, or any other pages
   - 📞 Must contact support (+252 907 700 949) to get subscription

3. **API Access:**
   - ❌ All API endpoints also respect tenant boundaries
   - ❌ API calls will fail for users without active subscriptions (if middleware-protected)

---

## Best Practices for Platform Admin

### When Creating a New Tenant:

1. **Create the tenant** via `/platform/tenants`
2. **Immediately create a subscription** via platform admin panel
3. **Set subscription status to "active"** or "trial"
4. **Create initial admin user** for the tenant
5. **Verify tenant status is "active"**

### Trial Flow:
```
1. Create tenant (status: "active")
2. Create subscription (status: "trial", trialEndsAt: 30 days from now)
3. Create tenant admin user
4. User can now access system
5. Before trial ends, convert to paid (status: "active")
```

### Production Flow:
```
1. Create tenant (status: "active")
2. Create subscription (status: "pending")
3. Create tenant admin user
4. User tries to log in → blocked with "subscription required"
5. After payment received, update subscription (status: "active")
6. User can now access system
```

---

## How to Fix "No Subscription" Issue

### Option A: Platform Admin Creates Subscription

1. Platform admin logs into `/platform`
2. Navigate to `/platform/tenants`
3. Click on the tenant
4. Create new subscription with:
   - Select subscription plan
   - Set `status = "active"`
   - Set billing cycle

### Option B: Manual Database Fix (Emergency)

```sql
-- Insert active subscription for tenant
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
  'tenant-id-here',
  'plan-id-here',
  'active',
  NOW(),
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);
```

---

## Security Implications

### Why This Design?

1. **Prevents Free Riders:** Users cannot access system without valid subscription
2. **Enforces Payment:** Natural enforcement of payment requirements
3. **Grace Period Not Auto:** Admins must manually activate trials/subscriptions
4. **Clear Communication:** Users see exact reason they're blocked and who to contact

### Edge Cases Handled:

✅ User active, no subscription → Blocked  
✅ User active, expired subscription → Blocked  
✅ User active, tenant suspended → Blocked  
✅ User active, subscription active, tenant active → Allowed  
✅ Platform admin → Always allowed (on root domain only)  

---

## Testing Checklist

- [ ] Create tenant without subscription → User blocked
- [ ] Create tenant with expired subscription → User blocked
- [ ] Create tenant with active subscription → User allowed
- [ ] Suspend tenant with active subscription → User blocked (tenant suspended message)
- [ ] Cancel subscription while user is logged in → Next page load redirects to expired page
- [ ] Platform admin cannot access tenant subdomains
- [ ] Tenant user cannot access platform admin panel

---

## Files Involved

1. `src/middleware.ts` - Main access control logic
2. `src/app/subscription-expired/page.tsx` - No subscription message
3. `src/app/tenant-suspended/page.tsx` - Tenant suspended message
4. `src/lib/auth-options.ts` - Login validation
5. `prisma/schema.prisma` - Subscription and Tenant models

---

## Summary

**Answer to original question:**

> **"The user is active but the tenant has no subscription plan at all, so what would happen?"**

**Answer:**
The user **CAN log in**, but will be **immediately redirected to `/subscription-expired`** and will be **completely blocked** from accessing any pages. They will see a message telling them to contact support at **+252 907 700 949** to activate a subscription plan. This is by design to enforce subscription requirements for SaaS access.
