#!/bin/bash

# 🚀 Deployment Script for babystepsmatrix1
# Billionaire Consciousness Empire

set -e

echo "🚀 Deploying babystepsmatrix1..."

# Build and start services
docker-compose up -d --build

# Wait for services to be ready
sleep 10

# Health check
echo "🔍 Running health checks..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo "✅ babystepsmatrix1 deployed successfully!"
echo "🌐 Access: http://localhost:3000"
