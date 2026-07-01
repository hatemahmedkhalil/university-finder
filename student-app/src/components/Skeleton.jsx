const SkeletonBlock = ({ h = "h-4", w = "w-full", round = "rounded-lg", className = "" }) => (
  <div className={`skeleton ${h} ${w} ${round} ${className}`} />
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock key={i} h="h-3" w={i === lines - 1 ? "w-3/5" : "w-full"} />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <SkeletonBlock h="h-5" w="w-2/3" />
      <SkeletonBlock h="h-5" w="w-16" round="rounded-full" />
    </div>
    <div className="flex gap-2">
      <SkeletonBlock h="h-5" w="w-16" round="rounded-full" />
      <SkeletonBlock h="h-5" w="w-20" round="rounded-full" />
      <SkeletonBlock h="h-5" w="w-14" round="rounded-full" />
    </div>
    <SkeletonBlock h="h-3" />
    <SkeletonBlock h="h-3" w="w-5/6" />
    <SkeletonBlock h="h-3" w="w-2/3" />
    <div className="mt-auto pt-2 flex justify-between items-center">
      <SkeletonBlock h="h-4" w="w-24" />
      <SkeletonBlock h="h-4" w="w-16" />
    </div>
  </div>
);

export const SkeletonStatCard = () => (
  <div className="rounded-2xl p-5 flex flex-col gap-3 overflow-hidden relative" style={{ background: "var(--sk-from)" }}>
    <div className="flex items-start justify-between">
      <SkeletonBlock h="h-8" w="w-8" round="rounded-lg" />
      <SkeletonBlock h="h-8" w="w-16" round="rounded-lg" />
    </div>
    <SkeletonBlock h="h-4" w="w-2/3" />
  </div>
);

export const SkeletonMatchRow = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
    <SkeletonBlock h="h-7" w="w-7" round="rounded-lg" />
    <SkeletonBlock h="h-6" w="w-6" round="rounded-sm" />
    <div className="flex-1 space-y-2">
      <SkeletonBlock h="h-4" w="w-1/2" />
      <SkeletonBlock h="h-3" w="w-1/3" />
    </div>
    <SkeletonBlock h="h-10" w="w-10" round="rounded-full" />
  </div>
);

export default SkeletonBlock;
