/**
 * Supabase SQL Utilities
 *
 * This file provides helper functions for working with SQL in Supabase,
 * making it easier to execute queries and manage database operations.
 */

import { supabase } from "../config/supabase";

/**
 * Execute a raw SQL query with optional parameters
 * @param query SQL query string with optional placeholders
 * @param params Parameters to replace placeholders in the query
 * @returns Query result
 */
export async function executeSQL<T = any>(query: string, params?: any[]) {
  try {
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: query,
      query_params: params || [],
    });

    if (error) throw error;
    return { data: data as T[], error: null };
  } catch (error: any) {
    console.error("SQL query error:", error);
    return { data: null, error };
  }
}

/**
 * Get a list of all tables in the public schema
 * @returns Array of table names
 */
export async function listTables() {
  try {
    const { data, error } = await supabase
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public");

    if (error) throw error;
    return {
      tables: data.map((row) => row.tablename),
      error: null,
    };
  } catch (error: any) {
    console.error("Error listing tables:", error);
    return { tables: [], error };
  }
}

/**
 * Get table schema information
 * @param tableName Name of the table to inspect
 * @returns Column information for the table
 */
export async function getTableSchema(tableName: string) {
  const query = `
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM 
      information_schema.columns
    WHERE 
      table_schema = 'public' AND 
      table_name = $1
    ORDER BY 
      ordinal_position
  `;

  return executeSQL(query, [tableName]);
}

/**
 * Create a simple database migration
 * @param migrationName Name of the migration
 * @param sqlUp SQL to run for the migration
 * @param sqlDown SQL to run when rolling back the migration
 */
export async function createMigration(
  migrationName: string,
  sqlUp: string,
  sqlDown: string
) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const migrationId = `${timestamp}_${migrationName}`;

  // This would typically write to a migrations folder
  console.log(`Migration ${migrationId} created`);
  console.log("Up SQL:", sqlUp);
  console.log("Down SQL:", sqlDown);

  // In a real implementation, this would write to files
  return {
    id: migrationId,
    upSql: sqlUp,
    downSql: sqlDown,
  };
}
