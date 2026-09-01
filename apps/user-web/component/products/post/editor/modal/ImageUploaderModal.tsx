// post/editor/modal/ImageUploaderModal.tsx

'use client';

import { useState } from 'react';

export type ImageUploaderModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
};

export function ImageUploaderModal({
    open,
    onClose,
    onSubmit,
}: ImageUploaderModalProps) {
    const [url, setUrl] = useState('');

    if (!open) {
        return null;
    }

    const handleSubmit = () => {
        const value = url.trim();

        if (!value) {
            return;
        }

        onSubmit(value);
        setUrl('');
        onClose();
    };

    const handleClose = () => {
        setUrl('');
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
            }}
        >
            <div
                style={{
                    width: '400px',
                    padding: '24px',
                    background: '#fff',
                    borderRadius: '8px',
                }}
            >
                <h3>이미지 추가</h3>

                <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="이미지 URL을 입력하세요."
                    style={{
                        width: '100%',
                        marginBottom: '12px',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                    }}
                >
                    <button
                        type="button"
                        onClick={handleClose}
                    >
                        취소
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                    >
                        추가
                    </button>
                </div>
            </div>
        </div>
    );
}