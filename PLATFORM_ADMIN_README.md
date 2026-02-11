# Platform Admin Guide

## Overview
This is a multi-tenant SaaS platform where:
- **Root domain** (`fayohealthtech.so`) = Platform Admin Portal
- **Subdomains** (`tenant.fayohealthtech.so`) = Individual client applications

## Architecture

### Domain Structure
```
fayohealthtech.so              → Platform Admin (manage all tenants)
├── acme.fayohealthtech.so     → ACME client app
├── daybah.fayohealthtech.so   → Daybah client app
└── [any-tenant].fayohealthtech.so → Auto-works with wildcard DNS
```

### DNS Configuration (Vercel)
- Root domain: `fayohealthtech.so`
- Wildcard domain: `*.fayohealthtech.so`
- Nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

## Platform Admin Features

### 1. Tenant Management (`/platform/tenants`)
- **View all tenants** with subscription status
- **Create new tenants** with subdomain
- **Suspend/Ban tenants** as needed
- Click subdomain to view full tenant details

### 2. Tenant Detail Page (`/platform/tenants/[id]`)

#### Stats Dashboard
- Users, Customers, Tickets, Visas, Bookings, Payments

#### Subscription Management
- **View current plan** (Starter, Professional, Enterprise)
- **Change plans** via dropdown
- **Activate/Suspend** subscriptions
- **Trial management** with countdown
- Features list per plan

#### Billing History
- Invoice numbers and amounts
- Payment status tracking
- Due dates and paid dates
- **Mark payments as paid** button

#### User Management
- **Create admin users** for any tenant
- **Edit users** (name, email, password, status)
- **Delete users**
- **Random password generator**
- View all users with roles

#### Client Information
- Contact details (name, email, phone)
- Company information (address, city, country)
- Tax ID and business type
- Website URL
- Internal notes

## Subscription Plans

### Starter - $29.99/month
- 5 users, 10GB storage
- 14-day trial
- Basic reporting, Email support
- Mobile app access

### Professional - $79.99/month
- 20 users, 50GB storage
- 14-day trial
- Advanced analytics, Priority support
- API access, Custom branding
- Multi-currency support

### Enterprise - $199.99/month
- Unlimited users & storage
- 30-day trial, $499 setup fee
- Dedicated account manager
- 24/7 support, SLA guarantee
- Custom integrations, Training

## Creating a New Tenant

### Step 1: Create Tenant
1. Go to `/platform/tenants`
2. Click **"Create tenant"**
3. Enter subdomain (e.g., `acme`)
4. Enter company name (e.g., `ACME Corp`)
5. Submit

Result: `acme.fayohealthtech.so` is immediately accessible!

### Step 2: Assign Subscription
1. Click the tenant subdomain to open detail page
2. Click **"Create Subscription"** (if no subscription)
3. Select a plan (Starter, Professional, Enterprise)
4. Submit

Result: Tenant gets a trial subscription automatically!

### Step 3: Create Admin User
1. On tenant detail page, find "Users" section
2. Click **"Create Admin User"**
3. Fill in:
   - Name: `John Doe`
   - Email: `admin@acme.com`
   - Click **"Generate"** for secure password OR enter custom password
   - Confirm password
4. Submit

Result: Alert shows credentials (SAVE THEM!)

### Step 4: Test Login
1. Visit `https://acme.fayohealthtech.so`
2. Login with the created credentials
3. User has full admin access!

## Troubleshooting

### Login Issues

If users can't login, check:

1. **User exists and is active**:
   ```bash
   npx tsx prisma/test-user-login.ts email@example.com password123 tenantId
   ```

2. **Correct tenant ID**:
   - Login page auto-detects tenant from subdomain
   - Platform admins can login at root domain

3. **Password correct**:
   - Case-sensitive
   - No extra spaces
   - Test script shows if password matches

4. **User has role with permissions**:
   - Admin role should be auto-created
   - Check in Users list on tenant detail page

### Common Issues

**"Invalid email or password"**
- Email is case-insensitive (stored lowercase)
- Password is case-sensitive
- Check user exists for correct tenant
- Run test script to verify

**"Subdomain not working"**
- Check DNS propagation: https://www.whatsmydns.net
- Verify wildcard SSL in Vercel
- Wait 5-15 minutes after adding wildcard domain

**"User can login but has no permissions"**
- Role might not have permissions assigned
- Admin role should have all permissions
- Check role in Users table

## API Endpoints

### Platform Admin Only
```
POST   /api/platform/tenants                    Create tenant
GET    /api/platform/tenants/[id]               Get tenant details
PATCH  /api/platform/tenants/[id]               Update tenant info

POST   /api/platform/tenants/[id]/users         Create admin user
GET    /api/platform/tenants/[id]/users         List users
PATCH  /api/platform/tenants/[id]/users/[userId] Edit user
DELETE /api/platform/tenants/[id]/users/[userId] Delete user

GET    /api/platform/subscription-plans         List plans
POST   /api/platform/subscriptions              Create subscription
PATCH  /api/platform/subscriptions/[id]         Update subscription
DELETE /api/platform/subscriptions/[id]         Delete subscription

GET    /api/platform/subscription-payments      List payments
POST   /api/platform/subscription-payments      Create payment
PATCH  /api/platform/subscription-payments/[id] Mark paid/update
```

## Database Schema

### Key Models
- `Tenant` - Client companies with subdomains
- `User` - Users per tenant (with `tenantId`)
- `Subscription` - Active subscriptions per tenant
- `SubscriptionPlan` - Pricing tiers
- `SubscriptionPayment` - Billing history
- `Role` - User roles per tenant
- `Permission` - System permissions

### Tenant Isolation
All data is scoped by `tenantId`:
- Users can only see their tenant's data
- Platform admins can see all tenants
- Compound unique keys: `@@unique([tenantId, field])`

## Platform Admin Credentials

### Creating Platform Admin
Run this script to create a platform admin:
```bash
npx tsx prisma/create-platform-admin.ts
```

This creates a user with:
- `isPlatformAdmin: true`
- `tenantId: null` (no tenant association)
- Access to `/platform` routes
- Can view/manage all tenants

### Login
- URL: `https://fayohealthtech.so/login`
- Use platform admin credentials
- Redirects to `/platform` after login

## Seeding Data

### Subscription Plans
```bash
npx prisma db seed
```

This creates:
- 3 subscription plans (Starter, Professional, Enterprise)
- Trial subscriptions for existing tenants without subscriptions

### Initial Setup
```bash
# 1. Run migrations
npx prisma migrate deploy

# 2. Seed plans
npx prisma db seed

# 3. Create platform admin
npx tsx prisma/create-platform-admin.ts

# 4. Start dev server
npm run dev
```

## Development

### Local Testing with Subdomains

Edit `hosts` file (`C:\Windows\System32\drivers\etc\hosts` on Windows):
```
127.0.0.1 fayohealthtech.so
127.0.0.1 acme.fayohealthtech.so
127.0.0.1 daybah.fayohealthtech.so
```

Then access:
- `http://fayohealthtech.so:3000` - Platform admin
- `http://acme.fayohealthtech.so:3000` - ACME tenant
- `http://daybah.fayohealthtech.so:3000` - Daybah tenant

### Environment Variables
```
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_DOMAIN=fayohealthtech.so
```

## Production Checklist

- [x] Vercel nameservers configured
- [x] Wildcard domain `*.fayohealthtech.so` added
- [x] SSL certificate generated
- [x] Database migrations applied
- [x] Subscription plans seeded
- [x] Platform admin created
- [ ] Test tenant creation
- [ ] Test admin user creation
- [ ] Test user login per tenant
- [ ] Test subscription management

## Support

For issues:
1. Check this README
2. Run test scripts (test-user-login.ts)
3. Check browser console for errors
4. Check Vercel logs for API errors
5. Verify DNS propagation
