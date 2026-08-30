import { Schema, model, Document, Types } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  paymentMethod: string;
  note?: string;
  date: Date;
  isRecurring: boolean;
  recurringId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentMethod: {
      type: String,
      default: 'cash',
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1, date: -1 });

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
