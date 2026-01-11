/**
 * Asset Helper Functions for Integration Tests
 */

import request from 'supertest';
import app from '../../../server/src/app';

export const assetHelpers = {
  /**
   * Creates a new asset for a user
   */
  async createAsset(
    userId: string,
    assetData: {
      name: string;
      category: string;
      value: number;
      isZakatable: boolean;
      isPassiveInvestment?: boolean;
      notes?: string;
    },
    authToken: string
  ) {
    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(assetData)
      .expect(201);

    return response.body.asset;
  },

  /**
   * Updates an existing asset
   */
  async updateAsset(
    assetId: string,
    updateData: {
      name?: string;
      category?: string;
      value?: number;
      isZakatable?: boolean;
      isPassiveInvestment?: boolean;
      notes?: string;
    },
    authToken: string
  ) {
    const response = await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    return response.body.asset;
  },

  /**
   * Deletes an asset
   */
  async deleteAsset(assetId: string, authToken: string) {
    await request(app)
      .delete(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  },

  /**
   * Gets all assets for a user
   */
  async getAllAssets(authToken: string) {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    return response.body.assets;
  },
};
