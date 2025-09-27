import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('DELETE /api/assets/:id', () => {
  let accessToken: string;
  let assetId: string;

  beforeEach(async () => {
    // Register and login
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'deleteasset@example.com',
        password: 'SecurePassword123!',
        username: 'deleteassetuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'deleteasset@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;

    // Create test asset
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'CASH',
        name: 'Asset to Delete',
        value: 1000.00,
        currency: 'USD'
      });

    assetId = assetResponse.body.asset.id;
  });

  it('should delete asset with valid ID and ownership', async () => {
    const response = await request(app)
      .delete(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Asset deleted successfully');
  });

  it('should return 404 when trying to access deleted asset', async () => {
    // Delete asset
    await request(app)
      .delete(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Try to access deleted asset
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'ASSET_NOT_FOUND');
  });

  it('should return 404 for non-existent asset', async () => {
    const response = await request(app)
      .delete('/api/assets/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'ASSET_NOT_FOUND');
  });

  it('should return 401 for missing authentication', async () => {
    const response = await request(app)
      .delete(`/api/assets/${assetId}`)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'NO_TOKEN');
  });
});