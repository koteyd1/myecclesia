-- Create ministers table for individual ministry profiles
CREATE TABLE public.ministers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    full_name TEXT NOT NULL,
    location TEXT NOT NULL,
    denomination TEXT,
    ministry_focus TEXT NOT NULL,
    mission_statement TEXT,
    services_offered TEXT[],
    profile_image_url TEXT,
    banner_url TEXT,
    social_media_links JSONB DEFAULT '{}'::jsonb,
    booking_links JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on slug
CREATE UNIQUE INDEX ministers_slug_unique ON public.ministers(slug);

-- Enable RLS
ALTER TABLE public.ministers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ministers
CREATE POLICY "Anyone can view verified ministers" 
ON public.ministers 
FOR SELECT 
USING (is_verified = true);

CREATE POLICY "Admins can view all ministers" 
ON public.ministers 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Users can create their own minister profile" 
ON public.ministers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own minister profile" 
ON public.ministers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any minister profile" 
ON public.ministers 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete minister profiles" 
ON public.ministers 
FOR DELETE 
USING (is_admin_user());

-- Add slug generation trigger
CREATE TRIGGER ministers_slug_trigger
    BEFORE INSERT OR UPDATE ON public.ministers
    FOR EACH ROW EXECUTE FUNCTION auto_generate_slug();

-- Add updated_at trigger
CREATE TRIGGER ministers_updated_at_trigger
    BEFORE UPDATE ON public.ministers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create minister followers table
CREATE TABLE public.minister_followers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate follows
CREATE UNIQUE INDEX minister_followers_unique ON public.minister_followers(user_id, minister_id);

-- Enable RLS on minister followers
ALTER TABLE public.minister_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for minister followers
CREATE POLICY "Users can follow ministers" 
ON public.minister_followers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow ministers" 
ON public.minister_followers 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own follows" 
ON public.minister_followers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all follows" 
ON public.minister_followers 
FOR SELECT 
USING (is_admin_user());

-- Add minister_id column to events table to link events to ministers
ALTER TABLE public.events ADD COLUMN minister_id UUID REFERENCES public.ministers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX ministers_user_id_idx ON public.ministers(user_id);
CREATE INDEX ministers_verified_idx ON public.ministers(is_verified) WHERE is_verified = true;
CREATE INDEX ministers_denomination_idx ON public.ministers(denomination);
CREATE INDEX ministers_ministry_focus_idx ON public.ministers(ministry_focus);
CREATE INDEX minister_followers_minister_id_idx ON public.minister_followers(minister_id);
CREATE INDEX events_minister_id_idx ON public.events(minister_id);

-- Create full text search index for ministers
CREATE INDEX ministers_search_idx ON public.ministers USING gin(
    to_tsvector('english', 
        coalesce(full_name, '') || ' ' || 
        coalesce(denomination, '') || ' ' || 
        coalesce(ministry_focus, '') || ' ' || 
        coalesce(mission_statement, '') || ' ' ||
        coalesce(location, '')
    )
);