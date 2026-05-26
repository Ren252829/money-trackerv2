#!/bin/bash
echo "🚀 Setting up Money Tracker..."

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Setup selesai!"
echo ""
echo "Cara menjalankan:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Buka: http://localhost:5173"
echo ""
echo "⚠️  Jangan lupa isi backend/.env dengan FONNTE_TOKEN kamu!"
