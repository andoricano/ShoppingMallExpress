// component/common/FormField.tsx

"use client";

interface FormFieldProps {
    label: string;
    value: string;
    onChange?: (value: string) => void;

    type?: "text" | "number" | "url";
    placeholder?: string;
    disabled?: boolean;
    textarea?: boolean;
    rows?: number;
    min?: number;
    step?: number;
}

export default function FormField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    disabled = false,
    textarea = false,
    rows = 4,
    min,
    step,
}: FormFieldProps) {
    const className =
        "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 " +
        "disabled:bg-slate-100 disabled:text-slate-400";

    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}
            </label>

            {textarea ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    className={`${className} resize-none`}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min}
                    step={step}
                    className={className}
                />
            )}
        </div>
    );
}