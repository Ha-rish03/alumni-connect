-- Create job_postings table
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  type TEXT NOT NULL DEFAULT 'job', -- 'job' or 'internship'
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  application_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Alumni can create job postings
CREATE POLICY "Alumni can create job postings"
ON public.job_postings
FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  public.has_role(auth.uid(), 'alumni')
);

-- Alumni can update their own job postings
CREATE POLICY "Alumni can update their own job postings"
ON public.job_postings
FOR UPDATE
USING (auth.uid() = author_id);

-- Alumni can delete their own job postings
CREATE POLICY "Alumni can delete their own job postings"
ON public.job_postings
FOR DELETE
USING (auth.uid() = author_id);

-- All authenticated users can view active job postings
CREATE POLICY "All users can view active job postings"
ON public.job_postings
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();