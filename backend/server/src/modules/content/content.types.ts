export type BlockType = 'paragraph' | 'image' | 'video';
export type BlockFloat = 'left' | 'right' | 'none';

export interface AboutBlockDTO {
  id:      string;
  type:    BlockType;
  text?:   string;
  url?:    string;
  caption?: string;
  float?:  BlockFloat;
  order:   number;
}

export interface ContactInfoDTO {
  phone:   string;
  email:   string;
  address: string;
}

export interface AddBlockInput {
  type:     BlockType;
  text?:    string;
  caption?: string;
  float?:   BlockFloat;
}

export interface UpdateBlockInput {
  text?:    string;
  caption?: string;
  float?:   BlockFloat;
}

export interface ReorderInput {
  id:    string;
  order: number;
}
