-- Create organizations table for faith-based organizer profiles
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United Kingdom',
  denomination TEXT,
  mission_statement TEXT,
  services_offered TEXT[],
  safeguarding_contact TEXT,
  logo_url TEXT,
  banner_url TEXT,
  social_media_links JSONB DEFAULT '{}',
  slug TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view verified organizations" 
ON public.organizations 
FOR SELECT 
USING (is_verified = true);

CREATE POLICY "Admins can view all organizations" 
ON public.organizations 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Users can create their own organization" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization" 
ON public.organizations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any organization" 
ON public.organizations 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete organizations" 
ON public.organizations 
FOR DELETE 
USING (is_admin_user());

-- Create followers table for subscription functionality
CREATE TABLE public.organization_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS for followers
ALTER TABLE public.organization_followers ENABLE ROW LEVEL SECURITY;

-- Create policies for followers
CREATE POLICY "Users can follow organizations" 
ON public.organization_followers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow organizations" 
ON public.organization_followers 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own follows" 
ON public.organization_followers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all follows" 
ON public.organization_followers 
FOR SELECT 
USING (is_admin_user());

-- Create index for better performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_user_id ON public.organizations(user_id);
CREATE INDEX idx_organization_followers_org_id ON public.organization_followers(organization_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for automatic slug generation
CREATE TRIGGER auto_generate_organization_slug
BEFORE INSERT OR UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_slug();

-- Update events table to link with organizations
ALTER TABLE public.events ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;