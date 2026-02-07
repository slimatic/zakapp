import { PrismaClient } from '@prisma/client';
import { runHawlDetectionJob } from '../../src/jobs/hawlDetectionJob';
import { NisabCalculationService } from '../../src/services/nisabCalculationService';
import { HawlTrackingService } from '../../src/services/hawlTrackingService';
import { WealthAggregationService } from '../../src/services/wealthAggregationService';
import { NisabYearRecordService } from '../../src/services/nisabYearRecordService';
import { AuditTrailService } from '../../src/services/auditTrailService';
import request from 'supertest';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('Integration: Hawl Detection & Reconciliation Job', () => {
    let authToken: string;
    let userId: string;
    
    // Services
    const nisabCalcService = new NisabCalculationService();
    const hawlTrackingService = new HawlTrackingService();
    const wealthAggService = new WealthAggregationService();
    const nisabYearRecordService = new NisabYearRecordService();
    const auditTrailService = new AuditTrailService();

    beforeAll(async () => {
        // Register user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: `jobtest-${Date.now()}@example.com`,
                password: 'TestPass123!',
                confirmPassword: 'TestPass123!',
                firstName: 'Job',
                lastName: 'Test',
            });
        
        authToken = registerResponse.body.data.tokens.accessToken;
        userId = registerResponse.body.data.user.id;
    });

    afterAll(async () => {
        await prisma.yearlySnapshot.deleteMany({ where: { userId } });
        await prisma.asset.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await prisma.yearlySnapshot.deleteMany({ where: { userId } });
        await prisma.asset.deleteMany({ where: { userId } });
    });

    it('should reconcile wealth drift in DRAFT records', async () => {
        // 1. Create a wealth record via API (ensures user has wealth)
        await request(app)
            .post('/api/assets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Cash',
                category: 'cash',
                value: 10000,
                currency: 'USD',
                acquisitionDate: new Date(),
            });

        // 2. Create a DRAFT record with INCORRECT wealth manually
        await prisma.yearlySnapshot.create({
            data: {
                userId: userId,
                status: 'DRAFT',
                nisabBasis: 'GOLD',
                nisabThreshold: '5000',
                nisabType: 'gold',
                calculationDate: new Date(),
                gregorianYear: new Date().getFullYear(),
                gregorianMonth: new Date().getMonth() + 1,
                gregorianDay: new Date().getDate(),
                hijriYear: 0,
                hijriMonth: 0,
                hijriDay: 0,
                totalWealth: '0',
                totalLiabilities: '0',
                zakatableWealth: '5000', // Drift! Actual is 10000
                zakatAmount: '0',
                methodologyUsed: 'standard',
                assetBreakdown: '{}',
                calculationDetails: '{}',
            } as any
        });

        // 3. Run the job
        const result = await runHawlDetectionJob(
            prisma,
            nisabCalcService,
            hawlTrackingService,
            wealthAggService,
            nisabYearRecordService,
            auditTrailService
        );

        // 4. Assert reconciliation
        expect(result.reconciledRecords).toBeGreaterThan(0);
        
        const updatedRecord = await prisma.yearlySnapshot.findFirst({
            where: { userId, status: 'DRAFT' }
        });
        
        expect(updatedRecord).toBeDefined();
        // Allow floating point precision issues by checking closeness
        expect(Number(updatedRecord!.zakatableWealth)).toBeCloseTo(10000);
    });

    it('should detect missed Nisab achievement (Safety Net)', async () => {
        // 1. Create wealth above Nisab
        await request(app)
            .post('/api/assets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Gold',
                category: 'gold',
                value: 7000, // Above typical gold nisab
                currency: 'USD',
                acquisitionDate: new Date(),
            });

        // 2. Ensure NO record exists (simulating missed real-time trigger)
        // (API creates one, so we delete it)
        await prisma.yearlySnapshot.deleteMany({ where: { userId } });

        // 3. Run Job
        const result = await runHawlDetectionJob(
            prisma,
            nisabCalcService,
            hawlTrackingService,
            wealthAggService,
            nisabYearRecordService,
            auditTrailService
        );

        // 4. Assert creation
        expect(result.nisabAchievements).toBeGreaterThan(0);
        
        const newRecord = await prisma.yearlySnapshot.findFirst({
            where: { userId, status: 'DRAFT' }
        });
        expect(newRecord).toBeDefined();
        expect(Number(newRecord!.zakatableWealth)).toBeCloseTo(7000);
    });
});
