import { Pool } from 'pg';

// Create a new pool using the connection string from your environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;