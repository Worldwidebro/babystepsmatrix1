# GitHub + Supabase Integration Guide

## Overview

This guide explains how your GitHub repository is connected to your Supabase project (`oobqauxgqnvdqocnibiz`). The integration enables automatic deployment of database changes when you push to your repository.

## Current Setup

### 1. GitHub Workflow

Your repository already has a GitHub Actions workflow configured in `.github/workflows/supabase-deploy.yml`. This workflow:

- Triggers on pushes to `main` or `master` branches
- Installs the Supabase CLI
- Links to your Supabase project
- Generates migration files if needed
- Pushes database changes
- Notifies Supabase of the deployment

### 2. Environment Variables

Your project uses these environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`/`SUPABASE_ANON_KEY`: Your public Supabase API key
- `SUPABASE_SERVICE_ROLE_KEY`: Your private Supabase API key
- `SUPABASE_DB_URL`: Your database connection string

### 3. Database Migrations

Your project has a `migrations/` directory with SQL migration files that track database schema changes.

## Completing the Integration

### 1. Set Up GitHub Secret

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add a secret with name `SUPABASE_ACCESS_TOKEN`
5. For the value, create a Supabase access token:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Click on your profile icon > Access Tokens
   - Create a new token with a descriptive name
   - Copy the token and paste it as the secret value

### 2. Verify Webhook Connection

After setting up the GitHub secret, push a small change to your repository to trigger the workflow. The workflow will automatically:

1. Connect to your Supabase project
2. Generate a migration file if there are schema changes
3. Apply any pending migrations
4. Notify Supabase about the deployment

### 3. Monitor Deployments

You can monitor your deployments at:
`https://supabase.com/dashboard/project/oobqauxgqnvdqocnibiz/deployments`

## Development Workflow

1. Make changes to your database schema locally
2. Generate a migration file: `supabase db diff --linked > migrations/YYYYMMDD_description.sql`
3. Commit and push the migration file to GitHub
4. The GitHub workflow will automatically apply the changes to your Supabase project

## Testing the Connection

You can test your Supabase connection using the existing test script:

```bash
node -r ts-node/register src/test-connection.ts
```

## Security Best Practices

1. Never commit sensitive keys directly to your repository
2. Use GitHub Secrets for storing sensitive information
3. Consider using environment-specific variables for different deployment environments

## Troubleshooting

If you encounter issues with the integration:

1. Check that your `SUPABASE_ACCESS_TOKEN` is correctly set in GitHub Secrets
2. Verify that your workflow file has the correct project reference
3. Ensure your migration files are valid SQL
4. Check the GitHub Actions logs for detailed error messages

---

Your Baby Steps Matrix project now has a complete GitHub + Supabase integration with automatic deployments! 🚀
