import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  refreshToken: string | null;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, trim: true },
  refreshToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', userSchema);
