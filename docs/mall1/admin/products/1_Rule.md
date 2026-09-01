# Post Editor 개발 Flow — 1. Rule

## 1. 목표

Next + React 기반의 **Block JSON 방식 Post Editor**를 구축한다.

Post는 여러 개의 Block으로 구성되며, Editor에서 생성한 Block 데이터는 Preview와 실제 Post Renderer에서 동일하게 사용한다.

```text
Editor
  ↓
PostBlock[]
  ↓
Preview / Renderer
  ↓
실제 Post
```

---

## 2. Block 기본 원칙

Post의 콘텐츠는 HTML 또는 Markdown 문자열로 저장하지 않는다.

각 콘텐츠는 **독립된 Block 데이터**로 관리한다.

```text
Block
 ├─ type
 ├─ data
 └─ option
```

Block 내부의 외부 리소스는 필요한 경우 **URL + Meta 정보**로 관리한다.

예:

```text
image
 ├─ url
 └─ meta

video
 ├─ url
 └─ meta

link
 ├─ url
 └─ meta
```

여기서 `meta`는 해당 리소스를 설명하거나 렌더링하는 데 필요한 추가 데이터로 사용한다.

---

# 3. 사용할 Block 목록

초기에는 Instagram과 일반적인 게시글 작성에 필요한 범위로 제한한다.

### 콘텐츠 Block

* **text** — 일반 텍스트
* **image** — 이미지
* **video** — 영상
* **link** — 외부 링크
* **divider** — 구분선

### 확장 Block

필요성이 확인되면 이후 추가한다.

* title
* button
* gallery
* quote
* embed 등

처음부터 모든 Block을 구현하지 않고 **실제 사용 빈도가 높은 Block부터 구현**한다.

---

# 4. Block의 기본 데이터 규칙

모든 Block은 최소한 다음 개념을 가진다.

```text
type
data
option
```

예:

```json
{
  "type": "image",
  "data": {
    "url": "https://example.com/image.jpg",
    "meta": {}
  },
  "option": {}
}
```

텍스트는:

```json
{
  "type": "text",
  "data": {
    "text": "오늘의 이야기"
  },
  "option": {}
}
```

링크는:

```json
{
  "type": "link",
  "data": {
    "url": "https://example.com",
    "meta": {}
  },
  "option": {}
}
```

---

# 5. URL 리소스 규칙

이미지, 영상, 링크 등은 **파일 자체를 Post JSON에 포함하지 않는다.**

Post에는 URL 및 필요한 Meta 정보만 저장한다.

```text
Post JSON
   ↓
URL
   ↓
외부 저장소 / CDN / 파일 서버
```

예:

```json
{
  "type": "video",
  "data": {
    "url": "https://cdn.example.com/video.mp4",
    "meta": {
      "width": 1080,
      "height": 1920,
      "duration": 12
    }
  }
}
```

실제 파일 업로드와 저장 위치는 별도의 Storage 정책에서 결정한다.

---

# 6. 입력 제한 Rule

초기 Editor에서는 **일반적인 SNS 게시글 수준의 제한**만 적용한다.

### Text

* 너무 긴 단일 입력은 제한한다.
* 허용하지 않는 HTML을 직접 입력받지 않는다.
* 텍스트는 기본적으로 문자열 데이터로 처리한다.

### Image

* 허용된 이미지 URL 또는 업로드 결과만 사용한다.
* 너무 큰 파일은 업로드 단계에서 제한한다.
* 필요 시 최대 이미지 개수를 별도로 설정한다.

### Video

* 허용된 영상 URL 또는 업로드 결과만 사용한다.
* 영상 크기 및 길이는 업로드 단계에서 제한한다.

### Link

* 유효한 URL만 허용한다.
* `javascript:` 등의 비정상적인 URL 스킴은 허용하지 않는다.

---

# 7. 잘못된 Block 처리 Rule

**잘못된 Block이 발견되면 해당 Block만 제거한다.**

예:

```text
[
  text,
  image,
  invalid,
  video
]
```

Renderer 결과:

```text
text
image
video
```

즉, 하나의 잘못된 Block 때문에 **전체 Post를 무효화하지 않는다.**

알 수 없는 `type`, 필수 데이터 누락, 잘못된 데이터 구조 등의 경우 해당 Block을 렌더링하지 않는다.

---

# 8. 보안 원칙

Post 데이터는 JSON 구조로 관리하며, **임의의 HTML / Script / React 코드를 실행하지 않는다.**

Renderer는 서버에서 전달받은 `type`을 기준으로 **미리 정의된 Component만 선택한다.**

```text
type
 ↓
허용된 Component 확인
 ↓
Component 렌더링
```

따라서 Post 데이터 자체가 React 코드나 HTML 코드가 되는 구조는 사용하지 않는다.

---

# 9. Option Rule

Block의 `option`은 **각 Block의 화면 표현이나 동작을 제어하기 위한 설정값**으로 사용한다.

예:

```json
{
  "type": "image",
  "data": {
    "url": "..."
  },
  "option": {
    "fit": "cover"
  }
}
```

다만 **option의 구체적인 항목은 Block별로 따로 정의한다.**

즉, 1번 Rule 단계에서는 `option`이라는 개념만 확정하고,

```text
Image Option
Text Option
Video Option
Link Option
...
```

은 이후 하나씩 정한다.

---

# 10. Rule 1차 확정

### Block

```text
text
image
video
link
divider
```

### 기본 구조

```text
type
data
option
```

### 외부 리소스

```text
url + meta
```

### 보안

```text
HTML 직접 렌더링 X
React 코드 실행 X
허용된 type만 Renderer에서 처리
```

### 오류 처리

```text
잘못된 Block만 제거
전체 Post는 유지
```

### Option

```text
Block별로 개별 정의
```

---

## 1번 완료 기준

* [x] Block 목록 1차 결정
* [x] Block 기본 구조 결정
* [x] URL + Meta 방식 결정
* [x] 기본 입력 제한 원칙 결정
* [x] 잘못된 Block 처리 방식 결정
* [x] 보안 처리 방향 결정
* [ ] 각 Block의 상세 Option 정의

# Post Block Option 정의

## 1. Text

일반적인 본문 텍스트입니다.

```ts
option: {
  align?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large';
  weight?: 'normal' | 'bold';
}
```

### 의미

* `align` — 텍스트 정렬
* `size` — 글자 크기
* `weight` — 글자 굵기

기본값은:

```ts
{
  align: 'left',
  size: 'medium',
  weight: 'normal'
}
```

Text에는 **색상, 폰트 종류, 줄 간격 등을 처음부터 넣지 않는다.**
서비스 전체 디자인을 깨뜨릴 가능성이 있기 때문입니다.

---

# 2. Image

이미지 자체의 표시 방법을 설정합니다.

```ts
option: {
  fit?: 'contain' | 'cover';
  align?: 'left' | 'center' | 'right';
  radius?: 'none' | 'small' | 'medium' | 'large';
}
```

### 의미

* `fit` — 이미지 비율 처리
* `align` — 이미지 위치
* `radius` — 모서리 둥글기

기본값:

```ts
{
  fit: 'contain',
  align: 'center',
  radius: 'none'
}
```

이미지의 크기 자체는 `meta`의 원본 크기나 Renderer의 레이아웃 규칙을 우선 사용합니다.

---

# 3. Video

영상 표시와 재생 방식을 제어합니다.

```ts
option: {
  fit?: 'contain' | 'cover';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  radius?: 'none' | 'small' | 'medium' | 'large';
}
```

### 의미

* `fit` — 영상 비율 처리
* `autoplay` — 자동 재생
* `loop` — 반복 재생
* `muted` — 음소거
* `controls` — 재생 컨트롤 표시
* `radius` — 모서리 둥글기

기본값:

```ts
{
  fit: 'contain',
  autoplay: false,
  loop: false,
  muted: true,
  controls: true,
  radius: 'none'
}
```

모바일 환경에서는 자동 재생 정책 때문에 `autoplay`가 실제로 적용되지 않을 수 있으므로 Renderer가 플랫폼에 맞게 처리합니다.

---

# 4. Link

외부 링크를 카드 또는 일반 링크 형태로 보여줄 수 있게 합니다.

```ts
option: {
  open?: 'external' | 'internal';
  preview?: boolean;
  target?: 'self' | 'blank';
}
```

### 의미

* `open` — 링크를 내부/외부 중 어떤 방식으로 처리할지
* `preview` — URL Preview Card를 사용할지
* `target` — 현재 화면 / 새 화면

기본값:

```ts
{
  open: 'external',
  preview: true,
  target: 'blank'
}
```

단, 실제 `target` 동작은 Web과 Mobile에서 다를 수 있으므로 플랫폼 Renderer가 최종 결정합니다.

---

# 5. Divider

단순한 구분선입니다.

```ts
option: {
  style?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'small' | 'medium' | 'large';
}
```

### 의미

* `style` — 선 모양
* `spacing` — 위아래 여백

기본값:

```ts
{
  style: 'solid',
  spacing: 'medium'
}
```

---

# 6. 공통 Option

모든 Block에 공통으로 넣을 필요가 있는 옵션은 최소화합니다.

초기에는 별도의 공통 `option`을 만들기보다 **Block별 Option을 독립적으로 관리**합니다.

즉:

```text
TextOption
ImageOption
VideoOption
LinkOption
DividerOption
```

형태로 관리합니다.

---

# 7. Option 설계 원칙

Option은 **콘텐츠가 아니라 화면/동작 설정**입니다.

### data

```text
무엇을 보여줄 것인가
```

### option

```text
어떻게 보여줄 것인가
```

예:

```json
{
  "type": "image",
  "data": {
    "url": "...",
    "meta": {
      "width": 1080,
      "height": 720
    }
  },
  "option": {
    "fit": "cover",
    "align": "center",
    "radius": "medium"
  }
}
```

여기서:

```text
data
 → 실제 이미지

option
 → 이미지 표시 방식
```

으로 명확하게 구분합니다.

---

# 8. 1차 Option 최종 목록

```text
Text
 ├─ align
 ├─ size
 └─ weight

Image
 ├─ fit
 ├─ align
 └─ radius

Video
 ├─ fit
 ├─ autoplay
 ├─ loop
 ├─ muted
 ├─ controls
 └─ radius

Link
 ├─ open
 ├─ preview
 └─ target

Divider
 ├─ style
 └─ spacing
```
