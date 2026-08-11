// app/hooks/useDebug.ts

'use client';

import { useState } from 'react';
import { createInventoryItem, deleteInventoryItem, getInventoryItems, updateInventoryItem } from '../repo/Mockup';
import { DebugLine } from './DebugType';


export type DebugStatus =
    | 'idle'
    | 'running'
    | 'success'
    | 'error';

export function useDebug() {
    const [logs, setLogs] = useState<DebugLine[]>([
        {
            text: '[Debug] Console started.',
            color: '#ffffff',
        },
    ]);

    const clearLogs = () => {
        setLogs([]);
    };


    const [status, setStatus] = useState<DebugStatus>('idle');

    const addLog = (
        text: string,
        color = '#ffffff',
    ) => {
        setLogs((prev) => [
            ...prev,
            {
                text,
                color,
            },
        ]);
    };

    const ping = async () => {
        try {
            setStatus('running');

            addLog('[PING] 요청');

            addLog('[PING] OK', '#00ff00');

            setStatus('success');
        } catch (error) {
            addLog(
                `[PING] ERROR: ${String(error)}`,
                '#ff4444',
            );

            setStatus('error');
        }
    };


    // READ
    const getItems = async () => {
        try {
            setStatus('running');

            addLog('[GET] InventoryItem 요청');

            const items = await getInventoryItems();

            addLog(
                `[SUCCESS] ${items.length}개 조회됨`,
                '#00ff00',
            );

            addLog(
                JSON.stringify(items, null, 2),
            );

            setStatus('success');

            return items;
        } catch (error) {
            const message = String(error);

            addLog(
                `[ERROR] ${message}`,
                '#ff4444',
            );

            setStatus('error');
        }
    };




    const createUuid = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x'
                    ? r
                    : (r & 0x3) | 0x8;

                return v.toString(16);
            },
        );
    };

    // CREATE
    const createItem = async () => {
        try {
            setStatus('running');

            const item = {
                uuid: createUuid(),
                name: 'Debug 상품',
                cnt: 10,
                meta: {
                    size: 'L',
                    color: 'red',
                },
            };

            addLog('[CREATE] InventoryItem 생성');

            const created = await createInventoryItem(item);

            addLog(
                `[SUCCESS] 생성 완료: ${created.uuid}`,
                '#00ff00',
            );

            setStatus('success');

            return created;
        } catch (error) {
            const message = String(error);

            addLog(
                `[ERROR] ${message}`,
                '#ff4444',
            );

            setStatus('error');
        }
    };



    // UPDATE
    const updateItem = async () => {
        try {
            setStatus('running');

            const items = await getInventoryItems();

            if (items.length === 0) {
                addLog(
                    '[UPDATE] 수정할 데이터가 없습니다.',
                    '#ffaa00',
                );

                setStatus('idle');

                return;
            }

            const target = items[0];

            const updated = await updateInventoryItem(
                target.uuid,
                {
                    cnt: 9999,
                },
            );

            if (!updated) {
                addLog(
                    '[UPDATE] 대상 데이터를 찾지 못했습니다.',
                    '#ffaa00',
                );

                setStatus('idle');

                return;
            }

            addLog(
                `[SUCCESS] ${target.uuid} cnt: ${target.cnt} → ${updated.cnt}`,
                '#00ff00',
            );

            setStatus('success');

            return updated;
        } catch (error) {
            const message = String(error);

            addLog(
                `[ERROR] ${message}`,
                '#ff4444',
            );

            setStatus('error');
        }
    };

    // DELETE
    const deleteItem = async () => {
        try {
            setStatus('running');

            const items = await getInventoryItems();

            if (items.length === 0) {
                addLog(
                    '[DELETE] 삭제할 데이터가 없습니다.',
                    '#ffaa00',
                );

                setStatus('idle');

                return;
            }

            const target = items[0];

            const deleted = await deleteInventoryItem(
                target.uuid,
            );

            if (!deleted) {
                addLog(
                    '[DELETE] 대상 데이터를 찾지 못했습니다.',
                    '#ffaa00',
                );

                setStatus('idle');

                return;
            }

            addLog(
                `[SUCCESS] 삭제 완료: ${deleted.name}`,
                '#00ff00',
            );

            setStatus('success');

            return deleted;
        } catch (error) {
            const message = String(error);

            addLog(
                `[ERROR] ${message}`,
                '#ff4444',
            );

            setStatus('error');
        }
    };

    // INPUT
    const handleCommand = (value: string) => {
        addLog(`> ${value}`);
    };

    return {
        logs,
        clearLogs,
        status,
        ping,
        getItems,
        createItem,
        updateItem,
        deleteItem,
        handleCommand,
    };
}