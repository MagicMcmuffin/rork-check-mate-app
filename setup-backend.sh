#!/bin/bash

# Backend Setup Script
# This script generates the Prisma client and syncs the database

echo "🔧 Setting up backend..."

# Navigate to backend directory
cd backend

echo "📦 Installing backend dependencies..."
npm install

echo "🔨 Generating Prisma client..."
npx prisma generate

echo "🗄️  Syncing database schema..."
npx prisma db push --accept-data-loss

echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the app with: npm start (or rork start)"
echo "2. Test registration at /company-register"
echo "3. Check that TRPC calls work"

cd ..
