/**
 * Maps Supabase error codes to appropriate HTTP status codes
 */
export function getHttpStatusFromSupabaseError(error: unknown): number {
  const err = error as { code?: string };
  if (!err?.code) return 500;
  
  // PostgreSQL error codes mapping
  switch (err.code) {
    // Insufficient privilege - Row Level Security violation
    case '42501':
      return 403; // Forbidden
      
    // Unique violation
    case '23505':
      return 409; // Conflict
      
    // Foreign key violation
    case '23503':
      return 400; // Bad Request
      
    // Check constraint violation
    case '23514':
      return 400; // Bad Request
      
    // Not null violation
    case '23502':
      return 400; // Bad Request
      
    // Invalid text representation
    case '22P02':
      return 400; // Bad Request
      
    // No rows returned
    case 'PGRST116':
      return 404; // Not Found
      
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Formats Supabase errors for user-friendly messages
 */
export function formatSupabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  
  const err = error as { code?: string; message?: string };
  
  // If error has a message, return it
  if (err.message) {
    // Clean up common PostgreSQL error patterns
    if (err.message.includes('duplicate key value violates unique constraint')) {
      return 'This record already exists';
    }
    if (err.message.includes('violates foreign key constraint')) {
      return 'Related record not found';
    }
    if (err.message.includes('violates check constraint')) {
      return 'Invalid value provided';
    }
    if (err.message.includes('null value in column')) {
      return 'Required field is missing';
    }
    if (err.message.includes('permission denied')) {
      return 'You do not have permission to perform this action';
    }
    
    return err.message;
  }
  
  // Fallback to error code descriptions
  switch (err.code) {
    case '42501':
      return 'You do not have permission to perform this action';
    case '23505':
      return 'This record already exists';
    case '23503':
      return 'Related record not found';
    case '23514':
      return 'Invalid value provided';
    case '23502':
      return 'Required field is missing';
    case '22P02':
      return 'Invalid format provided';
    case 'PGRST116':
      return 'Record not found';
    default:
      return 'An unexpected error occurred';
  }
}
