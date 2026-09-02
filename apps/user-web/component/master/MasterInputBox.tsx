import { MasterConfig } from "@mall/types";
import { MasterInput } from "./MasterInput";

interface MasterInputBoxProps {
    config: MasterConfig;
    setConfig: React.Dispatch<React.SetStateAction<MasterConfig>>;
    onSave: (config: MasterConfig) => void;
}

export function MasterInputBox({
    config,
    setConfig,
    onSave,
}: MasterInputBoxProps) {
    return (
        <div className="w-full  max-w-5xl p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-800">
                    API 설정
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Cloudinary에서 발급받은 API 정보를 입력하세요.
                </p>
            </div>

            <div className="space-y-5">
                <MasterInput
                    label="Cloud Name"
                    value={config.cloudinaryCloudName}
                    onChange={(value) =>
                        setConfig((prev) => ({
                            ...prev,
                            cloudinaryCloudName: value,
                        }))
                    }
                    placeholder="Cloud Name을 입력하세요"
                />

                <MasterInput
                    label="API Key"
                    value={config.cloudinaryApiKey}
                    onChange={(value) =>
                        setConfig((prev) => ({
                            ...prev,
                            cloudinaryApiKey: value,
                        }))
                    }
                    placeholder="API Key를 입력하세요"
                />

                <MasterInput
                    label="API Secret"
                    type="password"
                    value={config.cloudinaryApiSecret}
                    onChange={(value) =>
                        setConfig((prev) => ({
                            ...prev,
                            cloudinaryApiSecret: value,
                        }))
                    }
                    placeholder="API Secret을 입력하세요"
                />
            </div>

            <div className="flex justify-end mt-6 pt-5 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => onSave(config)}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 active:bg-slate-900 transition-colors shadow-sm"
                >
                    설정 저장
                </button>
            </div>
        </div>
    );
}