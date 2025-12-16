export const looksEncrypted = (s?: string | null): boolean => {
  if (!s || typeof s !== 'string') return false;
  const match = s.match(/([A-Za-z0-9+/=]{12,})(?:[:.\|;]{1,2}=?)([A-Za-z0-9+/=]{12,})/);
  return Boolean(match);
};
