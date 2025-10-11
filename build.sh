#!/bin/bash
# Build script for Render deployment
echo "🚀 Starting Note App build process..."
echo "📁 Current directory: $(pwd)"
echo "📋 Contents: $(ls -la)"
echo "📦 Installing dependencies..."
npm install
echo "✅ Build completed successfully!"
echo "🎯 Ready for deployment on Render!"
