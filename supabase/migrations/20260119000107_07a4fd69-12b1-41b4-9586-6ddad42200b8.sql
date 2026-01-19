-- Update the handle_new_user_role function to include 'partner' role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role from user metadata
  user_role := NEW.raw_user_meta_data ->> 'role';
  
  -- Only insert if role is provided and valid (now includes 'partner')
  IF user_role IS NOT NULL AND user_role IN ('client', 'consultant', 'consulting_firm', 'partner') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::app_role);
  END IF;
  
  RETURN NEW;
END;
$function$;