# Backend Fix Instructions

## Issue
The backend server is not starting, causing TRPC errors (Status 408: "Server did not start").

## Root Cause
The backend Prisma schema (`backend/prisma/schema.prisma`) was out of sync with the main schema and missing all required models.

## What Was Fixed
1. ✅ Updated `backend/prisma/schema.prisma` to match the complete schema from `prisma/schema.prisma`
2. ✅ Added all missing models (Company, Project, Equipment, SiteDiary, ProjectNote, InspectionTestForm, etc.)

## Next Steps to Complete the Fix

### 1. Generate Prisma Client
Run this command in your terminal:
```bash
cd backend
npx prisma generate
cd ..
```

### 2. Push Database Schema
If you have a fresh database, run:
```bash
cd backend
npx prisma db push
cd ..
```

If you already have data, you might want to create a migration instead:
```bash
cd backend
npx prisma migrate dev --name sync_schema
cd ..
```

### 3. Start the App
The app should use `rork start` to launch both the frontend and backend together. Make sure you're running:
```bash
npm start
```
or
```bash
rork start
```

### 4. Verify Backend is Running
Once started, you should see:
- No more "Server did not start" errors
- TRPC calls should work
- Registration and login should function properly

### 5. Environment Variables
Ensure your `.env` file has:
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://u54wvrddq5zpukiksxhwh.rork.live
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/checkmate"
JWT_SECRET="your-secret-key-change-in-production"
```

## Verification Checklist
- [ ] Run `cd backend && npx prisma generate`
- [ ] Run `cd backend && npx prisma db push` (or migrate)
- [ ] Start app with `rork start` or `npm start`
- [ ] Test company registration
- [ ] Test employee login
- [ ] Verify ITF management works

## Common Issues

### Issue: "Module not found" errors
**Solution**: Run `npm install` in both root and backend directories

### Issue: Database connection errors
**Solution**: Verify your DATABASE_URL in `.env` points to a valid PostgreSQL database

### Issue: Still getting 404 errors
**Solution**: 
1. Check that EXPO_PUBLIC_RORK_API_BASE_URL is set correctly
2. Verify the backend is actually running (check console logs)
3. Clear Metro cache: `npx expo start --clear`
