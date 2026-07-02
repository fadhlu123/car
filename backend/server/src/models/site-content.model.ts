import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAboutBlock {
  _id:       Types.ObjectId;
  type:      'paragraph' | 'image' | 'video';
  text?:     string;
  url?:      string;
  public_id?: string;
  caption?:  string;
  float?:    'left' | 'right' | 'none';
  order:     number;
}

export interface ISiteContent extends Document {
  about_blocks:    IAboutBlock[];
  contact_phone?:  string;
  contact_email?:  string;
  contact_address?: string;
  updated_by?:     Types.ObjectId;
  updated_at:      Date;
}

const AboutBlockSchema = new Schema<IAboutBlock>(
  {
    type:      { type: String, required: true, enum: ['paragraph', 'image', 'video'] },
    text:      { type: String, maxlength: 5000 },
    url:       { type: String, maxlength: 500 },
    public_id: { type: String, maxlength: 200 },
    caption:   { type: String, maxlength: 300 },
    float:     { type: String, enum: ['left', 'right', 'none'], default: 'none' },
    order:     { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const SiteContentSchema = new Schema<ISiteContent>(
  {
    about_blocks:     { type: [AboutBlockSchema], default: [] },
    contact_phone:    { type: String, maxlength: 50 },
    contact_email:    { type: String, maxlength: 200 },
    contact_address:  { type: String, maxlength: 300 },
    updated_by:       { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' }, versionKey: false }
);

let _SiteContent: Model<ISiteContent> | null = null;

export const getSiteContentModel = async (): Promise<Model<ISiteContent>> => {
  if (_SiteContent) return _SiteContent;
  _SiteContent = mongoose.models.SiteContent || mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);
  return _SiteContent;
};

// There is exactly one SiteContent document. Reads/writes always go through
// this helper so callers never need to think about the singleton's _id.
export const getOrCreateSiteContent = async (): Promise<InstanceType<Model<ISiteContent>>> => {
  const SiteContent = await getSiteContentModel();
  let doc = await SiteContent.findOne();
  if (!doc) doc = await SiteContent.create({});
  return doc;
};
