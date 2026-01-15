import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, UserPlus, MessageCircle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  profile: {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    department: string | null;
    graduation_year: number | null;
    current_company: string | null;
    current_position: string | null;
  };
  role: "student" | "alumni";
  connectionStatus: "none" | "pending" | "connected";
  onConnect?: () => void;
  onMessage?: () => void;
  isConnecting?: boolean;
  index?: number;
}

export const ProfileCard = ({
  profile,
  role,
  connectionStatus,
  onConnect,
  onMessage,
  isConnecting,
  index = 0
}: ProfileCardProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isStudent = role === "student";
  
  const cardClasses = isStudent
    ? "border-green-100/50 hover:border-green-200 hover:shadow-lg"
    : "border-blue-100/50 hover:border-blue-200 hover:shadow-lg";
  
  const avatarClasses = isStudent
    ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
    : "bg-gradient-to-br from-blue-400 to-indigo-500 text-white";
  
  const badgeClasses = isStudent
    ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200";

  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-300 animate-fade-up",
        cardClasses
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <CardContent className="pt-6 relative">
        {/* Subtle gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          isStudent 
            ? "bg-gradient-to-br from-green-50/50 to-transparent" 
            : "bg-gradient-to-br from-blue-50/50 to-transparent"
        )} />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="relative">
            <Avatar className="w-14 h-14 ring-2 ring-white shadow-md transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className={avatarClasses}>
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            {connectionStatus === "connected" && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 ring-2 ring-white">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-base group-hover:text-primary transition-colors">
              {profile.full_name}
            </h3>
            <Badge variant="outline" className={cn("text-xs mb-1", badgeClasses)}>
              {isStudent ? "Student" : "Alumni"}
            </Badge>
            
            {profile.current_position && (
              <p className="text-sm text-muted-foreground truncate">
                {profile.current_position}
              </p>
            )}
            
            {profile.current_company && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Building className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{profile.current_company}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {profile.department && (
                <Badge variant="outline" className="text-xs">
                  {profile.department}
                </Badge>
              )}
              {profile.graduation_year && (
                <Badge variant="secondary" className="text-xs">
                  Class of {profile.graduation_year}
                </Badge>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              {connectionStatus === "connected" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-green-200 text-green-700 hover:bg-green-50"
                  onClick={onMessage}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              ) : connectionStatus === "pending" ? (
                <Badge variant="secondary" className="py-1.5 px-3">
                  Request Sent
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className={cn(
                    "gap-1 transition-all",
                    isStudent 
                      ? "bg-amber-500 hover:bg-amber-600" 
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={onConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
