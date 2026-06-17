import { IProduct } from '../models/product.model';
import { ProductSummary, ProductDetail } from '../types/inventory.types';

export const toSummary = (doc: IProduct): ProductSummary => ({
  id:           doc._id.toString(),
  name:         doc.name,
  price:        doc.price,
  currency:     doc.currency as any,
  condition:    doc.condition,
  availability: doc.availability,
  category:     doc.category,
  make:         doc.make,
  model:        doc.model,
  year:         doc.year,
  colour:       doc.colour,
  thumbnail:    doc.images?.[0]?.url ?? null,
});

export const toDetail = (doc: IProduct): ProductDetail => ({
  ...toSummary(doc),
  description: doc.description,
  mileage:     doc.mileage,
  features:    doc.features ?? [],
  images:      (doc.images ?? []).map((img) => ({
    id:        img._id.toString(),
    url:       img.url,
    public_id: img.public_id,
  })),
  is_published: doc.is_published,
  created_by:   doc.created_by.toString(),
  created_at:   doc.created_at,
  updated_at:   doc.updated_at,
});
