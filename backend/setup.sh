#!/bin/bash
# backend/setup.sh

echo "🚀 Setting up Healthcare Appointment Scheduling System Backend"

echo "📦 Installing dependencies..."
npm install

echo "🔍 Checking MongoDB connection..."
npm run db:check

if [ $? -ne 0 ]; then
  echo "❌ MongoDB connection failed. Please make sure MongoDB is running."
  echo "📝 If using a remote MongoDB instance, update the MONGODB_URI in your .env file."
  exit 1
fi

echo "🌱 Seeding the database with initial data..."
npm run seed

if [ $? -ne 0 ]; then
  echo "❌ Database seeding failed."
  exit 1
fi

echo "🧪 Running tests to verify setup..."
npm test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please check the error messages above."
  exit 1
fi

echo "✅ Setup completed successfully!"
echo "🚀 You can now start the development server with: npm run dev"