import mongoose, { Document, Types } from 'mongoose';

export interface IPortfolio extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
}

const portfolioSchema = new mongoose.Schema<IPortfolio>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
