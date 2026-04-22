import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import * as portfolioController from '../controllers/portfolioController.js';
import * as transactionController from '../controllers/transactionController.js';
import { getPortfolioPerformance } from '../controllers/performanceController.js';
import { getPortfolioHistory } from '../controllers/historyController.js';
import { importTransactions } from '../controllers/importController.js';

const router = Router();
router.use(authenticate);

router.get('/', portfolioController.getPortfolios);
router.post('/', portfolioController.createPortfolio);
router.get('/:id', portfolioController.getPortfolio);
router.put('/:id', portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);

router.get('/:id/transactions', transactionController.getTransactions);
router.post('/:id/transactions', transactionController.createTransaction);
router.put('/:id/transactions/:txId', transactionController.updateTransaction);
router.delete('/:id/transactions/:txId', transactionController.deleteTransaction);
router.post('/:id/transactions/import', importTransactions);

router.get('/:id/performance', getPortfolioPerformance);
router.get('/:id/history', getPortfolioHistory);

export default router;
