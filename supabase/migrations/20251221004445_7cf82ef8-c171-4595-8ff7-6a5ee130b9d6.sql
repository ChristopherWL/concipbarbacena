-- Add branch_id column to profiles for user's assigned branch
ALTER TABLE public.profiles 
ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_profiles_branch_id ON public.profiles(branch_id);

-- Comment for clarity
COMMENT ON COLUMN public.profiles.branch_id IS 'The branch this user is assigned to. Regular users can only see data from this branch.';
COMMENT ON COLUMN public.profiles.selected_branch_id IS 'Optional branch filter selection for users who can see multiple branches (matriz, director).';