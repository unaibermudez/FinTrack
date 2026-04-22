import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { importFromCsv } from '../services/importService.js';
import { ApiError } from '../utils/ApiError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
}).single('file');

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const importTransactions = (req: Request, res: Response, next: NextFunction): void => {
  upload(req, res, async (err) => {
    if (err) return next(new ApiError(400, err.message));
    if (!req.file) return next(new ApiError(400, 'No file uploaded'));

    try {
      const csvContent = req.file.buffer.toString('utf-8');
      const result = await importFromCsv(param(req.params.id), req.userId, csvContent);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });
};
