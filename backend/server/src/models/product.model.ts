import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductImage {
  _id: Types.ObjectId;
  url: string;
  public_id: string;
}

export interface IProduct extends Omit<Document, 'model'> {
  name: string;
  description: string;
  price: number;
  currency: string;
  condition: 'new' | 'used';
  availability: 'available' | 'sold' | 'reserved';
  category: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  colour?: string;
  features: string[];
  images: Types.DocumentArray<IProductImage & Document>;
  is_published: boolean;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CURRENT_YEAR = new Date().getFullYear();

const ProductImageSchema = new Schema<IProductImage>({
  url:       { type: String, required: true },
  public_id: { type: String, required: true },
});

const ProductSchema = new Schema<IProduct>(
  {
    name:         { type: String, required: true, trim: true, maxlength: 200 },
    description:  { type: String, required: true, maxlength: 2000 },
    price:        { type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'GHS', enum: ['GHS', 'USD', 'EUR'] },
    condition:    { type: String, required: true, enum: ['new', 'used'] },
    availability: { type: String, default: 'available', enum: ['available', 'sold', 'reserved'] },
    category:     { type: String, required: true, trim: true, maxlength: 100 },
    make:         { type: String, required: true, trim: true, maxlength: 100 },
    model:        { type: String, required: true, trim: true, maxlength: 100 },
    year:         { type: Number, required: true, min: 1900, max: CURRENT_YEAR + 2 },
    mileage:      { type: Number, min: 0 },
    colour:       { type: String, trim: true, maxlength: 50 },
    features:     [{ type: String, trim: true, maxlength: 200 }],
    images:       [ProductImageSchema],
    is_published: { type: Boolean, default: false },
    created_by:   { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Common query patterns
ProductSchema.index({ is_published: 1, availability: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ make: 1, model: 1 });
ProductSchema.index({ price: 1 });
// Full-text search across name, description, make, model
ProductSchema.index({ name: 'text', description: 'text', make: 'text', model: 'text' });

let _Product: mongoose.Model<IProduct> | null = null;

export const getProductModel = async (): Promise<mongoose.Model<IProduct>> => {
  if (_Product) return _Product;
  _Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
  return _Product;
};
