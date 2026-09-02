"use client";

import { useState } from "react";
import { MasterConfig } from "@mall/types";
import { useMasterConfig } from "@/hooks/useMasterConfig";
import { AdminHeader } from "../common/AdminHeader";
import { MasterInputBox } from "./MasterInputBox";
import { MasterConnectionStatus } from "./MasterConnectionStatus";
export function MasterConfigSection() {
    const {
        status,
        saveConfig,
    } = useMasterConfig();

    const [config, setConfig] = useState<MasterConfig>({
        cloudinaryCloudName: "",
        cloudinaryApiKey: "",
        cloudinaryApiSecret: "",
    });

    return (
        <section className="max-w-5xl my-10 mx-auto space-y-6">
            <AdminHeader
                title="Cloudinary 설정"
                description="Cloudinary API 연결에 필요한 정보를 설정합니다."
            />

            <MasterConnectionStatus status={status} />

            <MasterInputBox
                config={config}
                setConfig={setConfig}
                onSave={saveConfig}
            />
        </section>
    );
}