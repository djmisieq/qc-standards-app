#!/bin/bash

# Emergency startup - no Docker, minimal resources
echo "🚨 Emergency Start - No Docker"
echo "=============================="

# Kill everything
pkill -f python || true
pkill -f node || true

# Backend only
cd backend
echo "Installing minimal deps..."
pip install fastapi uvicorn sqlmodel psycopg2-binary python-jose passlib

echo "Starting backend..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1

# Access at: http://localhost:8000/api/docs
