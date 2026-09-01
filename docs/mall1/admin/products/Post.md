# Product Detail Editor

Admin에서 상품의 상세 설명을 작성하고 수정하는 페이지입니다.

상품의 상세 설명은 Tiptap Editor를 사용하여 텍스트, 이미지, 영상, 링크 등의 콘텐츠를 자유롭게 구성할 수 있습니다.

편집 결과는 Tiptap JSON을 문자열로 변환하여 `Product.description`에 저장합니다.

```text
Admin Product Detail Page
        ↓
   Tiptap Editor
        ↓
    Tiptap JSON
        ↓
  JSON.stringify()
        ↓
Product.description
        ↓
     Supabase
```

사용자 상품 상세 페이지에서는 저장된 `description`을 다시 JSON으로 변환하고, **Post Renderer를 사용하여 실제 상품 상세 내용을 렌더링합니다.**

```text
Supabase
    ↓
Product.description
    ↓
   JSON.parse()
    ↓
Post Renderer
    ↓
User Product Detail Page
```
