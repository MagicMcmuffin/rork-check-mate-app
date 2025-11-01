# 🔍 Verification & Testing Guide

After running the setup, use this checklist to verify everything works.

## ✅ Pre-Flight Checks

### 1. Environment Variables
Check your `.env` file has:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://u54wvrddq5zpukiksxhwh.rork.live
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/checkmate"
JWT_SECRET="your-secret-key-change-in-production"
```

### 2. Database Running
Verify PostgreSQL is running:
```bash
# Test database connection
psql -h localhost -U postgres -d checkmate -c "SELECT version();"
```

### 3. Dependencies Installed
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### 4. Prisma Client Generated
```bash
cd backend && npx prisma generate && cd ..
```

### 5. Database Schema Synced
```bash
cd backend && npx prisma db push && cd ..
```

## 🧪 Testing Sequence

### Test 1: Backend Server Starts
```bash
npm start
# or
rork start
```

**Expected**: 
- No "Server did not start" errors
- App loads past splash screen
- Console shows backend is running

**If fails**: Check DATABASE_URL and ensure PostgreSQL is running

---

### Test 2: Company Registration
1. Navigate to `/company-register`
2. Fill in:
   - Company Name: "Test Construction Ltd"
   - Company Code: "TEST001"
   - Email: "admin@testco.com"
   - Owner Name: "John Smith"
   - Password: "Test123!"
   - Confirm Password: "Test123!"
3. Submit

**Expected**: 
- ✅ Success message
- ✅ Redirected to dashboard or login
- ✅ No TRPC errors in console

**If fails**: Check console for specific error and verify Prisma schema

---

### Test 3: Employee Login
1. Navigate to `/login`
2. Enter credentials from registration
3. Submit

**Expected**:
- ✅ Logged in successfully
- ✅ Token stored in AsyncStorage
- ✅ User data loaded
- ✅ Can access protected routes

**If fails**: Check JWT_SECRET in .env and verify User model

---

### Test 4: ITF Management
1. Go to Company tab
2. Find "Inspection Test Forms (ITFs)" section
3. Click to view

**Expected**:
- ✅ ITF list loads
- ✅ Can seed 26 ITF templates
- ✅ Can create new ITF records
- ✅ Can filter by trade/status
- ✅ Can search by code/title

**If fails**: Check backend route `backend/trpc/routes/itf/`

---

### Test 5: Site Diary
1. Go to Projects tab or Site Diary section
2. Try creating a new site diary entry

**Expected**:
- ✅ Form loads
- ✅ Can save draft
- ✅ Can submit entry
- ✅ Entry appears in list

**If fails**: Check SiteDiary model and routes

---

### Test 6: Project Notes
1. Navigate to project notes section
2. Try creating a note

**Expected**:
- ✅ Can create note
- ✅ Note saves with author info
- ✅ Note appears in list

**If fails**: Check ProjectNote model and routes

---

## 🔧 Common Errors & Solutions

### Error: "Cannot find module '@prisma/client'"
```bash
cd backend
npm install @prisma/client
npx prisma generate
cd ..
```

### Error: "Invalid `prisma.user.findUnique()` invocation"
**Cause**: Schema not pushed to database

**Solution**:
```bash
cd backend
npx prisma db push --accept-data-loss
cd ..
```

### Error: "Column does not exist"
**Cause**: Database schema out of sync

**Solution**:
```bash
cd backend
npx prisma migrate reset --force
npx prisma db push
cd ..
```

### Error: "ECONNREFUSED ::1:5432"
**Cause**: PostgreSQL not running or wrong port

**Solution**:
```bash
# Start PostgreSQL
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# Or update DATABASE_URL in .env with correct host/port
```

### Error: "relation does not exist"
**Cause**: Missing table in database

**Solution**:
```bash
cd backend
npx prisma db push --force-reset
cd ..
```

### Error: "P2025: Record to delete does not exist"
**Cause**: Trying to delete non-existent record

**Solution**: Check the record ID and ensure cascade deletes are working

---

## 📊 Database Verification

### Check Tables Exist
```bash
cd backend
npx prisma studio
# Opens GUI to browse database
```

**Should see these tables**:
- User
- Company
- UserCompany
- Project
- Equipment
- InspectionTestForm
- SiteDiary
- ProjectNote
- (and 20+ more)

### Verify Schema
```bash
cd backend
npx prisma validate
# Should show "The schema is valid"
```

### Count Records
```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.count().then(c => console.log('Users:', c)); prisma.company.count().then(c => console.log('Companies:', c));"
```

---

## 🎯 Success Criteria

✅ All 5 core tests pass  
✅ No TRPC 408 or 404 errors  
✅ No "Server did not start" messages  
✅ All 26 ITF templates can be seeded  
✅ Company registration works  
✅ Employee login works  
✅ Site Diaries can be created  
✅ Project Notes can be created  
✅ All tabs/pages load without errors  

---

## 📝 Post-Setup Tasks

Once everything works:

1. **Update JWT_SECRET** in production
   ```bash
   # Generate secure secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Configure Email** (if using forgot password)
   Update SMTP settings in `.env`

3. **Set up proper database**
   - Use managed PostgreSQL (RDS, Supabase, etc.)
   - Update DATABASE_URL
   - Run migrations

4. **Enable backups**
   ```bash
   cd backend
   npx prisma db pull > backup.sql
   ```

5. **Test on mobile devices**
   - Scan QR code
   - Test all features
   - Verify offline behavior

---

## 🆘 Still Having Issues?

1. Check all 3 fix documents:
   - `QUICK_FIX.md` - Quick commands
   - `BACKEND_FIX.md` - Detailed instructions  
   - `FIX_SUMMARY.md` - Complete overview

2. Review console logs for specific errors

3. Verify database connection:
   ```bash
   psql -h localhost -U postgres -d checkmate
   ```

4. Restart everything:
   ```bash
   # Kill all processes
   pkill -f expo
   pkill -f node
   
   # Clear caches
   rm -rf node_modules/.cache
   npx expo start --clear
   ```

5. Check Rork tunnel is active:
   ```
   https://u54wvrddq5zpukiksxhwh.rork.live
   ```

---

**Good luck! Your Check Mate app should now be fully operational! 🚀**
