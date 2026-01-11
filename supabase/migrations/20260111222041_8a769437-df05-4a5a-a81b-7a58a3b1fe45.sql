-- Create function to handle user role assignment on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role from user metadata
  user_role := NEW.raw_user_meta_data ->> 'role';
  
  -- Only insert if role is provided and valid
  IF user_role IS NOT NULL AND user_role IN ('client', 'consultant', 'consulting_firm') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign role when user is created
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();