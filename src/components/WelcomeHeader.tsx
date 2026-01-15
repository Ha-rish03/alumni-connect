import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeHeaderProps {
  name: string;
  avatarUrl: string | null;
  role: "student" | "alumni";
  subtitle: string;
}

export const WelcomeHeader = ({ name, avatarUrl, role, subtitle }: WelcomeHeaderProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isStudent = role === "student";

  return (
    <div className="mb-8 animate-fade-up">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className={cn(
            "w-16 h-16 ring-4 shadow-lg transition-transform hover:scale-105",
            isStudent ? "ring-blue-100" : "ring-amber-100"
          )}>
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className={cn(
              "text-white text-xl font-semibold",
              isStudent 
                ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
                : "bg-gradient-to-br from-amber-500 to-orange-600"
            )}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-1 -right-1 rounded-full p-1.5 ring-2 ring-white",
            isStudent ? "bg-blue-500" : "bg-amber-500"
          )}>
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome, {name.split(' ')[0]}!
            </h1>
            <Badge className={cn(
              "hidden sm:inline-flex",
              isStudent 
                ? "bg-blue-100 text-blue-700 hover:bg-blue-100" 
                : "bg-amber-100 text-amber-700 hover:bg-amber-100"
            )}>
              {isStudent ? "Student" : "Alumni"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
