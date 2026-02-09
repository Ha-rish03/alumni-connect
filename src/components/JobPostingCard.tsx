import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Clock,
  Building2,
  GraduationCap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobPosting {
  id: string;
  author_id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  application_link: string | null;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    current_position: string | null;
  };
}

interface JobPostingCardProps {
  job: JobPosting;
  index?: number;
  showAuthor?: boolean;
}

export const JobPostingCard = ({ job, index = 0, showAuthor = true }: JobPostingCardProps) => {
  const isInternship = job.type === 'internship';

  return (
    <Card 
      className="group overflow-hidden border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-elevated animate-fade-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${isInternship ? 'from-purple-50/50' : 'from-amber-50/50'} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={isInternship ? "secondary" : "default"}
                className={isInternship 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-100" 
                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                }
              >
                {isInternship ? (
                  <>
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Internship
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3 h-3 mr-1" />
                    Full-time
                  </>
                )}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
            </div>
            <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Building2 className="w-4 h-4" />
              {job.company}
            </CardDescription>
          </div>
          
          <div className={`p-3 rounded-xl ${isInternship 
            ? 'bg-gradient-to-br from-purple-100 to-pink-100' 
            : 'bg-gradient-to-br from-amber-100 to-orange-100'
          } shrink-0`}>
            {isInternship ? (
              <GraduationCap className="w-6 h-6 text-purple-600" />
            ) : (
              <Briefcase className="w-6 h-6 text-amber-600" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm">
          {job.location && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
          )}
          {job.salary_range && (
            <span className="text-green-600 font-medium">
              {job.salary_range}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>

        {/* Requirements preview */}
        {job.requirements && (
          <div className="text-sm">
            <span className="font-medium text-foreground">Requirements:</span>
            <p className="text-muted-foreground line-clamp-2 mt-1">{job.requirements}</p>
          </div>
        )}

        {/* Author info */}
        {showAuthor && job.author && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="w-8 h-8">
              <AvatarImage src={job.author.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                {job.author.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{job.author.full_name}</p>
              {job.author.current_position && (
                <p className="text-xs text-muted-foreground truncate">{job.author.current_position}</p>
              )}
            </div>
          </div>
        )}

        {/* Apply button */}
        {job.application_link && (
          <Button 
            asChild 
            className={`w-full gap-2 ${isInternship 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
            }`}
          >
            <a href={job.application_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Apply Now
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
