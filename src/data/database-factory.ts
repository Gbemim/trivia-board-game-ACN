import { DatabaseProvider } from './database-interface';
import { PostgreSQLProvider } from './postgresql';

export type DatabaseType = 'supabase' | 'postgresql';

export class DatabaseFactory {
  static createProvider(type?: DatabaseType): DatabaseProvider {
    const dbType = type || (process.env.DATABASE_TYPE as DatabaseType) || 'supabase';
    
    switch (dbType) {
      case 'postgresql':
        return new PostgreSQLProvider();
      case 'supabase':
      default:
        // Dynamic import to avoid loading Supabase when using PostgreSQL
        const { SupabaseProvider } = require('./supabase-provider');
        return new SupabaseProvider();
    }
  }
}

// Export the default database instance
export const database = DatabaseFactory.createProvider();
