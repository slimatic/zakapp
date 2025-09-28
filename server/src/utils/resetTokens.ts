// Simple reset token management for testing
const resetTokens = new Map<string, { userId: string, email: string, expiresAt: number }>();
const usedResetTokens = new Set<string>(); // Track used tokens separately

// Export function to invalidate user tokens
export function invalidateUserResetTokens(userId: string): void {
  const tokensToDelete = [];
  for (const [token, data] of resetTokens.entries()) {
    if (data.userId === userId) {
      tokensToDelete.push(token);
    }
  }
  tokensToDelete.forEach(token => {
    resetTokens.delete(token);
    usedResetTokens.delete(token);
  });
}

// For testing - store the last generated token
let lastResetToken: string = '';

export function generateResetToken(userId: string, email: string, customExpirationMs?: number): string {
  const token = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = customExpirationMs ? 
    (Date.now() + customExpirationMs) : 
    (Date.now() + (15 * 60 * 1000)); // Default 15 minutes
  
  resetTokens.set(token, { userId, email, expiresAt });
  lastResetToken = token; // Store for testing
  return token;
}

// For testing - create an already expired token
export function generateExpiredResetToken(userId: string, email: string): string {
  return generateResetToken(userId, email, -1000); // Expired 1 second ago
}

export function getLastResetToken(): string {
  return lastResetToken;
}

export function validateResetToken(token: string): { userId: string, email: string } | null {
  // Check if token was already used
  if (usedResetTokens.has(token)) {
    throw new Error('TOKEN_USED');
  }

  const tokenData = resetTokens.get(token);
  if (!tokenData) {
    return null; // Invalid token
  }
  
  if (Date.now() > tokenData.expiresAt) {
    resetTokens.delete(token);
    throw new Error('TOKEN_EXPIRED'); // Explicitly throw for expired tokens
  }
  
  return tokenData;
}

export function useResetToken(token: string): void {
  usedResetTokens.add(token); // Mark as used but don't remove from main store yet
  resetTokens.delete(token); // Remove from active tokens
}

export function clearResetTokens(): void {
  resetTokens.clear();
  usedResetTokens.clear();
  lastResetToken = '';
}