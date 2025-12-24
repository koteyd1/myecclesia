-- Create enum for opportunity types
CREATE TYPE public.opportunity_type AS ENUM ('job', 'volunteer', 'internship');

-- Create enum for application method
CREATE TYPE public.application_method AS ENUM ('external', 'in_app', 'both');

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type opportunity_type NOT NULL,
  application_method application_method NOT NULL DEFAULT 'external',
  external_url TEXT,
  location TEXT NOT NULL,
  is_remote BOOLEAN DEFAULT false,
  requirements TEXT,
  responsibilities TEXT,
  salary_range TEXT,
  hours_per_week TEXT,
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Posted by organization or minister
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  minister_id UUID REFERENCES public.ministers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure at least one of organization_id or minister_id is set
  CONSTRAINT opportunity_has_poster CHECK (organization_id IS NOT NULL OR minister_id IS NOT NULL)
);

-- Create applications table for in-app applications
CREATE TABLE public.opportunity_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(opportunity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Opportunities policies
CREATE POLICY "Anyone can view active opportunities"
ON public.opportunities
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all opportunities"
ON public.opportunities
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Verified organizations can create opportunities"
ON public.opportunities
FOR INSERT
WITH CHECK (
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id 
    AND user_id = auth.uid() 
    AND is_verified = true
  ))
  OR
  (minister_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ministers 
    WHERE id = minister_id 
    AND user_id = auth.uid() 
    AND is_verified = true
  ))
);

CREATE POLICY "Poster can update their opportunities"
ON public.opportunities
FOR UPDATE
USING (
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id 
    AND user_id = auth.uid()
  ))
  OR
  (minister_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ministers 
    WHERE id = minister_id 
    AND user_id = auth.uid()
  ))
  OR is_admin_user()
);

CREATE POLICY "Poster can delete their opportunities"
ON public.opportunities
FOR DELETE
USING (
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id 
    AND user_id = auth.uid()
  ))
  OR
  (minister_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ministers 
    WHERE id = minister_id 
    AND user_id = auth.uid()
  ))
  OR is_admin_user()
);

-- Applications policies
CREATE POLICY "Users can view their own applications"
ON public.opportunity_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Opportunity posters can view applications"
ON public.opportunity_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
    AND (
      (o.organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.organizations org
        WHERE org.id = o.organization_id AND org.user_id = auth.uid()
      ))
      OR
      (o.minister_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.ministers m
        WHERE m.id = o.minister_id AND m.user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Authenticated users can apply"
ON public.opportunity_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON public.opportunity_applications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Posters can update application status"
ON public.opportunity_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
    AND (
      (o.organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.organizations org
        WHERE org.id = o.organization_id AND org.user_id = auth.uid()
      ))
      OR
      (o.minister_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.ministers m
        WHERE m.id = o.minister_id AND m.user_id = auth.uid()
      ))
    )
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunity_applications_updated_at
BEFORE UPDATE ON public.opportunity_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();