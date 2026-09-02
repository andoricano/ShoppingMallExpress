type InputProps = {
    label: string;
    type?: "text" | "number" | "password";
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    min?: number;
    step?: number;
};

export function MasterInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    min,
    step,
}: InputProps) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}
            </label>

            <input
                type={type}
                min={min}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
        </div>
    );
}