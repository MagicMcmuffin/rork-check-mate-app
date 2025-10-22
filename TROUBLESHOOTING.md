# Troubleshooting Guide

## tRPC 404 Errors

If you're seeing errors like:
```
[tRPC] Status: 404
[tRPC] Body: 404 Not Found
```

This means the tRPC backend is not accessible. Here's how to fix it:

### Solution 1: Ensure Database Schema is Up to Date

The ProjectNote model might not exist in your database yet. Run:

```bash
npx prisma db push
```

This will sync your database with the Prisma schema without creating migrations.

Alternatively, to create a proper migration:

```bash
npx prisma migrate dev --name add_project_notes
```

### Solution 2: Restart the Development Server

Make sure you're using the correct start command:

```bash
bun run start        # For mobile
bun run start-web    # For web
```

**DO NOT use** `npx expo start` as it won't start the backend server.

### Solution 3: Verify Backend URL

The app should automatically detect the backend URL. To verify it's working:

1. Check the console logs when the app starts
2. Look for lines like:
   ```
   [tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL: https://...
   [tRPC] Final tRPC URL: https://.../api/trpc
   ```

3. If you see `[tRPC] No base URL found`, the backend URL is not being set correctly

### Solution 4: Check Database Connection

Verify your database is accessible:

```bash
npx prisma db pull
```

This should succeed if your `DATABASE_URL` in `.env` is correct.

### Solution 5: Test Backend Directly

You can test if the backend is running by visiting (in your browser or with curl):

```
<your-backend-url>/api
```

This should return: `{"status":"ok","message":"API is running"}`

## Network Request Failed

If you see:
```
[tRPC] Fetch error: TypeError: Network request failed
```

This usually means:
1. The backend server is not running
2. There's a network connectivity issue
3. The URL is incorrect

**Fix**: Restart the development server with `bun run start` or `bun run start-web`.

## Still Having Issues?

1. Clear the app cache and restart:
   - Stop the dev server
   - Clear the metro bundler cache: `npx expo start -c`
   - Run `bun run start` again

2. Check if Prisma client is up to date:
   ```bash
   npx prisma generate
   ```

3. Verify all environment variables are set correctly in `.env`
