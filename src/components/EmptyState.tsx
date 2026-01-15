import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "default" | "student" | "alumni";
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = "default" 
}: EmptyStateProps) => {
  const iconBgClasses = {
    default: "bg-muted",
    student: "bg-gradient-to-br from-blue-100 to-indigo-100",
    alumni: "bg-gradient-to-br from-amber-100 to-orange-100"
  };

  const iconClasses = {
    default: "text-muted-foreground",
    student: "text-blue-600",
    alumni: "text-amber-600"
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-up">
      <div className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float",
        iconBgClasses[variant]
      )}>
        <Icon className={cn("w-10 h-10", iconClasses[variant])} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
};
