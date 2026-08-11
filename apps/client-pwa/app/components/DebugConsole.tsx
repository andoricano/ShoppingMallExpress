// app/components/debug/DebugConsole.tsx

'use client';

import React from 'react';


import DebugInput from './DebugInput';
import DebugPanel from './DebugPanel';
import DebugToolbar from './DebugToolbar';
import DebugTopbar from './DebugTopbar';
import { useDebug } from './useDebug';
import DebugToolButton from './DebugToolButton';

export default function DebugConsole() {
    const {
        logs,
        clearLogs,
        status,
        ping,
        getItems,
        createItem,
        updateItem,
        deleteItem,
        handleCommand,
    } = useDebug();

    return (
        <div className="flex h-full min-h-0 flex-col">
            <DebugTopbar
                title="Debug Console"
                status={status}
            />

            <DebugToolbar>
                <DebugToolButton onClick={clearLogs}>CLEAR</DebugToolButton>
                {/* <button onClick={ping}>PING</button> */}
            </DebugToolbar>

            <DebugPanel lines={logs} />

            <DebugToolbar position="bottom">
                <DebugToolButton onClick={getItems}>GET</DebugToolButton>
                <DebugToolButton onClick={createItem}>CREATE</DebugToolButton>
                <DebugToolButton onClick={updateItem}>UPDATE</DebugToolButton>
                <DebugToolButton onClick={deleteItem}>DELETE</DebugToolButton>
            </DebugToolbar>

            <DebugInput
                onSubmit={handleCommand}
            />
        </div>
    );
}