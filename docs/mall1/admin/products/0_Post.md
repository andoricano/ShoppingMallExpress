# Post Editor 개발 Flow

1. **Rule 만들기**
   사용할 Block 종류와 각 Block의 필수값, option, 입력 제한 등을 정의합니다.

2. **Type 만들기**
   `PostBlock`과 각 Block의 TypeScript 타입 및 option 타입을 정의합니다.

3. **PostEditor 만들기**
   사용자가 실제로 Post를 작성하고 Block을 추가·수정·삭제할 수 있는 독립적인 Editor Module의 기본 구조를 만듭니다.
   Editor의 결과물은 `PostBlock[]` 형태의 데이터가 됩니다.

4. **PostRenderer 만들기**
   `type`을 기준으로 적절한 Component를 선택하고 `PostBlock[]`을 실제 화면으로 렌더링합니다.

5. **Editor + Renderer 통합 테스트**
   Editor에서 실제로 Block을 생성·수정하면서 `PostBlock[]`이 올바르게 만들어지는지 확인하고, 동시에 Renderer로 출력하여 데이터와 화면을 함께 디버깅합니다.
   이 단계에서 테스트용 Post JSON도 필요에 따라 직접 확인하거나 저장하여 사용합니다.

6. **Editor State / History 정리**
   `PostBlock[]` 상태, 현재 선택 Block, Undo/Redo, 변경 이력 등의 Editor 상태를 정리하고 안정화합니다.

7. **Block Editor 정리**
   `TextEditor`, `ImageEditor`, `VideoEditor`, `LinkEditor`, `DividerEditor` 등 각 Block의 편집 UI를 정리하고 필요한 기능을 보완합니다.

8. **EditorPage 조립하기**
   `PostToolbar`, `EditorToolbar`, `EditorBlock` 등을 조립하여 실제 Admin Post 작성 화면을 완성합니다.

9. **Block 추가 / 조작 UI 완성**
   Toolbar, `/` Command, Block 삭제, 순서 변경, 선택 UI 등을 연결하여 실제 편집 경험을 완성합니다.

10. **단축키 만들기**
    저장, 게시, Undo/Redo 등의 키보드 단축키를 추가합니다.

11. **PreviewPage 만들기**
    Editor의 `PostBlock[]`을 동일한 `PostRenderer`로 렌더링하여 게시 전 결과를 확인합니다.

12. **RenderPage 만들기**
    서버에서 Post 데이터를 받아 `PostRenderer`로 실제 사용자에게 게시글을 보여줍니다.

13. **Validation 만들기**
    잘못된 `type`, 필수값 누락, 잘못된 option, 잘못된 URL 등의 Post JSON을 검증합니다.

14. **저장 / 게시 API 연결**
    검증된 `PostBlock[]`을 서버에 전달하고 DB에 저장합니다.
