# Baby Steps Matrix Project

## GitHub + Supabase Integration

This project is connected to Supabase project `oobqauxgqnvdqocnibiz` for database and authentication services.

### Setup Instructions

1. **Environment Variables**
   Create a `.env` file with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

2. **Database Migrations**
   - All database changes should be made through migration files in the `migrations/` directory
   - Run migrations using: `supabase db push`

3. **Development Workflow**
   - Make changes to the codebase
   - Create database migrations if needed
   - Push changes to GitHub
   - Supabase will automatically deploy changes

### Project Structure
```
.
├── migrations/          # Database migration files
├── supabase/           # Supabase configuration
│   └── config.toml     # Supabase settings
└── README.md           # This file
```

### Useful Commands

```bash
# Link to Supabase project
supabase link --project-ref oobqauxgqnvdqocnibiz

# Generate new migration
supabase db diff --linked > migrations/$(date +%Y%m%d%H%M%S)_migration.sql

# Apply migrations
supabase db push
```

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Integration Guide](https://supabase.com/docs/guides/getting-started/github)
 
