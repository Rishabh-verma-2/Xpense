import { Schema, model, Document, Types } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface ICategory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isSystem: boolean;
  createdAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 40,
    },
    icon: {
      type: String,
      default: 'ellipse-outline',
    },
    color: {
      type: String,
      default: '#7C3AED',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex code'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Category type is required'],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Compound index — a user can't have two categories with the same name + type
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export const Category = model<ICategory>('Category', CategorySchema);
