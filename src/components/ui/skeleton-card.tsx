import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ProfileCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 mt-2" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = () => (
  <Card className="shadow-soft">
    <CardContent className="pt-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const MessageSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex justify-start">
      <Skeleton className="h-12 w-48 rounded-2xl" />
    </div>
    <div className="flex justify-end">
      <Skeleton className="h-12 w-56 rounded-2xl" />
    </div>
    <div className="flex justify-start">
      <Skeleton className="h-16 w-64 rounded-2xl" />
    </div>
  </div>
);
