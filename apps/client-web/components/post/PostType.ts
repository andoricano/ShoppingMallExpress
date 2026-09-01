// post/PostType.ts

/**
 * =========================
 * Text
 * =========================
 */

export type TextOption = {
  align?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large';
  weight?: 'normal' | 'bold';
};

export type TextData = {
  text: string;
};

export type TextBlock = {
  id: string;
  type: 'text';
  data: TextData;
  option?: TextOption;
};


/**
 * =========================
 * Image
 * =========================
 */

export type ImageMeta = {
  width?: number;
  height?: number;
  mimeType?: string;
  fileSize?: number;
  alt?: string;
};

export type ImageData = {
  url: string;
  meta?: ImageMeta;
};

export type ImageOption = {
  fit?: 'contain' | 'cover';
  align?: 'left' | 'center' | 'right';
  radius?: 'none' | 'small' | 'medium' | 'large';
};

export type ImageBlock = {
  id: string;
  type: 'image';
  data: ImageData;
  option?: ImageOption;
};


/**
 * =========================
 * Video
 * =========================
 */

export type VideoMeta = {
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
};

export type VideoData = {
  url: string;
  meta?: VideoMeta;
};

export type VideoOption = {
  fit?: 'contain' | 'cover';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  radius?: 'none' | 'small' | 'medium' | 'large';
};

export type VideoBlock = {
  id: string;
  type: 'video';
  data: VideoData;
  option?: VideoOption;
};


/**
 * =========================
 * Link
 * =========================
 */

export type LinkMeta = {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
};

export type LinkData = {
  url: string;
  meta?: LinkMeta;
};

export type LinkOption = {
  open?: 'external' | 'internal';
  preview?: boolean;
  target?: 'self' | 'blank';
};

export type LinkBlock = {
  id: string;
  type: 'link';
  data: LinkData;
  option?: LinkOption;
};


/**
 * =========================
 * Divider
 * =========================
 */

export type DividerOption = {
  style?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'small' | 'medium' | 'large';
};

export type DividerBlock = {
  id: string;
  type: 'divider';
  data: null;
  option?: DividerOption;
};


/**
 * =========================
 * Post Block
 * =========================
 */

export type PostBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | LinkBlock
  | DividerBlock;


/**
 * =========================
 * Post Data
 * =========================
 */

export type PostData = {
  blocks: PostBlock[];
};


/**
 * =========================
 * Post
 * =========================
 */

export type Post = {
  id: string;
  title?: string;
  thumbnailUrl?: string;
  blocks: PostBlock[];
  createdAt: string;
  updatedAt: string;
};