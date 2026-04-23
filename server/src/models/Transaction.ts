import mongoose, { Document, Types } from 'mongoose';

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'fee';

export interface ITransaction extends Document {
  portfolioId: Types.ObjectId;
  assetSymbol: string;
  type: TransactionType;
  quantity: number;
  priceAtTransaction: number;
  date: Date;
  notes?: string;
}

const transactionSchema = new mongoose.Schema<ITransaction>({
  portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  assetSymbol: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['buy', 'sell', 'dividend', 'fee'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  priceAtTransaction: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, trim: true },
});

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
