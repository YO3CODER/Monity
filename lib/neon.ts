// lib/neon.ts
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Client Neon simple
export const sql = neon(process.env.DATABASE_URL);

// Version avec logging pour le développement
export async function query<T>(
  strings: TemplateStringsArray, 
  ...params: (string | number | boolean | null)[]
): Promise<T[]> {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 SQL:', strings.join('?'), params);
  }
  
  try {
    const result = await sql(strings, ...params);
    return result as T[];
  } catch (error) {
    console.error('❌ Erreur SQL:', {
      query: strings.join('?'),
      params,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export default sql;