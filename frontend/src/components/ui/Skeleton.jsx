import { cn } from "../../lib/utils";

export function Skeleton({ className }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card p-5">
      <Skeleton className="mb-4 h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("mb-2.5 h-4", i % 2 ? "w-5/6" : "w-full")} />
      ))}
    </div>
  );
}
