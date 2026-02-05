-- Fix 1: Add INSERT policy for notifications table
-- Only allow system/service role to create notifications (not regular users)
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (false);
-- Note: Notifications should be created via edge functions using service role

-- Fix 2: The profiles table RLS is already correctly configured
-- Users can only see their own profile, which is secure
-- The email is stored in auth.users by Supabase, profiles just mirrors it for convenience
-- No changes needed for profiles RLS

-- Fix 3: For GitHub access tokens, we'll add a comment noting they should be 
-- accessed only via edge functions with service role (which is already the case)
-- The tokens are protected by RLS - users can only see their own connection
-- Edge functions use service role to access tokens securely

COMMENT ON COLUMN public.github_connections.access_token IS 
'Access token is protected by RLS. Only accessible via service role in edge functions. Consider using Supabase Vault for additional encryption at rest.';