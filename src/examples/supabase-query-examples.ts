/**
 * Supabase Query Examples
 * 
 * This file demonstrates how to use the Supabase client and SQL utilities
 * to perform common database operations.
 */

import { supabase } from "../config/supabase";
import { executeSQL, listTables, getTableSchema } from "../utils/supabase-sql";

// Example 1: Basic Supabase query using the client
async function getUsers() {
  try {
    // Using the Supabase client directly
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    console.log("Users:", data);
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
}

// Example 2: Using raw SQL for a complex query
async function getUsersWithProfiles() {
  try {
    // Using the SQL utility for a more complex join
    const { data, error } = await executeSQL(`
      SELECT 
        u.id, 
        u.email, 
        p.first_name, 
        p.last_name,
        p.avatar_url
      FROM 
        users u
      LEFT JOIN 
        profiles p ON u.id = p.user_id
      ORDER BY 
        u.created_at DESC
      LIMIT 10
    `);
    
    if (error) throw error;
    console.log("Users with profiles:", data);
    return data;
  } catch (error) {
    console.error("Error fetching users with profiles:", error);
    return null;
  }
}

// Example 3: Parameterized query with the SQL utility
async function searchUsersByEmail(emailPattern: string) {
  try {
    // Using parameters to prevent SQL injection
    const { data, error } = await executeSQL(
      `SELECT id, email FROM users WHERE email ILIKE $1 LIMIT 5`,
      [`%${emailPattern}%`]
    );
    
    if (error) throw error;
    console.log(`Users matching '${emailPattern}':", data);
    return data;
  } catch (error) {
    console.error("Error searching users:", error);
    return null;
  }
}

// Example 4: Explore database schema
async function exploreDatabase() {
  try {
    // List all tables
    const { tables, error: tablesError } = await listTables();
    if (tablesError) throw tablesError;
    
    console.log("Available tables:", tables);
    
    // For each table, get its schema
    for (const table of tables) {
      const { data: columns, error: schemaError } = await getTableSchema(table);
      if (schemaError) throw schemaError;
      
      console.log(`\nSchema for '${table}':`);
      columns?.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}`);
      });
    }
    
    return { tables, schemas: {} }; // You could build a complete schema map here
  } catch (error) {
    console.error("Error exploring database:", error);
    return null;
  }
}

// Example 5: Insert data with the Supabase client
async function createUser(email: string, password: string) {
  try {
    // First create the auth user
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    
    // Then create a profile for the user
    if (authUser?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authUser.user.id,
          first_name: '',
          last_name: '',
          avatar_url: '',
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
      console.log("User created successfully:", {
        id: authUser.user.id,
        email: authUser.user.email,
        profile
      });
      
      return { user: authUser.user, profile };
    }
    
    return null;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

// Run examples
async function runExamples() {
  console.log("\n=== Running Supabase Query Examples ===\n");
  
  // Uncomment the examples you want to run
  // await getUsers();
  // await getUsersWithProfiles();
  // await searchUsersByEmail('example');
  // await exploreDatabase();
  // await createUser('test@example.com', 'password123');
  
  console.log("\n=== Examples completed ===\n");
}

// Uncomment to run the examples
// runExamples();