"use client";

import React, { useState } from "react";

export interface SearchFieldOption {
    label: string;
    value: string;
}

export interface SearchField {
    name: string;
    placeholder?: string;
    type?: "text" | "select";
    options?: SearchFieldOption[];
}

interface AdminSearchProps {
    fields: SearchField[];
    onSearch: (params: Record<string, string>) => void;
    onReset: () => void;
}

export const AdminSearch: React.FC<AdminSearchProps> = ({
    fields,
    onSearch,
    onReset,
}) => {
    const [values, setValues] = useState<Record<string, string>>({});

    const handleChange = (name: string, value: string) => {
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = Object.entries(values).reduce(
            (result, [key, value]) => {
                if (value.trim()) {
                    result[key] = value.trim();
                }

                return result;
            },
            {} as Record<string, string>
        );

        onSearch(params);
    };

    const handleReset = () => {
        setValues({});
        onReset();
    };

    return (
        <div className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <form
                onSubmit={handleSearch}
                className="flex flex-wrap items-center gap-3"
            >
                {fields.map((field) =>
                    field.type === "select" ? (
                        <select
                            key={field.name}
                            value={values[field.name] ?? ""}
                            onChange={(e) =>
                                handleChange(field.name, e.target.value)
                            }
                            className="min-w-[140px] px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">
                                {field.placeholder ?? `${field.name} 전체`}
                            </option>

                            {field.options?.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            key={field.name}
                            type="text"
                            value={values[field.name] ?? ""}
                            onChange={(e) =>
                                handleChange(field.name, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    )
                )}

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        검색
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        초기화
                    </button>
                </div>
            </form>
        </div>
    );
};