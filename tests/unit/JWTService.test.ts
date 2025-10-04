import { JWTService, jwtService } from '../../server/src/services/JWTService';

describe('Implementation Task T024: JWT Service', () => {
  let jwtServiceInstance: JWTService;

  beforeEach(() => {
    jwtServiceInstance = new JWTService();
  });

  describe('Token Creation', () => {
    test('should create access token with user information', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read', 'write']
      };

      const token = jwtServiceInstance.createAccessToken(userInfo);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    test('should create refresh token', () => {
      const userId = 'test-user-123';
      const token = jwtServiceInstance.createRefreshToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should create token pair', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com'
      };

      const tokenPair = jwtServiceInstance.createTokenPair(userInfo);
      
      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('expiresIn');
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
    });
  });

  describe('Token Verification', () => {
    test('should verify valid access token', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      };

      const token = jwtServiceInstance.createAccessToken(userInfo);
      const decoded = jwtServiceInstance.verifyAccessToken(token);

      expect(decoded.userId).toBe(userInfo.userId);
      expect(decoded.email).toBe(userInfo.email);
      expect(decoded.role).toBe(userInfo.role);
      expect(decoded.permissions).toEqual(userInfo.permissions);
      expect(decoded.type).toBe('access');
    });

    test('should verify valid refresh token', () => {
      const userId = 'test-user-123';
      const token = jwtServiceInstance.createRefreshToken(userId);
      const decoded = jwtServiceInstance.verifyRefreshToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
      expect(decoded.nonce).toBeDefined();
    });

    test('should throw error for invalid access token', () => {
      expect(() => {
        jwtServiceInstance.verifyAccessToken('invalid.token.here');
      }).toThrow(/Invalid access token/);
    });

    test('should throw error for invalid refresh token', () => {
      expect(() => {
        jwtServiceInstance.verifyRefreshToken('invalid.token.here');
      }).toThrow(/Invalid refresh token/);
    });

    test('should throw error for wrong token type', () => {
      const userId = 'test-user-123';
      const refreshToken = jwtServiceInstance.createRefreshToken(userId);

      expect(() => {
        jwtServiceInstance.verifyAccessToken(refreshToken);
      }).toThrow(/Invalid/); // Accept any error containing "Invalid"
    });
  });

  describe('Token Refresh', () => {
    test('should refresh access token with valid refresh token', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read']
      };

      const refreshToken = jwtServiceInstance.createRefreshToken(userInfo.userId);
      const refreshResult = jwtServiceInstance.refreshAccessToken(refreshToken, {
        email: userInfo.email,
        role: userInfo.role,
        permissions: userInfo.permissions
      });

      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult).toHaveProperty('expiresIn');
      
      const decoded = jwtServiceInstance.verifyAccessToken(refreshResult.accessToken);
      expect(decoded.userId).toBe(userInfo.userId);
      expect(decoded.email).toBe(userInfo.email);
    });

    test('should throw error when refreshing with invalid token', () => {
      expect(() => {
        jwtServiceInstance.refreshAccessToken('invalid.token', {
          email: 'test@example.com'
        });
      }).toThrow(/Token refresh failed/);
    });
  });

  describe('Header Extraction', () => {
    test('should extract token from valid authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const authHeader = `Bearer ${token}`;
      
      const extracted = jwtServiceInstance.extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    test('should throw error for missing authorization header', () => {
      expect(() => {
        jwtServiceInstance.extractTokenFromHeader('');
      }).toThrow(/Authorization header missing/);
    });

    test('should throw error for invalid header format', () => {
      expect(() => {
        jwtServiceInstance.extractTokenFromHeader('InvalidFormat token');
      }).toThrow(/Invalid authorization header format/);
    });
  });

  describe('Token Utilities', () => {
    test('should decode token without verification', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com'
      };

      const token = jwtServiceInstance.createAccessToken(userInfo);
      const decoded = jwtServiceInstance.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userInfo.userId);
      expect(decoded.email).toBe(userInfo.email);
    });

    test('should check if token is expired', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com'
      };

      const token = jwtServiceInstance.createAccessToken(userInfo);
      const isExpired = jwtServiceInstance.isTokenExpired(token);
      
      expect(isExpired).toBe(false);
    });

    test('should get token expiration time', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com'
      };

      const token = jwtServiceInstance.createAccessToken(userInfo);
      const expiration = jwtServiceInstance.getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    test('should return null for invalid token expiration', () => {
      const expiration = jwtServiceInstance.getTokenExpiration('invalid.token');
      expect(expiration).toBeNull();
    });
  });

  describe('Configuration Validation', () => {
    test('should validate JWT configuration', () => {
      const isValid = jwtServiceInstance.validateConfiguration();
      expect(isValid).toBe(true);
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(jwtService).toBeDefined();
      expect(jwtService).toBeInstanceOf(JWTService);
    });

    test('should work with singleton instance', () => {
      const userInfo = {
        userId: 'test-user-456',
        email: 'singleton@example.com'
      };

      const token = jwtService.createAccessToken(userInfo);
      const decoded = jwtService.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(userInfo.userId);
      expect(decoded.email).toBe(userInfo.email);
    });
  });

  describe('Security Features', () => {
    test('should generate different tokens for same user', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com'
      };

      const token1 = jwtServiceInstance.createAccessToken(userInfo);
      const token2 = jwtServiceInstance.createAccessToken(userInfo);
      
      expect(token1).not.toBe(token2);
    });

    test('should generate refresh tokens with unique nonces', () => {
      const userId = 'test-user-123';
      
      const token1 = jwtServiceInstance.createRefreshToken(userId);
      const token2 = jwtServiceInstance.createRefreshToken(userId);
      
      const decoded1 = jwtServiceInstance.verifyRefreshToken(token1);
      const decoded2 = jwtServiceInstance.verifyRefreshToken(token2);
      
      expect(decoded1.nonce).not.toBe(decoded2.nonce);
    });

    test('should include proper JWT claims', () => {
      const userInfo = {
        userId: 'test-user-123',
        email: 'test@example.com'
      };

      const token = jwtServiceInstance.createAccessToken(userInfo);
      const decoded = jwtServiceInstance.verifyAccessToken(token);

      expect(decoded.iss).toBe('zakapp');
      expect(decoded.aud).toBe('zakapp-users');
      expect(decoded.sub).toBe(userInfo.userId);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed tokens gracefully', () => {
      expect(() => {
        jwtServiceInstance.verifyAccessToken('not.a.jwt');
      }).toThrow(/Invalid access token/);
    });

    test('should provide meaningful error messages', () => {
      expect(() => {
        jwtServiceInstance.verifyAccessToken('');
      }).toThrow(/Invalid access token/);
      
      expect(() => {
        jwtServiceInstance.extractTokenFromHeader('');
      }).toThrow(/Authorization header missing/);
    });
  });
});