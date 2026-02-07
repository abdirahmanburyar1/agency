# Branch Finance Implementation

## Overview

Branch Finance allows each branch to have its own finance user who sees only payments relevant to their location. This is implemented using the `payments.view_all` permission and user `locationId`.

## How It Works

1. **Permissions**
   - `payments.view` — Can view payments (required for any payment access)
   - `payments.view_all` — Can view all payments across all locations (central finance)
   - Branch Finance role has `payments.view` only (no `payments.view_all`)

2. **User Setup**
   - Assign the user the **Branch Finance** role
   - Set the user's **Location** (and optionally Branch) in Admin → Users → Edit
   - Users without `locationId` set will see no cargo payments when restricted

3. **Filtering Logic**
   - **Admin** or users with `payments.view_all`: see all payments
   - **Branch Finance** (has `payments.view` but not `payments.view_all`) with `locationId`: see only cargo payments whose shipment’s source or destination is in their location
   - Non-cargo payments (tickets, visas, haj) are currently visible to all users with `payments.view`; location filtering applies to cargo payments only

4. **Where It Applies**
   - Main Payments list (`/payments`)
   - Payment detail page (`/payments/[id]`)
   - Payment receipt page
   - All payment-related API routes

## Setup Checklist

- [ ] Run `npx prisma db seed` to create Branch Finance role and `payments.view_all` permission
- [ ] Create/edit users: assign Branch Finance role and set their Location
- [ ] Ensure Location and Branch records exist (Admin → Settings or seed)
- [ ] Finance (central) role should include `payments.view` + `payments.view_all` to see all payments

## Cargo Report (Branch Users)

For users with a branch or location assigned (Cargo Section, Branch Finance, etc.), the **Cargo Report** shows only shipments **sent from** their branch:

- User with **branchId**: shipments where `sourceBranchId` = their branch
- User with **locationId** only: shipments where source is in their location
- Admin or `cargo.view_all`: all shipments

Assign both Location and Branch to branch users for accurate filtering.

## Cargo Section vs Branch Finance

- **Cargo Section**: Cargo ops only; no Payments main page. View payment only from cargo detail.
- **Branch Finance**: Full Payments page; sees only cargo payments for their location. No `payments.view_all`.
