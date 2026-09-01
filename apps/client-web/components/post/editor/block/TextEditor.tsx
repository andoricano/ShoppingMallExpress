// post/editor/TextEditor.tsx

import { TextBlock, TextOption } from "../../PostType";


export type TextEditorProps = {
    block: TextBlock;
    onChange: (block: TextBlock) => void;
};

const DEFAULT_OPTION: Required<TextOption> = {
    align: 'left',
    size: 'medium',
    weight: 'normal',
};

export function TextEditor({
    block,
    onChange,
}: TextEditorProps) {
    const option = {
        ...DEFAULT_OPTION,
        ...block.option,
    };

    const handleTextChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        onChange({
            ...block,
            data: {
                ...block.data,
                text: event.target.value,
            },
        });
    };

    const handleOptionChange = <K extends keyof TextOption>(
        key: K,
        value: NonNullable<TextOption[K]>,
    ) => {
        onChange({
            ...block,
            option: {
                ...block.option,
                [key]: value,
            },
        });
    };

    return (
        <div>
            <textarea
                value={block.data.text}
                onChange={handleTextChange}
                placeholder="내용을 입력하세요."
            />

            <div>
                <select
                    value={option.align}
                    onChange={(event) =>
                        handleOptionChange(
                            'align',
                            event.target.value as 'left' | 'center' | 'right',
                        )
                    }
                >
                    <option value="left">왼쪽</option>
                    <option value="center">가운데</option>
                    <option value="right">오른쪽</option>
                </select>

                <select
                    value={option.size}
                    onChange={(event) =>
                        handleOptionChange(
                            'size',
                            event.target.value as 'small' | 'medium' | 'large',
                        )
                    }
                >
                    <option value="small">작게</option>
                    <option value="medium">보통</option>
                    <option value="large">크게</option>
                </select>

                <select
                    value={option.weight}
                    onChange={(event) =>
                        handleOptionChange(
                            'weight',
                            event.target.value as 'normal' | 'bold',
                        )
                    }
                >
                    <option value="normal">보통</option>
                    <option value="bold">굵게</option>
                </select>
            </div>
        </div>
    );
}