-- Allow profile owners to delete their own ministry profiles

-- Ministers: allow the profile owner (user_id) to delete their own row.
CREATE POLICY "Users can delete their own minister profile"
ON public.ministers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Organizations: allow the profile owner (user_id) to delete their own row.
CREATE POLICY "Users can delete their own organization"
ON public.organizations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

