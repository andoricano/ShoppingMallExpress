// component/common/CheckboxField.tsx

"use client";

interface CheckboxFieldProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export default function CheckboxField({
    label,
    checked,
    onChange,
    disabled = false,
}: CheckboxFieldProps) {
    return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />

            {label}
        </label>
    );
}