import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "outline" | "destructive" | "secondary" | "success";
type Size = "default" | "sm";

export interface CrButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  secondary: "bg-gray-600 text-white hover:bg-gray-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3 text-xs",
};

export function CrButton({
  type = "button",
  className = "",
  variant = "default",
  size = "default",
  ...props
}: CrButtonProps) {
  const v = variants[variant];
  return (
    <button
      type={type}
      className={`${base} ${v} ${sizes[size]} ${className}`.trim()}
      {...props}
    />
  );
}
