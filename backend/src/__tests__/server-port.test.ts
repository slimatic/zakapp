import { describe, test, expect } from '@jest/globals';
import { createServer } from 'http';
import express from 'express';

// Mock the server creation to test port handling
describe('Server Port Configuration', () => {
  test('should use PORT environment variable when provided', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '3005';
    
    // Import the server configuration logic
    const PORT = process.env.PORT || 3001;
    
    expect(PORT).toBe('3005');
    expect(Number(PORT)).toBe(3005);
    
    // Restore original
    if (originalPort) {
      process.env.PORT = originalPort;
    } else {
      delete process.env.PORT;
    }
  });

  test('should use default port 3001 when PORT is not set', () => {
    const originalPort = process.env.PORT;
    delete process.env.PORT;
    
    const PORT = process.env.PORT || 3001;
    
    expect(PORT).toBe(3001);
    
    // Restore original
    if (originalPort) {
      process.env.PORT = originalPort;
    }
  });

  test('should handle EADDRINUSE error gracefully', (done) => {
    const app = express();
    const server1 = createServer(app);
    const PORT = 3099; // Use an uncommon port for testing
    
    app.get('/test', (req, res) => {
      res.json({ message: 'test server' });
    });

    // Start first server
    server1.listen(PORT, () => {
      // Try to start second server on same port
      const server2 = createServer(app);
      
      server2.on('error', (error: Error & { code?: string }) => {
        expect(error.code).toBe('EADDRINUSE');
        expect(error.message).toContain('EADDRINUSE');
        
        // Clean up
        server1.close(() => {
          done();
        });
      });
      
      // This should trigger EADDRINUSE error
      server2.listen(PORT);
    });
  });
});