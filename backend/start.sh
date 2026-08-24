#!/bin/bash
set -e

# Wait for database to be ready (if using postgres)
# We can skip a strict wait-for-it script for Render, as Render usually handles it.

echo "Initializing database and seeding demo data..."
python seed_extended.py

echo "Starting FastAPI server..."
# Use Uvicorn with workers for production
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
