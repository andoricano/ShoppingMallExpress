# Post Editor 개발 Flow — 2. Type 만들기

## 1. 기본 구조

모든 Block은 다음 구조를 가진다.

```ts
type PostBlock = {
  type: string;
  data: unknown;
  option: unknown;
};
```

다만 실제 구현에서는 `string / unknown`으로 끝내지 않고 **Block별 Union Type**으로 구체화한다.

```text
PostBlock
 ├─ TextBlock
 ├─ ImageBlock
 ├─ VideoBlock
 ├─ LinkBlock
 └─ DividerBlock
```

---

# 2. Text Type

## Option

```ts
export type TextOption = {
  align?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large';
  weight?: 'normal' | 'bold';
};
```

## Data

```ts
export type TextData = {
  text: string;
};
```

## Block

```ts
export type TextBlock = {
  type: 'text';
  data: TextData;
  option?: TextOption;
};
```

---

# 3. Image Type

## Meta

이미지의 원본 및 파일 정보를 저장한다.

```ts
export type ImageMeta = {
  width?: number;
  height?: number;
  mimeType?: string;
  fileSize?: number;
  alt?: string;
};
```

## Data

```ts
export type ImageData = {
  url: string;
  meta?: ImageMeta;
};
```

## Option

```ts
export type ImageOption = {
  fit?: 'contain' | 'cover';
  align?: 'left' | 'center' | 'right';
  radius?: 'none' | 'small' | 'medium' | 'large';
};
```

## Block

```ts
export type ImageBlock = {
  type: 'image';
  data: ImageData;
  option?: ImageOption;
};
```

---

# 4. Video Type

## Meta

```ts
export type VideoMeta = {
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
};
```

## Data

```ts
export type VideoData = {
  url: string;
  meta?: VideoMeta;
};
```

## Option

```ts
export type VideoOption = {
  fit?: 'contain' | 'cover';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  radius?: 'none' | 'small' | 'medium' | 'large';
};
```

## Block

```ts
export type VideoBlock = {
  type: 'video';
  data: VideoData;
  option?: VideoOption;
};
```

---

# 5. Link Type

## Meta

Link Preview를 사용할 경우 필요한 정보를 저장한다.

```ts
export type LinkMeta = {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
};
```

## Data

```ts
export type LinkData = {
  url: string;
  meta?: LinkMeta;
};
```

## Option

```ts
export type LinkOption = {
  open?: 'external' | 'internal';
  preview?: boolean;
  target?: 'self' | 'blank';
};
```

## Block

```ts
export type LinkBlock = {
  type: 'link';
  data: LinkData;
  option?: LinkOption;
};
```

---

# 6. Divider Type

Divider는 외부 데이터가 필요 없으므로 `data`를 사용하지 않는다.

```ts
export type DividerOption = {
  style?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'small' | 'medium' | 'large';
};
```

```ts
export type DividerBlock = {
  type: 'divider';
  data: null;
  option?: DividerOption;
};
```

---

# 7. PostBlock Union

이제 모든 Block을 하나로 묶는다.

```ts
export type PostBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | LinkBlock
  | DividerBlock;
```

이 타입 하나로 Editor와 Renderer가 모든 Block을 인식할 수 있다.

---

# 8. Post Type

Post 전체는 Block 배열을 가진다.

```ts
export type PostData = {
  blocks: PostBlock[];
};
```

나중에 Post 자체의 정보가 필요하면 확장한다.

예:

```ts
export type Post = {
  id: string;
  title?: string;
  thumbnailUrl?: string;
  blocks: PostBlock[];
  createdAt: string;
  updatedAt: string;
};
```

다만 **Post와 Post Editor의 콘텐츠 데이터는 분리해서 생각한다.**

```text
Post
 ├─ id
 ├─ title
 ├─ thumbnail
 └─ blocks
      ├─ TextBlock
      ├─ ImageBlock
      └─ ...
```

---

# 9. Block Type 판별

Renderer에서 `type`을 이용해 자동으로 구분할 수 있도록 한다.

```ts
function isTextBlock(block: PostBlock): block is TextBlock {
  return block.type === 'text';
}

function isImageBlock(block: PostBlock): block is ImageBlock {
  return block.type === 'image';
}

function isVideoBlock(block: PostBlock): block is VideoBlock {
  return block.type === 'video';
}

function isLinkBlock(block: PostBlock): block is LinkBlock {
  return block.type === 'link';
}

function isDividerBlock(block: PostBlock): block is DividerBlock {
  return block.type === 'divider';
}
```

초기에는 `type` 자체가 명확한 Literal Union이므로 필요하지 않을 수도 있지만, Validation이나 복잡한 Renderer에서 활용할 수 있다.

---

# 10. 기본값

Option은 모두 Optional로 만든다.

즉 저장 데이터는:

```json
{
  "type": "text",
  "data": {
    "text": "안녕하세요."
  }
}
```

처럼 최소한으로 저장할 수 있다.

Renderer에서 기본값을 적용한다.

예:

```ts
const option = {
  align: 'left',
  size: 'medium',
  weight: 'normal',
  ...block.option,
};
```

이렇게 하면 DB에 불필요한 기본값까지 저장하지 않아도 된다.

---

# 11. 최종 Type 구조

```text
Post
 └─ blocks: PostBlock[]
      │
      ├─ TextBlock
      │    ├─ data
      │    │    └─ text
      │    └─ option
      │         ├─ align
      │         ├─ size
      │         └─ weight
      │
      ├─ ImageBlock
      │    ├─ data
      │    │    ├─ url
      │    │    └─ meta
      │    └─ option
      │         ├─ fit
      │         ├─ align
      │         └─ radius
      │
      ├─ VideoBlock
      │    ├─ data
      │    │    ├─ url
      │    │    └─ meta
      │    └─ option
      │         ├─ fit
      │         ├─ autoplay
      │         ├─ loop
      │         ├─ muted
      │         ├─ controls
      │         └─ radius
      │
      ├─ LinkBlock
      │    ├─ data
      │    │    ├─ url
      │    │    └─ meta
      │    └─ option
      │         ├─ open
      │         ├─ preview
      │         └─ target
      │
      └─ DividerBlock
           └─ option
                ├─ style
                └─ spacing
```

---

## 2번 완료 기준

* [x] Text Type
* [x] Image Type
* [x] Video Type
* [x] Link Type
* [x] Divider Type
* [x] 각 Block Option Type
* [x] 각 리소스 Meta Type
* [x] `PostBlock` Union Type
* [x] `PostData` Type
* [x] 기본값 처리 방식 정의
