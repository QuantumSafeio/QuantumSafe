import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export as nhost for compatibility with existing code
export const nhost = {
  auth: supabase.auth,
  from: (table) => supabase.from(table),
  graphql: {
    request: async (query, variables) => {
      // Simple GraphQL-like interface for compatibility
      // This is a basic implementation - you may need to adjust based on actual usage
      console.warn('GraphQL request attempted - consider migrating to Supabase REST API')
      return { data: null, error: new Error('GraphQL not supported with Supabase') }
    }
  }
}