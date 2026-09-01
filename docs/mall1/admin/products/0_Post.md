# Post Editor 개발 Flow

1. **Rule 만들기**
   사용할 Block 종류와 각 Block의 필수값, option, 입력 제한 등을 정의합니다.

2. **Type 만들기**
   `PostBlock`과 각 Block의 TypeScript 타입 및 option 타입을 정의합니다.

3. **PostEditor 만들기**
   사용자가 실제로 Post를 작성하고 Block을 추가·수정·삭제할 수 있는 **독립적인 Post Editor Module**을 만듭니다.
   Editor의 결과물은 `PostBlock[]` 형태의 데이터가 됩니다.

4. **PostRenderer 만들기**
   `type`을 기준으로 적절한 Component를 선택하고 `PostBlock[]`을 실제 화면으로 렌더링합니다.

5. **테스트용 Post JSON 만들기**
   `PostBlock[]`을 직접 입력하거나 생성하여 Renderer가 정상적으로 출력되는지 확인합니다.

6. **Editor State / History 만들기**
   `PostBlock[]`의 상태와 Undo/Redo, 선택 상태, 순서 변경 등의 편집 상태를 관리합니다.

7. **Block Editor 만들기**
   `TextEditor`, `ImageEditor`, `VideoEditor` 등 각 Block을 실제로 편집하는 UI를 구현합니다.

8. **EditorPage 조립하기**
   Post Toolbar, Editor Toolbar, Block Editor 등을 조립하여 최종 편집 화면을 구성합니다.

9. **Block 추가 UI 만들기**
   Toolbar와 `/` Command 등을 이용해 새로운 Block을 추가할 수 있게 합니다.

10. **단축키 만들기**
    저장, 게시, Undo/Redo 등의 단축키를 추가합니다.

11. **PreviewPage 만들기**
    Editor의 `PostBlock[]`을 Renderer로 렌더링하여 게시 전 화면을 확인합니다.

12. **RenderPage 만들기**
    서버에서 Post 데이터를 받아 실제 사용자에게 게시글을 보여줍니다.

13. **Validation 만들기**
    잘못된 `type`, 필수값 누락, 잘못된 option 등의 Post JSON을 검증합니다.

14. **저장 / 게시 API 연결**
    검증된 `PostBlock[]`을 서버에 전달하고 DB에 저장합니다.
