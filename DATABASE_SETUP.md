# Database and Authentication Setup Guide

Your app now has a **full production-ready database and authentication system** with PostgreSQL, Prisma ORM, JWT authentication, and secure password hashing.

## 🗄️ What's Been Set Up

### 1. **PostgreSQL Database with Prisma ORM**
- Full database schema with all your app's models (Users, Companies, Inspections, etc.)
- Type-safe database queries with Prisma Client
- Automatic migrations and schema management

### 2. **Secure Authentication System**
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure session management with 7-day expiry
- **HTTP-Only Cookies**: Protection against XSS attacks
- **Protected Routes**: tRPC middleware for authenticated endpoints

### 3. **Authentication Endpoints**
All available via tRPC at `/api/trpc/auth.*`:
- `auth.registerCompany` - Register a new company with owner account
- `auth.joinCompany` - Join existing company with code
- `auth.login` - Login with email/password
- `auth.logout` - Logout and clear session
- `auth.me` - Get current authenticated user

## 📋 Setup Instructions

### Step 1: Install PostgreSQL

**Option A: Local PostgreSQL**
```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

**Option B: Cloud Database (Recommended for Production)**
- [Supabase](https://supabase.com/) - Free tier available
- [Railway](https://railway.app/) - Free tier available
- [Neon](https://neon.tech/) - Serverless Postgres
- [Amazon RDS](https://aws.amazon.com/rds/)

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE checkmate_db;

# Create user (optional)
CREATE USER checkmate_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE checkmate_db TO checkmate_user;

# Exit
\q
```

### Step 3: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Update `.env` with your database credentials:
```env
# For local database:
DATABASE_URL="postgresql://checkmate_user:your_secure_password@localhost:5432/checkmate_db?schema=public"

# For cloud database (example with Supabase):
DATABASE_URL="postgresql://user:password@db.xxx.supabase.co:5432/postgres"

# Generate a secure JWT secret (use a password generator):
JWT_SECRET="your-super-secret-random-string-min-32-characters"

NODE_ENV="development"
```

### Step 4: Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### Step 5: Start Your App

```bash
bun run start
```

## 🔐 Security Features

### Password Security
- Passwords are hashed with bcrypt (12 rounds)
- Never stored in plain text
- Salted automatically by bcrypt

### Token Security
- JWT tokens with 7-day expiration
- Stored in HTTP-only cookies (web)
- Sent in Authorization header (mobile)
- Automatically refreshed on API calls

### Database Security
- Parameterized queries (SQL injection protection)
- Row-level security can be added
- Encrypted connections in production

## 📊 Database Models

Your database includes these main tables:
- **User** - User accounts with authentication
- **Company** - Company/organization data
- **UserCompany** - Many-to-many relationship
- **Project** - Project management
- **Equipment** - Equipment tracking
- **PlantInspection** - Plant inspection records
- **QuickHitchInspection** - Quick hitch inspections
- **VehicleInspection** - Vehicle inspections
- **BucketChangeInspection** - Bucket change records
- **PositiveIntervention** - Safety interventions
- **Notification** - System notifications
- **HolidayRequest** - Holiday/vacation requests
- **Ticket** - Task/ticket system
- **EquipmentReport** - Equipment issue reports
- And many more...

## 🔄 Migrating from AsyncStorage

Your app currently uses AsyncStorage. To migrate to the database:

### Option 1: Keep Both (Recommended for Testing)
- Test the new backend authentication
- Keep AsyncStorage as fallback
- Gradually migrate users

### Option 2: Full Migration
1. Export data from AsyncStorage
2. Create migration script to import into PostgreSQL
3. Update all frontend code to use tRPC
4. Remove AsyncStorage dependencies

## 📱 Using Authentication in Your App

### Login Example
```typescript
import { trpc } from '@/lib/trpc';

const loginMutation = trpc.auth.login.useMutation();

const handleLogin = async (email: string, password: string) => {
  try {
    const result = await loginMutation.mutateAsync({
      email,
      password,
    });
    
    // Store token in AsyncStorage for mobile
    await AsyncStorage.setItem('auth_token', result.token);
    
    // Navigate to app
    router.replace('/(tabs)');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Protected Route Example
```typescript
// In your tRPC route file
import { protectedProcedure } from '../create-context';

export const getMyInspections = protectedProcedure
  .query(async ({ ctx }) => {
    // ctx.user is automatically available and type-safe
    const inspections = await ctx.prisma.plantInspection.findMany({
      where: { employeeId: ctx.user.id },
    });
    
    return inspections;
  });
```

## 🧪 Testing the Setup

### Test Registration
```bash
curl -X POST http://localhost:3000/api/trpc/auth.registerCompany \
  -H "Content-Type: application/json" \
  -d '{
    "ownerName": "Test Owner",
    "companyName": "Test Company",
    "companyEmail": "company@test.com",
    "personalEmail": "owner@test.com",
    "password": "testpass123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "testpass123"
  }'
```

## 🚀 Production Checklist

Before deploying to production:

- [ ] Use a strong, randomly generated JWT_SECRET
- [ ] Use a managed PostgreSQL service (not local)
- [ ] Enable SSL for database connections
- [ ] Set NODE_ENV=production
- [ ] Enable CORS only for your domains
- [ ] Set up database backups
- [ ] Monitor database performance
- [ ] Implement rate limiting
- [ ] Add logging and error tracking
- [ ] Set up SSL certificates for your API

## 📚 Prisma Commands Reference

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format
```

## 🔧 Troubleshooting

### "Can't reach database server"
- Check PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Verify DATABASE_URL in .env
- Check firewall settings

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Migration failed"
```bash
# Check migration status
npx prisma migrate status

# Fix by resetting (WARNING: deletes data)
npx prisma migrate reset
```

### "JWT verification failed"
- Check JWT_SECRET matches between requests
- Token may have expired (7 day limit)
- User needs to login again

## 📖 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) - Decode and verify JWTs
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [tRPC Documentation](https://trpc.io/docs)

## 🎯 Next Steps

1. Set up your PostgreSQL database
2. Run migrations to create tables
3. Test authentication endpoints
4. Update your frontend to use the new auth system
5. Migrate existing data from AsyncStorage
6. Deploy to production!

---

**Need Help?** Check the troubleshooting section or reach out for support.
