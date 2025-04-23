# Supabase PostgreSQL Connection Guide

This guide explains how to connect to and use your Supabase PostgreSQL database in this project.

## Connection Setup

The project is already configured to connect to your Supabase project (`oobqauxgqnvdqocnibiz`). The connection is established through the `supabase` client in `src/config/supabase.ts`.

## Testing the Connection

To verify your connection is working properly:

```bash
# Run the connection test script
node -r ts-node/register src/test-connection.ts
```

This script will:

1. Test authentication with Supabase
2. Test database queries
3. Display connection details
4. Check environment variables
5. Provide access instructions for SQL Editor and Table Editor

## SQL Utilities

We've created SQL utility functions in `src/utils/supabase-sql.ts` to make database interactions easier:

```typescript
// Example: Execute a custom SQL query
import { executeSQL } from "./utils/supabase-sql";

async function getUsersWithProfiles() {
  const { data, error } = await executeSQL(`
    SELECT u.id, u.email, p.first_name, p.last_name 
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE p.is_active = true
  `);

  if (error) console.error("Query error:", error);
  return data;
}
```

### Available SQL Utilities

- `executeSQL(query, params)`: Run raw SQL queries with parameters
- `listTables()`: Get all tables in your database
- `getTableSchema(tableName)`: Get column information for a table
- `createMigration(name, upSql, downSql)`: Create a database migration

## Setting Up SQL Functions

Before using the SQL utilities, you need to set up the required functions in your Supabase project:

```bash
# Run the setup script
node -r ts-node/register src/scripts/setup-supabase-functions.ts
```

This script creates necessary SQL functions in your Supabase project to support advanced SQL operations.

## Accessing Supabase Dashboard

### SQL Editor

Access the SQL Editor at: https://supabase.com/dashboard/project/oobqauxgqnvdqocnibiz/sql

Use this for:

- Running complex queries
- Creating tables and indexes
- Setting up Row Level Security policies
- Creating database functions

### Table Editor

Access the Table Editor at: https://supabase.com/dashboard/project/oobqauxgqnvdqocnibiz/editor

Use this for:

- Viewing and editing table data
- Creating and modifying tables visually
- Setting up relationships between tables
- Managing Row Level Security policies

## Environment Variables

For production use, make sure to set these environment variables:

```
SUPABASE_URL=https://oobqauxgqnvdqocnibiz.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for admin operations)
SUPABASE_DB_URL=postgresql://postgres:password@db.oobqauxgqnvdqocnibiz.supabase.co:5432/postgres (for direct DB access)
```

## Security Best Practices

1. **Never expose your service role key** in client-side code
2. **Always use Row Level Security (RLS)** to protect your data
3. **Use parameterized queries** to prevent SQL injection
4. **Set up proper authentication** for all database operations
