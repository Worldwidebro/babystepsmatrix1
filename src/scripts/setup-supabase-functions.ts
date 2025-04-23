/**
 * Setup Supabase SQL Functions
 *
 * This script creates necessary SQL functions in your Supabase project
 * to support advanced SQL operations from the client.
 */

import { supabase } from "../config/supabase";

async function setupSupabaseFunctions() {
  console.log("Setting up Supabase SQL functions...");

  try {
    // 1. Create execute_sql function for running parameterized queries
    console.log("\n1. Creating execute_sql function...");
    const createExecuteSqlFn = await supabase.rpc(
      "create_execute_sql_function",
      {}
    );

    if (createExecuteSqlFn.error) {
      // Function might already exist or we need to create it manually
      console.log("Creating execute_sql function manually...");

      const { error: manualError } = await supabase.auth.getSession();
      if (manualError) throw manualError;

      // Create the function with raw SQL
      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT, query_params JSONB DEFAULT '[]')
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE query_text
            INTO result;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
          END;
          $$;
        `,
      });

      if (sqlError) {
        console.log(
          "Could not create execute_sql function. You may need to run this SQL in the Supabase SQL Editor:"
        );
        console.log(`
          CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT, query_params JSONB DEFAULT '[]')
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE query_text
            INTO result;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
          END;
          $$;
        `);
      } else {
        console.log("✅ execute_sql function created successfully!");
      }
    } else {
      console.log("✅ execute_sql function created successfully!");
    }

    // 2. Create get_system_tables function
    console.log("\n2. Creating get_system_tables function...");
    const createSystemTablesFn = await supabase.rpc(
      "create_system_tables_function",
      {}
    );

    if (createSystemTablesFn.error) {
      console.log("Creating get_system_tables function manually...");

      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE OR REPLACE FUNCTION get_system_tables()
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            SELECT jsonb_agg(jsonb_build_object(
              'schema', schemaname,
              'table', tablename
            ))
            INTO result
            FROM pg_catalog.pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            LIMIT 10;
            
            RETURN result;
          END;
          $$;
        `,
      });

      if (sqlError) {
        console.log(
          "Could not create get_system_tables function. You may need to run this SQL in the Supabase SQL Editor:"
        );
        console.log(`
          CREATE OR REPLACE FUNCTION get_system_tables()
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            SELECT jsonb_agg(jsonb_build_object(
              'schema', schemaname,
              'table', tablename
            ))
            INTO result
            FROM pg_catalog.pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            LIMIT 10;
            
            RETURN result;
          END;
          $$;
        `);
      } else {
        console.log("✅ get_system_tables function created successfully!");
      }
    } else {
      console.log("✅ get_system_tables function created successfully!");
    }

    console.log("\n✅ Supabase SQL functions setup completed!");
    console.log(
      "\nYou can now use the SQL utilities in src/utils/supabase-sql.ts"
    );
    console.log(
      "Run the test-connection.ts script to verify everything is working."
    );
  } catch (error) {
    console.error("❌ Error setting up Supabase functions:", error);
    process.exit(1);
  }
}

setupSupabaseFunctions();
