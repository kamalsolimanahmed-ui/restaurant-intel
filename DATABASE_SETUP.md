# Database + Auth Setup

## Prerequisites

1. Install PostgreSQL locally or use a cloud provider (Railway, Supabase, Neon)
2. Create a database named `restaurant_intel`

## Environment Variables

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_intel"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

## Database Schema

### 5 Tables Created:

1. **restaurants** - Restaurant information
   - `id`, `name`, `country`, `currency`, `createdAt`

2. **users** - User accounts with auth
   - `id`, `email`, `password` (hashed), `restaurantId`, `trialEndsAt`, `subscribed`

3. **uploads** - File upload records
   - `id`, `restaurantId`, `fileName`, `fileType`, `periodStart`, `periodEnd`

4. **analyses** - Analysis results
   - `id`, `restaurantId`, `uploadId`, `healthScore`, `laborPct`, `primeCostPct`
   - `worstDay`, `insight`, `action`, `savings`, `severity`, `pdfUrl`

5. **financial_data** - Raw financial data rows
   - `id`, `restaurantId`, `uploadId`, `date`, `revenue`, `laborCost`
   - `laborHours`, `expenseAmount`, `expenseCategory`

## Run Migrations

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (optional)
npx prisma studio
```

## API Routes

### Auth Endpoints:
- `POST /api/auth/signup` - Create user + restaurant
- `POST /api/auth/[...nextauth]` - NextAuth (login/session)
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/logout` - Clear session

### Business Logic Endpoints:
- `POST /api/parse` - Parse CSV/Excel files
- `POST /api/rules` - Calculate health score and metrics
- `POST /api/insights` - Generate insight paragraphs
- `POST /api/pdf` - Generate PDF reports

## Features

✅ Prisma ORM with PostgreSQL
✅ NextAuth with Credentials provider
✅ Password hashing with bcryptjs
✅ JWT sessions
✅ 14-day trial tracking
✅ Subscription status
✅ Foreign key relationships
✅ Transaction support for signup
