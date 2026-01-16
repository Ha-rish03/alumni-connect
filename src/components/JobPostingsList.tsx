import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobPostingCard } from './JobPostingCard';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface JobPostingsListProps {
  refreshTrigger?: number;
}

export const JobPostingsList = ({ refreshTrigger = 0 }: JobPostingsListProps) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]);

  const fetchJobs = async () => {
    setIsLoading(true);

    const { data: jobsData, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      setIsLoading(false);
      return;
    }

    if (jobsData && jobsData.length > 0) {
      // Fetch author profiles
      const authorIds = [...new Set(jobsData.map(j => j.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, current_position')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const jobsWithAuthors = jobsData.map(job => ({
        ...job,
        author: profileMap.get(job.author_id)
      }));

      setJobs(jobsWithAuthors);
    } else {
      setJobs([]);
    }

    setIsLoading(false);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || job.type === filterType;

    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, company, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="job">Full-time Jobs</SelectItem>
            <SelectItem value="internship">Internships</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={searchQuery || filterType !== 'all' ? Search : Briefcase}
          title={searchQuery || filterType !== 'all' ? "No matching opportunities" : "No opportunities posted yet"}
          description={
            searchQuery || filterType !== 'all'
              ? "Try adjusting your search or filters"
              : "Check back later for job and internship opportunities from alumni"
          }
          variant="student"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredJobs.map((job, index) => (
            <JobPostingCard key={job.id} job={job} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
