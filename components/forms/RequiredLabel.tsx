// components/form/RequiredLabel.tsx
export function RequiredLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span>
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
    </span>
  );
}
