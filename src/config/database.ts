import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Postgres connection pool for direct access
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For development, use proper SSL in production
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Supabase client for high-level operations and RLS
export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// Multi-tenancy configuration
export const MultiTenancy = {
  // Schema-based isolation
  createTenantSchema: async (tenantId: string) => {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");

      // Create schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS tenant_${tenantId}`);

      // Create tenant-specific tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS tenant_${tenantId}.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          encrypted_password TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tenant_${tenantId}.audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES tenant_${tenantId}.users(id),
          action TEXT NOT NULL,
          details JSONB,
          ip_address TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tenant_${tenantId}.transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES tenant_${tenantId}.users(id),
          amount DECIMAL NOT NULL,
          currency TEXT NOT NULL,
          status TEXT NOT NULL,
          type TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Set up Row Level Security
      await client.query(`
        ALTER TABLE tenant_${tenantId}.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tenant_${tenantId}.audit_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tenant_${tenantId}.transactions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY tenant_isolation_users ON tenant_${tenantId}.users
          USING (current_user = 'service_role' OR current_user = '${tenantId}');

        CREATE POLICY tenant_isolation_audit ON tenant_${tenantId}.audit_logs
          USING (current_user = 'service_role' OR current_user = '${tenantId}');

        CREATE POLICY tenant_isolation_transactions ON tenant_${tenantId}.transactions
          USING (current_user = 'service_role' OR current_user = '${tenantId}');
      `);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Connection management
  getTenantConnection: async (tenantId: string) => {
    return {
      pool: pgPool,
      schema: `tenant_${tenantId}`,
      supabase: supabase,
    };
  },

  // Backup configuration
  backup: {
    frequency: "daily",
    retention: "90days",
    location: process.env.BACKUP_LOCATION || "backblaze",
  },

  // High availability configuration
  highAvailability: {
    enabled: true,
    readReplicas: parseInt(process.env.READ_REPLICAS || "2"),
    failoverStrategy: "automatic",
  },

  // Monitoring and alerts
  monitoring: {
    enabled: true,
    metrics: ["connections", "queries", "locks", "deadlocks"],
    alertThresholds: {
      connectionUtilization: 80,
      queryDuration: 1000,
      deadlocks: 5,
    },
  },
};

// Error handling and connection management
pgPool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Closing pool...");
  try {
    await pgPool.end();
    console.log("Pool has ended");
    process.exit(0);
  } catch (err) {
    console.error("Error during pool shutdown", err);
    process.exit(-1);
  }
});
