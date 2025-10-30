import { Router } from 'express';
import { authRouter } from './auth/route.js';
const serverRouter = Router();

// Use the authentication routes
serverRouter.use('/api/auth', authRouter);

// Export the main serverRouter
export { serverRouter};