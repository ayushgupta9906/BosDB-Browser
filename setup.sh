#!/bin/bash

# BosDB Setup Script

echo "🚀 BosDB Setup Starting..."

# Check Node.js version
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check for package manager
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm found"
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    echo "✅ npm found (pnpm recommended for better performance)"
    PKG_MANAGER="npm"
    
    # Install dependencies with npm workspaces
    echo "📦 Installing dependencies with npm..."
    npm install
else
    echo "❌ No package manager found"
    exit 1
fi

# Set up environment file
if [ ! -f .env.local ]; then
    echo "🔐 Creating .env.local from example..."
    cp .env.example .env.local
    
    # Generate a random encryption key
    RANDOM_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    # Update the encryption key
    if command -v openssl &> /dev/null || [ -f /dev/urandom ]; then
        sed -i "s/your-secure-master-key-here-change-in-production/$RANDOM_KEY/" .env.local 2>/dev/null || \
        sed -i '' "s/your-secure-master-key-here-change-in-production/$RANDOM_KEY/" .env.local
        echo "✅ Generated encryption key in .env.local"
    else
        echo "⚠️  Please manually set ENCRYPTION_MASTER_KEY in .env.local"
    fi
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review .env.local and update ENCRYPTION_MASTER_KEY if needed"
echo "  2. Start test database: docker-compose up -d"
echo "  3. Run dev server: $PKG_MANAGER dev"
echo ""
