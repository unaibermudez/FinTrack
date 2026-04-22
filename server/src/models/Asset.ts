import mongoose, { Document } from 'mongoose';

export type AssetType = 'stock' | 'crypto' | 'fund';

export interface IAsset extends Document {
  symbol: string;
  name?: string;
  type: AssetType;
}

const assetSchema = new mongoose.Schema<IAsset>({
  symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, trim: true },
  type: { type: String, enum: ['stock', 'crypto', 'fund'], required: true },
});

export default mongoose.model<IAsset>('Asset', assetSchema);
