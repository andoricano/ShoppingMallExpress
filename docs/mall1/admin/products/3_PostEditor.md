# Post Editor 개발 Flow — 3. PostEditor 만들기

## 1. 목표

`PostEditor`를 **독립적인 Editor Module**로 만든다.

PostEditor의 핵심 역할은 사용자의 입력을 받아 **유효한 `PostBlock[]` 데이터를 생성하고 수정하는 것**이다.

```text
사용자 입력
   ↓
PostEditor
   ↓
PostBlock[]
   ↓
PostRenderer
```

PostEditor는 특정 Mall, Cafe, Review 등의 서비스에 종속되지 않는다.

---

# 2. PostEditor의 책임

PostEditor는 다음 작업을 담당한다.

* Block 추가
* Block 수정
* Block 삭제
* Block 순서 변경
* Block 선택
* Block의 `data` 수정
* Block의 `option` 수정
* 현재 `PostBlock[]` 반환
* 필요 시 `onChange`를 통해 변경 데이터 전달

반대로 다음 작업은 PostEditor의 책임으로 두지 않는다.

* 실제 Post 화면의 최종 렌더링
* 서버 저장
* 게시 API 호출
* 파일 저장소 관리
* 서버 Validation

이 기능들은 이후 단계에서 담당한다.

---

# 3. Editor의 기본 데이터

Editor의 핵심 상태는 `PostBlock[]`이다.

```ts
const [blocks, setBlocks] = useState<PostBlock[]>([]);
```

예:

```text
blocks
 ├─ TextBlock
 ├─ ImageBlock
 ├─ VideoBlock
 └─ LinkBlock
```

Editor가 종료되거나 저장될 때 최종적으로 이 배열을 결과 데이터로 사용한다.

---

# 4. Block 생성

각 Block은 Editor에서 추가할 수 있어야 한다.

예:

```text
+ Text
+ Image
+ Video
+ Link
+ Divider
```

Text를 추가하면:

```json
{
  "id": "...",
  "type": "text",
  "data": {
    "text": ""
  },
  "option": {}
}
```

Image를 추가하면:

```json
{
  "id": "...",
  "type": "image",
  "data": {
    "url": "",
    "meta": {}
  },
  "option": {}
}
```

각 Block은 **Editor에서 사용할 기본값을 가진 초기 데이터**를 통해 생성한다.

---

# 5. Block 수정

Editor에서 사용자가 입력한 값을 해당 Block 데이터에 반영한다.

예:

```text
Text Block
 ↓
"안녕하세요."
 ↓
block.data.text 변경
```

또는:

```text
Image Block
 ↓
이미지 선택
 ↓
block.data.url 변경
```

Option도 동일한 방식으로 변경한다.

```text
block.option
 ├─ align
 ├─ size
 └─ weight
```

---

# 6. Block 삭제

사용자가 선택한 Block을 삭제한다.

```text
[
  text,
  image,
  video
]

      ↓ image 삭제

[
  text,
  video
]
```

삭제는 Block의 `id`를 기준으로 처리한다.

---

# 7. Block 순서 변경

Block의 순서를 변경할 수 있도록 한다.

```text
[
  text,
  image,
  video
]
```

↓

```text
[
  image,
  text,
  video
]
```

초기에는 버튼을 통한 위/아래 이동으로 구현할 수 있으며, 이후 필요하면 Drag & Drop으로 확장한다.

---

# 8. Block 선택 상태

Editor에서는 현재 편집 중인 Block을 구분할 수 있어야 한다.

```ts
type EditorSelection = {
  blockId: string | null;
};
```

선택한 Block에는:

```text
선택됨
 ↓
편집 영역 표시
 ↓
Option 편집
```

등의 UI를 적용할 수 있다.

---

# 9. Editor와 Component의 관계

PostEditor는 Post 데이터를 직접 다루고, Block별 편집 UI는 별도의 Editor Component를 사용한다.

```text
PostEditor
   │
   ├── TextEditor
   ├── ImageEditor
   ├── VideoEditor
   ├── LinkEditor
   └── DividerEditor
```

각 Editor Component는 해당 Block을 수정한다.

예:

```tsx
<TextEditor block={textBlock} />
```

```tsx
<ImageEditor block={imageBlock} />
```

---

# 10. PostEditor와 Renderer 분리

PostEditor는 **데이터를 만드는 역할**을 하고,

PostRenderer는 **데이터를 보여주는 역할**을 한다.

```text
PostEditor
    ↓
PostBlock[]
    ↓
PostRenderer
    ↓
실제 화면
```

따라서 Editor 안에서 HTML이나 최종 Post 화면용 코드를 직접 생성하지 않는다.

---

# 11. PostEditor의 기본 인터페이스

독립적인 Module로 사용할 수 있도록 외부에서 초기 데이터와 변경 결과를 받을 수 있게 한다.

예:

```ts
type PostEditorProps = {
  initialBlocks?: PostBlock[];
  onChange?: (blocks: PostBlock[]) => void;
};
```

이를 통해:

```text
Mall
 └─ PostEditor

Cafe
 └─ PostEditor

Review
 └─ PostEditor
```

처럼 같은 Editor를 재사용할 수 있다.

---

# 12. Editor 결과 데이터

Editor에서 작성한 최종 결과는 다음 형태가 된다.

```json
{
  "blocks": [
    {
      "id": "block-1",
      "type": "text",
      "data": {
        "text": "오늘의 이야기"
      }
    },
    {
      "id": "block-2",
      "type": "image",
      "data": {
        "url": "https://example.com/image.jpg"
      }
    }
  ]
}
```

이 데이터는 이후:

```text
Preview
RenderPage
API
DB
```

등에서 사용할 수 있다.

---

# 13. 1차 구현 범위

처음부터 완성형 Notion Editor를 만들지 않는다.

1차에서는 다음 기능만 구현한다.

```text
Block 추가
Block 선택
Block 수정
Block 삭제
Block 순서 변경
PostBlock[] 반환
```

초기 Block:

```text
text
image
video
link
divider
```

---

# 14. PostEditor 완료 기준

### 기본

* [ ] `PostEditor` 생성
* [ ] `PostBlock[]` 상태 관리
* [ ] 초기 Block 생성 방식 구현
* [ ] `onChange` 인터페이스 구현

### Block 조작

* [ ] Block 추가
* [ ] Block 선택
* [ ] Block 수정
* [ ] Block 삭제
* [ ] Block 순서 변경

### Editor Component

* [ ] TextEditor
* [ ] ImageEditor
* [ ] VideoEditor
* [ ] LinkEditor
* [ ] DividerEditor

### 구조

* [ ] 서비스와 독립적인 Module 구성
* [ ] Editor와 Renderer 분리
* [ ] 최종 결과가 `PostBlock[]`으로 반환되는 것 확인

---

## 3번 완료 후 구조

```text
PostType.ts
     ↓
PostEditor
     │
     ├── TextEditor
     ├── ImageEditor
     ├── VideoEditor
     ├── LinkEditor
     └── DividerEditor
     │
     ↓
PostBlock[]
     ↓
4. PostRenderer
```
