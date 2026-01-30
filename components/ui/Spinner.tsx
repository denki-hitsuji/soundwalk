"use client";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-3",
};

export function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-current border-t-transparent opacity-70 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="読み込み中"
    />
  );
}
