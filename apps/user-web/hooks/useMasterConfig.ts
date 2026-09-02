import { useState } from "react";
import { MasterConfig } from "@mall/types";

export type ConnectionStatus =
    | "checking"
    | "connected"
    | "disconnected"
    | "unknown";

export function useMasterConfig() {
    const [status, setStatus] =
        useState<ConnectionStatus>("checking");

    const saveConfig = (config: MasterConfig) => {
        console.log("[MasterConfig] save:", config);
    };

    const checkConnection = async () => {
        try {
            // 추후 실제 Cloudinary 테스트 API 호출
            const response = await fetch(
                "/api/master/cloudinary/ping"
            );

            if (response.ok) {
                setStatus("connected");
            } else {
                setStatus("disconnected");
            }
        } catch {
            setStatus("unknown");
        }
    };

    return {
        status,
        saveConfig,
        checkConnection,
    };
}