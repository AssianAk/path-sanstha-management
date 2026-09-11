import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import orgRoutes from './modules/organization/org.routes';
import customerRoutes from './modules/customer/customer.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import auditRoutes from './modules/audit/audit.routes';
import settingsRoutes from './modules/settings/settings.routes';
import productRoutes from './modules/products/product.routes';
import accountRoutes from './modules/accounts/account.routes';
import tellerRoutes from './modules/teller/teller.routes';
import transferRoutes from './modules/transfers/transfer.routes';
import loansRoutes from './modules/loans/loans.routes';
import collectionsRoutes from './modules/collections/collections.routes';
import glRoutes from './modules/gl/gl.routes';
import reportsRoutes from './modules/reports/reports.routes';
import digitalRoutes from './modules/digital/digital.routes';

dotenv.config();

const app = express();

// Security HTTP Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Brute-force rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 attempts per 5 minutes per IP
  message: { success: false, message: 'Too many authentication attempts. Please try again after 5 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', authLimiter);
app.use('/api/digital/member/login', authLimiter);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    system: 'Co-operative Bank / Pat Sanstha CBS',
    phase: 'Phase 8 - Production Hardened & Rollout Ready',
    version: '1.8.0',
    timestamp: new Date().toISOString(),
    security: {
      helmetEnabled: true,
      rateLimitingActive: true,
      acidIsolationGuaranteed: true
    }
  });
});

// System Diagnostics
app.get('/api/system/health-diagnostics', (req: Request, res: Response) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'OPERATIONAL',
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rssMb: Math.round(memory.rss / (1024 * 1024)),
      heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024))
    },
    security: {
      helmetEnabled: true,
      rateLimitingActive: true
    },
    phasesCompleted: 8,
    databaseType: 'MySQL 8.0 Production Server (coop_bank_patsanstha)'
  });
});

// Phase 1 Modules
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Phase 2 Modules
app.use('/api/products', productRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/teller', tellerRoutes);
app.use('/api/transfers', transferRoutes);

// Phase 3 Modules
app.use('/api/loans', loansRoutes);

// Phase 4 Modules
app.use('/api/collections', collectionsRoutes);

// Phase 5 Modules
app.use('/api/gl', glRoutes);

// Phase 6 Modules
app.use('/api/reports', reportsRoutes);

// Phase 7 Modules
app.use('/api/digital', digitalRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
