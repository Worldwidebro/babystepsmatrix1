#!/bin/bash

# Test GitHub webhook integration with Supabase
# This script sends a test webhook event to your Supabase project

echo "Testing GitHub webhook integration with Supabase..."

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not set."
  echo "Please set it with: export SUPABASE_ACCESS_TOKEN=your_token"
  exit 1
fi

# Project ID from your Supabase URL
PROJECT_ID="oobqauxgqnvdqocnibiz"

# Send test webhook event
echo "Sending test webhook event to Supabase project: $PROJECT_ID"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_ID/github/webhook" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"push"}')

# Check response
if [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 201 ] || [ "$RESPONSE" -eq 204 ]; then
  echo "✅ Success! Webhook test completed successfully."
  echo "Check your Supabase dashboard for deployment status:"
  echo "https://supabase.com/dashboard/project/$PROJECT_ID/deployments"
else
  echo "❌ Error: Webhook test failed with HTTP status $RESPONSE."
  echo "Please check your access token and try again."
  exit 1
fi

echo ""
echo "To complete the GitHub integration setup:"
echo "1. Ensure you've added SUPABASE_ACCESS_TOKEN to your GitHub repository secrets"
echo "2. Make a small change and push to your repository to trigger the workflow"
echo "3. Check the GitHub Actions tab to monitor the deployment process"