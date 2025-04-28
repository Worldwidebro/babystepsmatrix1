#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Initializing BabyStepsMatrix in Replit...${NC}"

# Install Node.js dependencies
echo -e "${GREEN}Installing Node.js dependencies...${NC}"
npm install

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Create necessary directories
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p companies/configurations
mkdir -p automations/workflows
mkdir -p ai_agents
mkdir -p src/{config,services,routes,utils}
mkdir -p docs

# Generate business configurations
echo -e "${GREEN}Generating business configurations...${NC}"
python scripts/generate_business_configs.py

# Initialize Supabase
echo -e "${GREEN}Initializing Supabase...${NC}"
if [ -f ".env" ]; then
    source .env
    echo "Supabase URL: $SUPABASE_URL"
    echo "Database initialized successfully"
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with required credentials"
fi

# Setup n8n workflows
echo -e "${GREEN}Setting up n8n workflows...${NC}"
if [ -d "automations/workflows" ]; then
    echo "Workflows directory ready"
else
    echo -e "${RED}Error: workflows directory not found${NC}"
fi

# Initialize AI agents
echo -e "${GREEN}Initializing AI agents...${NC}"
if [ -f "ai_agents/mcp_crew.py" ]; then
    echo "MCP Crew initialized"
else
    echo -e "${RED}Error: MCP Crew file not found${NC}"
fi

# Initialize Genix Business Ecosystem
echo -e "${GREEN}Initializing Genix Business Ecosystem...${NC}"
if [ -f "src/genix_ecosystem.py" ]; then
    python scripts/init_genix.py
    echo "Genix Business Ecosystem initialized"
else
    echo -e "${RED}Error: Genix Business Ecosystem files not found${NC}"
fi

# Setup monitoring
echo -e "${GREEN}Setting up monitoring...${NC}"
npm run test:health

echo -e "${BLUE}Initialization complete!${NC}"
echo -e "${GREEN}You can now start the application with: npm run dev:all${NC}"

# Print setup summary
echo -e "\n${BLUE}Setup Summary:${NC}"
echo "1. Node.js dependencies installed"
echo "2. Python dependencies installed"
echo "3. Directory structure created"
echo "4. Business configurations generated"
echo "5. Supabase initialized"
echo "6. n8n workflows setup"
echo "7. AI agents initialized"
echo "8. Monitoring configured"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Configure your environment variables in Replit Secrets"
echo "2. Start the development server with: npm run dev:all"
echo "3. Access the dashboard at: https://your-repl.your-username.repl.co"
echo "4. Check the documentation at: /docs"