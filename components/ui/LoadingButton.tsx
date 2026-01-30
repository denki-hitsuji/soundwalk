"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "dark";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600",
  secondary:
    "border bg-white text-gray-700 hover:bg-gray-50 disabled:bg-white",
  dark:
    "bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-800",
};

export function LoadingButton({
  loading = false,
  loadingText,
  variant = "primary",
  children,
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}
