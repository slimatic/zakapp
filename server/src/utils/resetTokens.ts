// Simple reset token management for testing
const resetTokens = new Map<string, { userId: string, email: string, expiresAt: number }>();

// For testing - store the last generated token
let lastResetToken: string = '';

export function generateResetToken(userId: string, email: string): string {
  const token = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
  
  resetTokens.set(token, { userId, email, expiresAt });
  lastResetToken = token; // Store for testing
  return token;
}

export function getLastResetToken(): string {
  return lastResetToken;
}

export function validateResetToken(token: string): { userId: string, email: string } | null {
  const tokenData = resetTokens.get(token);
  if (!tokenData) {
    return null;
  }
  
  if (Date.now() > tokenData.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  
  return tokenData;
}

export function useResetToken(token: string): void {
  resetTokens.delete(token);
}

export function clearResetTokens(): void {
  resetTokens.clear();
  lastResetToken = '';
}