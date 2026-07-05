const SkeletonBlock = ({ h = "h-4", w = "w-full", round = "rounded-lg", className = "" }) => (
  <div className={`skeleton ${h} ${w} ${round} ${className}`} />
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

export default SkeletonBlock;
