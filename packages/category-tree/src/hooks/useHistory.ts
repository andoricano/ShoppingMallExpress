// packages/category-tree/src/hooks/useHistory.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

export function useHistory<T>(
    initialValue: T,
) {
    const [
        value,
        setValue,
    ] = useState<T>(initialValue);

    const [
        undoStack,
        setUndoStack,
    ] = useState<T[]>([]);

    const [
        redoStack,
        setRedoStack,
    ] = useState<T[]>([]);

    /**
     * History 기록 없이 값 변경
     */
    const set = useCallback(
        (nextValue: T) => {
            setValue(nextValue);
        },
        [],
    );

    /**
     * 현재 값을 Undo Stack에 기록하고
     * 새로운 값을 적용
     */
    const commit = useCallback(
        (nextValue: T) => {
            setUndoStack((current) => [
                ...current,
                value,
            ]);

            setRedoStack([]);

            setValue(nextValue);
        },
        [value],
    );

    /**
     * Undo
     */
    const undo = useCallback(() => {
        const previous =
            undoStack.at(-1);

        if (previous === undefined) {
            return;
        }

        setUndoStack((current) =>
            current.slice(0, -1),
        );

        setRedoStack((current) => [
            value,
            ...current,
        ]);

        setValue(previous);
    }, [undoStack, value]);

    /**
     * Redo
     */
    const redo = useCallback(() => {
        const next = redoStack[0];

        if (next === undefined) {
            return;
        }

        setRedoStack((current) =>
            current.slice(1),
        );

        setUndoStack((current) => [
            ...current,
            value,
        ]);

        setValue(next);
    }, [redoStack, value]);

    /**
     * History와 현재 값을 모두 초기화
     */
    const reset = useCallback(
        (nextValue: T) => {
            setValue(nextValue);
            setUndoStack([]);
            setRedoStack([]);
        },
        [],
    );

    return {
        value,

        set,
        commit,

        undo,
        redo,
        reset,

        canUndo:
            undoStack.length > 0,

        canRedo:
            redoStack.length > 0,
    };
}