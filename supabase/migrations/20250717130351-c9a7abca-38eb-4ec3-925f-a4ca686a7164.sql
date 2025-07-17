-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Create policies for file uploads
CREATE POLICY "Anyone can view uploaded files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);