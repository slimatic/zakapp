import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('GET /api/assets/:id', () => {
  let accessToken: string;
  let userId: string;
  let assetId: string;
  let otherUserToken: string;
  let otherUserAssetId: string;

  beforeEach(async () => {
    // Register and login first user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'getasset@example.com',
        password: 'SecurePassword123!',
        username: 'getassetuser'
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'getasset@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;

    // Create test asset for first user
    const assetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'CASH',
        name: 'Test Asset',
        value: 5000.00,
        currency: 'USD',
        description: 'Test asset description'
      });

    assetId = assetResponse.body.asset.id;

    // Create second user and asset for authorization testing
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        password: 'SecurePassword123!',
        username: 'otheruser'
      });

    const otherLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'other@example.com',
        password: 'SecurePassword123!'
      });

    otherUserToken = otherLoginResponse.body.accessToken;

    const otherAssetResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        type: 'GOLD',
        name: 'Other User Asset',
        value: 3000.00,
        currency: 'USD',
        weight: 50.0,
        unit: 'GRAM'
      });

    otherUserAssetId = otherAssetResponse.body.asset.id;
  });

  it('should return asset details for valid asset ID and owner', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.asset).toHaveProperty('id', assetId);
    expect(response.body.asset).toHaveProperty('type', 'CASH');
    expect(response.body.asset).toHaveProperty('name', 'Test Asset');
    expect(response.body.asset).toHaveProperty('value', 5000.00);
    expect(response.body.asset).toHaveProperty('currency', 'USD');
    expect(response.body.asset).toHaveProperty('description', 'Test asset description');
    expect(response.body.asset).toHaveProperty('userId', userId);
    expect(response.body.asset).toHaveProperty('isZakatable');
    expect(response.body.asset).toHaveProperty('createdAt');
    expect(response.body.asset).toHaveProperty('updatedAt');
  });

  it('should return decrypted sensitive data for asset owner', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const asset = response.body.asset;
    
    // Verify data is properly decrypted
    expect(asset.name).toBe('Test Asset');
    expect(typeof asset.name).toBe('string');
    expect(asset.name).not.toMatch(/^[a-f0-9]+$/); // Not encrypted hex
    
    expect(asset.description).toBe('Test asset description');
    expect(typeof asset.description).toBe('string');
    expect(asset.description).not.toMatch(/^[a-f0-9]+$/);
  });

  it('should return 404 for non-existent asset ID', async () => {
    const fakeId = 'non-existent-id-12345';
    
    const response = await request(app)
      .get(`/api/assets/${fakeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'ASSET_NOT_FOUND');
    expect(response.body).toHaveProperty('message', 'Asset not found');
  });

  it('should return 403 for asset owned by different user', async () => {
    const response = await request(app)
      .get(`/api/assets/${otherUserAssetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'ACCESS_DENIED');
    expect(response.body).toHaveProperty('message', 'Access denied to this asset');
  });

  it('should return 401 for missing authentication', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'NO_TOKEN');
  });

  it('should return 401 for invalid access token', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
  });

  it('should return 400 for invalid asset ID format', async () => {
    const invalidId = 'invalid-id-format!@#';
    
    const response = await request(app)
      .get(`/api/assets/${invalidId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('message', 'Invalid asset ID format');
  });

  it('should include asset history and snapshots', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.asset).toHaveProperty('snapshots');
    expect(response.body.asset.snapshots).toBeInstanceOf(Array);
    
    // Should include history metadata
    expect(response.body.asset).toHaveProperty('lastUpdated');
    expect(response.body.asset).toHaveProperty('valueHistory');
    expect(response.body.asset.valueHistory).toBeInstanceOf(Array);
  });

  it('should include Zakat calculation context for zakatable assets', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const asset = response.body.asset;
    
    if (asset.isZakatable) {
      expect(response.body).toHaveProperty('zakatContext');
      expect(response.body.zakatContext).toHaveProperty('nisabThreshold');
      expect(response.body.zakatContext).toHaveProperty('zakatRate');
      expect(response.body.zakatContext).toHaveProperty('eligibleAmount');
    }
  });

  it('should handle concurrent access gracefully', async () => {
    const promises = Array(5).fill(null).map(() =>
      request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
    );

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.asset).toHaveProperty('id', assetId);
    });
  });

  it('should log asset access for security audit', async () => {
    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    
    // Access should be logged internally (not exposed in response)
    expect(response.headers).toHaveProperty('x-audit-id');
    expect(typeof response.headers['x-audit-id']).toBe('string');
  });
});