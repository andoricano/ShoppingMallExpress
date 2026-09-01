# Post Editor 개발 Flow — 4. PostRenderer 만들기

## 1. 목표

`PostBlock[]`을 받아 각 Block의 `type`에 맞는 Component를 선택하여 실제 Post 화면으로 렌더링합니다.

```text
PostBlock[]
    ↓
PostRenderer
    ↓
type 확인
    ↓
해당 Component
    ↓
화면
```

## 2. Renderer Component 만들기

각 Block을 실제 화면에 표시하는 Web Component를 만듭니다.

```text
renderer/
├── Text.tsx
├── Image.tsx
├── Video.tsx
├── Link.tsx
└── Divider.tsx
```

## 3. Component Props 연결

각 Component는 자신이 담당하는 Block Type을 받습니다.

```tsx
<Text block={block} />
<Image block={block} />
```

## 4. Component Registry 만들기

`type`과 Component를 연결합니다.

```ts
const componentMap = {
  text: Text,
  image: Image,
  video: Video,
  link: Link,
  divider: Divider,
};
```

## 5. PostRenderer 구현

`PostBlock[]`을 순회하면서 `type`에 맞는 Component를 선택합니다.

```text
blocks
  ↓
map
  ↓
block.type
  ↓
componentMap[type]
  ↓
<Component block={block} />
```

## 6. 잘못된 Block 처리

알 수 없는 `type`이나 렌더링할 Component가 없는 경우 해당 Block만 건너뜁니다.

```text
text
image
invalid  ← 무시
video
```

## 7. Option 처리

각 Block의 `option`은 해당 Block Component가 처리합니다.

```text
PostRenderer
    ↓
Text
    ↓
Text Option 처리
```

PostRenderer가 모든 Block의 Option을 직접 관리하지 않습니다.

## 8. 완료 기준

* [ ] Web용 Block Component 생성
* [ ] Component Props 연결
* [ ] Component Registry 생성
* [ ] `PostRenderer` 구현
* [ ] `PostBlock[]` 정상 렌더링
* [ ] 잘못된 Block 개별 무시
* [ ] Option 정상 적용
