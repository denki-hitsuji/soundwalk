import SectionSkeleton from "@/components/layout/SectionSkeleton";

export default function Loading() {
  return (
    <main className="w-full mx-auto space-y-4 p-4">
      <SectionSkeleton />
      <div className="h-40 animate-pulse rounded-lg bg-gray-200" aria-hidden="true" />
    </main>
  );
}
