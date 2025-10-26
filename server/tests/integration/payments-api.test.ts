import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../src/app';

describe('POST /api/payments', () => {
  it('should return 404 when payments endpoint does not exist', async () => {
    const response = await request(app)
      .post('/api/payments')
      .send({})
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});