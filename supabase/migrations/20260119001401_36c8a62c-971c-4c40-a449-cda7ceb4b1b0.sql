-- Create enum for course types
CREATE TYPE public.course_type AS ENUM ('course', 'workshop');

-- Create partner_courses table for courses and workshops
CREATE TABLE public.partner_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  course_type course_type NOT NULL DEFAULT 'course',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CLP',
  duration_hours INTEGER,
  max_participants INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_course_enrollments table for tracking enrollments
CREATE TABLE public.partner_course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.partner_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_amount DECIMAL(10,2),
  UNIQUE(course_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.partner_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_courses
-- Partners can manage their own courses
CREATE POLICY "Partners can view their own courses"
ON public.partner_courses
FOR SELECT
TO authenticated
USING (partner_id = auth.uid());

CREATE POLICY "Partners can insert their own courses"
ON public.partner_courses
FOR INSERT
TO authenticated
WITH CHECK (partner_id = auth.uid() AND public.has_role(auth.uid(), 'partner'));

CREATE POLICY "Partners can update their own courses"
ON public.partner_courses
FOR UPDATE
TO authenticated
USING (partner_id = auth.uid())
WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can delete their own courses"
ON public.partner_courses
FOR DELETE
TO authenticated
USING (partner_id = auth.uid());

-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses"
ON public.partner_courses
FOR SELECT
TO authenticated
USING (is_published = true);

-- RLS Policies for partner_course_enrollments
-- Partners can view enrollments for their courses
CREATE POLICY "Partners can view enrollments for their courses"
ON public.partner_course_enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partner_courses
    WHERE partner_courses.id = partner_course_enrollments.course_id
    AND partner_courses.partner_id = auth.uid()
  )
);

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.partner_course_enrollments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can enroll themselves
CREATE POLICY "Users can enroll in courses"
ON public.partner_course_enrollments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_partner_courses_updated_at
BEFORE UPDATE ON public.partner_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();