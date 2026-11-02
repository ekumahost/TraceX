#!/bin/bash
# TraceX AI - Push to GitHub Script
# Built by Okokoh Benjamin for Meta AI Developer Hackathon 2026
# https://cerebralvalley.ai/e/meta-ai-developer-hackathon
# Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence.

echo "TraceX AI - GitHub Push Script by Okokoh Benjamin"
echo "AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence."
echo "Built for https://cerebralvalley.ai/e/meta-ai-developer-hackathon"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo "Git not installed. Install git first."
  exit 1
fi

# Initialize if not already git repo
if [ ! -d ".git" ]; then
  echo "Initializing git repo..."
  git init
fi

# Rename gitignore.txt to .gitignore if exists
if [ -f "gitignore.txt" ]; then
  mv gitignore.txt .gitignore
  echo "Renamed gitignore.txt to .gitignore"
fi

# Generate architecture.png if generator exists
if [ -f "docs/generate-architecture.js" ]; then
  echo "Generating architecture.png..."
  cd docs && node generate-architecture.js && cd ..
else
  echo "Note: Download architecture.png from Meta AI chat and place in docs/architecture.png"
fi

# Generate package.json files
if [ -f "application/frontend/generate-package.js" ]; then
  echo "Generating frontend package.json..."
  cd application/frontend && node generate-package.js && cd ../..
fi
if [ -f "application/backend/generate-package.js" ]; then
  echo "Generating backend package.json..."
  cd application/backend && node generate-package.js && cd ../..
fi

# Check for Modal, Fireworks, Baseten setup
echo ""
echo "Checking Partner Tools Setup..."
if command -v modal &> /dev/null; then
  echo "Modal CLI found - you can deploy analysis engine with: cd application/analysis-engine && modal deploy modal_app.py"
else
  echo "Modal CLI not found - install with: pip install modal && modal setup"
fi

if [ -z "$FIREWORKS_API_KEY" ]; then
  echo "FIREWORKS_API_KEY not set - get $25 credits from fireworks.ai and set in .env"
fi
if [ -z "$BASETEN_API_KEY" ]; then
  echo "BASETEN_API_KEY not set - get $100 + 2M TPM from baseten.co and set in .env"
fi
if [ -z "$MODAL_TOKEN_ID" ]; then
  echo "Modal token not set - run modal setup after pip install modal"
fi

echo ""
echo "Creating .env.example for all partner tools..."
cat > .env.example << 'EOF'
# Blockchain Data
ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY

# Meta AI - $150 credits
META_MODEL_API_KEY=YOUR_META_API_KEY

# Fireworks AI - $25 credits + workshop - Fastest inference 160 tok/s
FIREWORKS_API_KEY=fw_your_key_here

# Baseten - $100 + 2M TPM - Dedicated deployment
BASETEN_API_KEY=your_baseten_key
BASETEN_MODEL_ID=abcd1234

# Modal - $100 credits - Serverless Python
MODAL_TOKEN_ID=your_modal_token_id
MODAL_TOKEN_SECRET=your_modal_token_secret

# Backend
PYTHON_ENGINE_URL=http://localhost:8000
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo ".env.example created with all partner keys"

echo ""
echo "Adding files..."
git add .

echo "Committing..."
git commit -m "TraceX AI by Okokoh Benjamin - AI-powered blockchain forensics for Meta AI Developer Hackathon 2026 - https://cerebralvalley.ai/e/meta-ai-developer-hackathon - Built with Llama, Muse Spark, Fireworks, Modal, Baseten"

echo ""
echo "=== PUSH INSTRUCTIONS FOR OKOKOH BENJAMIN ==="
echo "Current remote:"
git remote -v
echo ""
echo "To push to ekumahost/TraceX (your account):"
echo "git remote remove origin 2>/dev/null; git remote add origin https://github.com/ekumahost/TraceX.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "If you get 403 Permission denied to farmgrid-blockchain:"
echo "1. Open Keychain Access -> search github.com -> delete entries"
echo "2. Generate PAT at https://github.com/settings/tokens/new (check repo)"
echo "3. Use: git remote set-url origin https://ekumahost:YOUR_PAT@github.com/ekumahost/TraceX.git"
echo "4. git push -u origin main"
echo "5. Then: git remote set-url origin https://github.com/ekumahost/TraceX.git (remove token)"
echo ""
echo "Repo description to set on GitHub:"
echo "AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for Meta AI Developer Hackathon 2026 https://cerebralvalley.ai/e/meta-ai-developer-hackathon by Okokoh Benjamin - Built with Llama, Fireworks, Modal, Baseten"
echo ""
echo "To deploy Modal analysis engine:"
echo "cd application/analysis-engine && pip install modal && modal setup && modal deploy modal_app.py"
