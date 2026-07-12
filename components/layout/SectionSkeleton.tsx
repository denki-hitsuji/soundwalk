export function SectionSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
    </div>
  );
}

export default SectionSkeleton;
