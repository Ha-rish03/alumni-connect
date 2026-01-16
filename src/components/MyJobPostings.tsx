import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  GraduationCap,
  Building2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  description: string;
  is_active: boolean;
  created_at: string;
  salary_range: string | null;
}

interface MyJobPostingsProps {
  refreshTrigger?: number;
  onJobUpdated?: () => void;
}

export const MyJobPostings = ({ refreshTrigger = 0, onJobUpdated }: MyJobPostingsProps) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyJobs();
    }
  }, [user, refreshTrigger]);

  const fetchMyJobs = async () => {
    if (!user) return;
    
    setIsLoading(true);

    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my jobs:', error);
    } else {
      setJobs(data || []);
    }

    setIsLoading(false);
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('job_postings')
      .update({ is_active: !currentStatus })
      .eq('id', jobId);

    if (error) {
      console.error('Error toggling job status:', error);
      toast.error('Failed to update job status');
    } else {
      toast.success(currentStatus ? 'Job posting deactivated' : 'Job posting activated');
      fetchMyJobs();
      onJobUpdated?.();
    }
  };

  const deleteJob = async (jobId: string) => {
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job posting');
    } else {
      toast.success('Job posting deleted');
      fetchMyJobs();
      onJobUpdated?.();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No job postings yet"
        description="Create your first job or internship posting to help students find opportunities"
        variant="alumni"
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => {
        const isInternship = job.type === 'internship';
        
        return (
          <Card 
            key={job.id} 
            className={`overflow-hidden transition-all duration-300 animate-fade-up ${!job.is_active ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge 
                      variant={isInternship ? "secondary" : "default"}
                      className={isInternship 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-amber-100 text-amber-700"
                      }
                    >
                      {isInternship ? 'Internship' : 'Full-time'}
                    </Badge>
                    <Badge variant={job.is_active ? "default" : "secondary"} className={job.is_active ? "bg-green-100 text-green-700" : ""}>
                      {job.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building2 className="w-4 h-4" />
                    {job.company}
                  </CardDescription>
                </div>

                <div className={`p-2 rounded-lg ${isInternship 
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100' 
                  : 'bg-gradient-to-br from-amber-100 to-orange-100'
                }`}>
                  {isInternship ? (
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                {job.location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                )}
                {job.salary_range && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <DollarSign className="w-4 h-4" />
                    {job.salary_range}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleJobStatus(job.id, job.is_active)}
                  className="gap-2"
                >
                  {job.is_active ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the job posting "{job.title}" at {job.company}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteJob(job.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
