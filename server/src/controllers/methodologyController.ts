import { Request, Response } from 'express';
import { MethodologyConfigService } from '../services/methodologyConfigService';
import { CreateMethodologyConfig, UpdateMethodologyConfig } from '@zakapp/shared';
import { AppError } from '../middleware/ErrorHandler';

const methodologyService = new MethodologyConfigService();

/**
 * Handle service errors consistently
 */
const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message
    });
  }

  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  res.status(500).json({
    success: false,
    error: 'METHODOLOGY_ERROR',
    message
  });
};

/**
 * Get all methodologies available to the authenticated user
 * Returns both fixed methodologies and user's custom configurations
 */
export const getMethodologies = async (req: Request & { userId: string }, res: Response) => {
  try {
    const methodologies = await methodologyService.getMethodologies(req.userId);

    res.json({
      success: true,
      fixed: methodologies.fixed,
      custom: methodologies.custom
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get a specific methodology configuration
 */
export const getMethodology = async (req: Request & { userId: string }, res: Response) => {
  try {
    const { id } = req.params;
    const methodology = await methodologyService.getMethodology(req.userId, id);

    res.json({
      success: true,
      methodology
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Update a methodology configuration
 * Only custom methodologies can be updated
 */
export const updateMethodology = async (req: Request & { userId: string }, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateMethodologyConfig = req.body;

    const methodology = await methodologyService.updateMethodology(req.userId, id, updates);

    res.json({
      success: true,
      methodology
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Create a custom methodology configuration
 */
export const createCustomMethodology = async (req: Request & { userId: string }, res: Response) => {
  try {
    const config: CreateMethodologyConfig = req.body;

    const methodology = await methodologyService.createCustomMethodology(req.userId, config);

    res.status(201).json({
      success: true,
      methodology
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Delete a custom methodology configuration
 */
export const deleteCustomMethodology = async (req: Request & { userId: string }, res: Response) => {
  try {
    const { id } = req.params;

    await methodologyService.deleteCustomMethodology(req.userId, id);

    res.json({
      success: true,
      message: 'Custom methodology deleted successfully'
    });
  } catch (error) {
    handleError(error, res);
  }
};