import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  variant: "blue" | "green" | "purple" | "amber" | "red";
  index?: number;
}

export const StatsCard = ({ icon: Icon, value, label, variant, index = 0 }: StatsCardProps) => {
  const variants = {
    blue: {
      bg: "bg-gradient-to-br from-blue-100 to-blue-50",
      icon: "text-blue-600",
      border: "border-blue-200/50 hover:border-blue-300",
      glow: "group-hover:shadow-blue-100/50"
    },
    green: {
      bg: "bg-gradient-to-br from-green-100 to-green-50",
      icon: "text-green-600",
      border: "border-green-200/50 hover:border-green-300",
      glow: "group-hover:shadow-green-100/50"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-100 to-purple-50",
      icon: "text-purple-600",
      border: "border-purple-200/50 hover:border-purple-300",
      glow: "group-hover:shadow-purple-100/50"
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-100 to-amber-50",
      icon: "text-amber-600",
      border: "border-amber-200/50 hover:border-amber-300",
      glow: "group-hover:shadow-amber-100/50"
    },
    red: {
      bg: "bg-gradient-to-br from-red-100 to-red-50",
      icon: "text-red-600",
      border: "border-red-200/50 hover:border-red-300",
      glow: "group-hover:shadow-red-100/50"
    }
  };

  const v = variants[variant];

  return (
    <Card 
      className={cn(
        "group shadow-soft animate-fade-up transition-all duration-300 hover:shadow-lg cursor-default",
        v.border,
        v.glow
      )}
      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
            v.bg
          )}>
            <Icon className={cn("w-6 h-6", v.icon)} />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
