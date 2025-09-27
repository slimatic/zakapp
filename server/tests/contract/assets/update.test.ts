import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('PUT /api/assets/:id', () => {
  let accessToken: string;
  let userId: string;
  let assetId: string;

  beforeEach(async () => {
    // Register and login
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'updateasset@example.com',
        password: 'SecurePassword123!',
        username: 'updateassetuser'
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'updateasset@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;

    // Create test asset
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'CASH',
        name: 'Original Asset',
        value: 1000.00,
        currency: 'USD',
        description: 'Original description'
      });

    assetId = assetResponse.body.asset.id;
  });

  it('should update asset with valid data', async () => {
    const updateData = {
      name: 'Updated Asset Name',
      value: 2000.00,
      description: 'Updated description'
    };

    const response = await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Asset updated successfully');
    expect(response.body.asset).toHaveProperty('id', assetId);
    expect(response.body.asset).toHaveProperty('name', updateData.name);
    expect(response.body.asset).toHaveProperty('value', updateData.value);
    expect(response.body.asset).toHaveProperty('description', updateData.description);
    expect(response.body.asset).toHaveProperty('updatedAt');
  });

  it('should return 404 for non-existent asset', async () => {
    const response = await request(app)
      .put('/api/assets/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name' })
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'ASSET_NOT_FOUND');
  });

  it('should return 400 for invalid update data', async () => {
    const response = await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: -500 }) // Negative value
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should encrypt updated sensitive data', async () => {
    const updateData = {
      name: 'Confidential Updated Name',
      description: 'Sensitive updated information'
    };

    const response = await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.asset.name).toBe(updateData.name);
    expect(response.body.asset.description).toBe(updateData.description);
    // Verify no encrypted data is exposed
    expect(response.body.asset).not.toHaveProperty('encryptedName');
  });
});