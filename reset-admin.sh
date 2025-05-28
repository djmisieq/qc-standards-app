#!/bin/bash

# Script to reset database and create admin user
echo "🔄 Resetting QC Standards database..."

# Stop running containers
echo "📦 Stopping containers..."
docker-compose -f docker-compose.dev.yml down

# Remove database volume to start fresh
echo "🗑️  Removing database volume..."
docker-compose -f docker-compose.dev.yml down -v

# Start database container
echo "🚀 Starting database..."
docker-compose -f docker-compose.dev.yml up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run backend to initialize database and create admin user
echo "🏗️  Initializing database and creating admin user..."
cd backend
python -c "
from app.db.session import init_db
init_db()
print('✅ Database initialized with admin user')
print('📧 Admin login: admin@qcstandards.com')
print('🔑 Password: admin')
"

echo "✨ Database reset complete!"
echo ""
echo "You can now login with:"
echo "  Email: admin@qcstandards.com"
echo "  Password: admin"
echo ""
echo "To start the full application, run: start"
