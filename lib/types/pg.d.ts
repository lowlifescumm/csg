// Type declarations for pg module
// This ensures TypeScript can find the types even if @types/pg isn't resolved correctly
// If @types/pg is installed, it will be used automatically
// Otherwise, this provides a minimal fallback
declare module 'pg' {
  export class Pool {
    constructor(config?: {
      connectionString?: string;
      ssl?: boolean | { rejectUnauthorized?: boolean };
      [key: string]: any;
    });
    connect(): Promise<any>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
    on(event: string, callback: Function): void;
  }
  
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    [key: string]: any;
  }
}

