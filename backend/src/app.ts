import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
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

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    system: 'Co-operative Bank / Pat Sanstha CBS',
    phase: 'Phase 4 - Collections & Recovery / NPA',
    version: '1.4.0',
    timestamp: new Date().toISOString()
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

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
