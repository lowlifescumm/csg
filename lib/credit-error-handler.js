/**
 * Helper function to format credit consumption errors for API responses
 */

export function formatCreditError(creditResult) {
  if (creditResult.message === 'insufficient_credits') {
    return {
      error: 'Insufficient credits',
      details: `This requires ${creditResult.cost} credits. You have ${creditResult.available_balance || 0} credits available.`,
      cost: creditResult.cost,
      available_balance: creditResult.available_balance,
      required: creditResult.required,
      status: 402
    };
  }
  
  // Other processing failures
  return {
    error: 'Credit processing failed',
    details: creditResult.message || 'Unable to process credit transaction',
    cost: creditResult.cost,
    error_code: creditResult.error_code,
    status: 500
  };
}


