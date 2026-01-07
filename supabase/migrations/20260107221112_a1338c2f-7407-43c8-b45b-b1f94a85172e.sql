-- Extend app_role enum for marketplace roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consulting_firm';

-- Profiles table for all users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Consulting firms (organizations/workspaces)
CREATE TABLE public.consulting_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Firm members (consultants belonging to a firm)
CREATE TABLE public.firm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES public.consulting_firms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(firm_id, user_id)
);

-- Consultant profiles (extended info for consultants)
CREATE TABLE public.consultant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline text,
  expertise text[],
  hourly_rate numeric(10,2),
  years_experience integer,
  linkedin_url text,
  is_available boolean DEFAULT true,
  maturity_level text,
  maturity_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Client companies
CREATE TABLE public.client_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text NOT NULL,
  industry text,
  company_size text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Projects posted by clients
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  duration_weeks integer,
  expertise_needed text[],
  status text NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Proposals from consultants
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  consultant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cover_letter text NOT NULL,
  proposed_budget numeric(12,2),
  proposed_duration_weeks integer,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, consultant_id)
);

-- Project messages (inbox by project)
CREATE TABLE public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Training courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  duration_minutes integer,
  difficulty text DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course lessons
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  order_index integer NOT NULL,
  duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User course progress
CREATE TABLE public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz,
  progress_percent integer DEFAULT 0,
  UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Consulting firms policies
CREATE POLICY "Firms are viewable by everyone" ON public.consulting_firms FOR SELECT USING (true);
CREATE POLICY "Owners can update their firm" ON public.consulting_firms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create firms" ON public.consulting_firms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their firm" ON public.consulting_firms FOR DELETE USING (auth.uid() = owner_id);

-- Firm members policies
CREATE POLICY "Members are viewable by everyone" ON public.firm_members FOR SELECT USING (true);
CREATE POLICY "Firm owners can manage members" ON public.firm_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.consulting_firms WHERE id = firm_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can leave firms" ON public.firm_members FOR DELETE USING (auth.uid() = user_id);

-- Consultant profiles policies
CREATE POLICY "Consultant profiles are viewable by everyone" ON public.consultant_profiles FOR SELECT USING (true);
CREATE POLICY "Consultants can update own profile" ON public.consultant_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Consultants can insert own profile" ON public.consultant_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Client companies policies
CREATE POLICY "Client companies are viewable by everyone" ON public.client_companies FOR SELECT USING (true);
CREATE POLICY "Clients can update own company" ON public.client_companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clients can insert own company" ON public.client_companies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Open projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Clients can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Clients can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = client_id);

-- Proposals policies
CREATE POLICY "Project owners can view proposals" ON public.proposals FOR SELECT USING (
  auth.uid() = consultant_id OR 
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND client_id = auth.uid())
);
CREATE POLICY "Consultants can create proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = consultant_id);
CREATE POLICY "Consultants can update own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = consultant_id);
CREATE POLICY "Proposal status can be updated by project owner" ON public.proposals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND client_id = auth.uid())
);

-- Project messages policies
CREATE POLICY "Users can view their messages" ON public.project_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON public.project_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can mark as read" ON public.project_messages FOR UPDATE USING (auth.uid() = recipient_id);

-- Courses policies (public for reading)
CREATE POLICY "Published courses are viewable by everyone" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Course lessons policies
CREATE POLICY "Lessons are viewable if course is published" ON public.course_lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true)
);
CREATE POLICY "Admins can manage lessons" ON public.course_lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Course progress policies
CREATE POLICY "Users can view own progress" ON public.course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress records" ON public.course_progress FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consulting_firms_updated_at BEFORE UPDATE ON public.consulting_firms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultant_profiles_updated_at BEFORE UPDATE ON public.consultant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_companies_updated_at BEFORE UPDATE ON public.client_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;