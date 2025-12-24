// Type declarations for pg module
// This ensures TypeScript can find the types even if @types/pg isn't resolved correctly
declare module 'pg' {
  export * from '@types/pg';
}

