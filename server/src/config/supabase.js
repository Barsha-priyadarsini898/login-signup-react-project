import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
let isConfigured = false;

// Check if valid-looking URL and key are provided
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    isConfigured = true;
    console.log('⚡ Supabase client initialized with endpoint:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not fully configured. Using intelligent persistent local database fallback.');
}

/**
 * Tests connection to Supabase database and checks if the 'users' table is available.
 */
export async function testSupabaseConnection() {
  if (!supabase || !isConfigured) {
    return {
      connected: false,
      mode: 'local_storage',
      message: 'Supabase URL/Key not configured in .env. Running on local persistent fallback datastore.',
      url: supabaseUrl || null
    };
  }

  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') { // table does not exist
        return {
          connected: true,
          tableExists: false,
          mode: 'supabase_table_missing',
          message: 'Connected to Supabase, but the "users" table was not found. Please run schema.sql in Supabase SQL editor!',
          url: supabaseUrl
        };
      }
      return {
        connected: false,
        mode: 'supabase_error',
        message: `Supabase error: ${error.message} (${error.code || 'unknown'})`,
        url: supabaseUrl
      };
    }

    return {
      connected: true,
      tableExists: true,
      mode: 'supabase_live',
      message: 'Successfully connected to Supabase PostgreSQL database!',
      url: supabaseUrl
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'error',
      message: err.message,
      url: supabaseUrl
    };
  }
}

export { supabase, isConfigured };
