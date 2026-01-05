-- Public schema wrapper functions for API key management
-- These wrap the keyhippo schema functions to provide a simpler public interface

-- Helper function to get current user ID from auth.uid() or API key
CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM keyhippo.current_user_context();
    END IF;
    RETURN v_user_id;
END;
$function$;

-- Create API key wrapper
CREATE OR REPLACE FUNCTION public.create_api_key(key_description text, scope_name text DEFAULT NULL::text)
 RETURNS TABLE(api_key text, api_key_id uuid)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'keyhippo'
AS $function$
    SELECT * FROM keyhippo.create_api_key(key_description, scope_name);
$function$;

-- Get single API key wrapper
CREATE OR REPLACE FUNCTION public.get_api_key(p_key_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, description text, prefix text, created_at timestamp with time zone, last_used_at timestamp with time zone, is_revoked boolean, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'keyhippo'
AS $function$
    SELECT akm.id, akm.user_id, akm.description, akm.prefix,
           akm.created_at, akm.last_used_at, akm.is_revoked, akm.expires_at
    FROM keyhippo.api_key_metadata akm
    WHERE akm.id = p_key_id 
    AND akm.user_id = (SELECT cuc.user_id FROM keyhippo.current_user_context() cuc);
$function$;

-- List all API keys for current user wrapper
CREATE OR REPLACE FUNCTION public.list_my_api_keys()
 RETURNS TABLE(id uuid, user_id uuid, description text, prefix text, created_at timestamp with time zone, last_used_at timestamp with time zone, is_revoked boolean, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'keyhippo'
AS $function$
    SELECT akm.id, akm.user_id, akm.description, akm.prefix,
           akm.created_at, akm.last_used_at, akm.is_revoked, akm.expires_at
    FROM keyhippo.api_key_metadata akm
    WHERE akm.user_id = (SELECT cuc.user_id FROM keyhippo.current_user_context() cuc)
    ORDER BY akm.created_at DESC;
$function$;

-- Revoke API key wrapper
CREATE OR REPLACE FUNCTION public.revoke_api_key(api_key_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'keyhippo'
AS $function$
    SELECT keyhippo.revoke_api_key(api_key_id);
$function$;

-- Rotate API key wrapper
CREATE OR REPLACE FUNCTION public.rotate_api_key(old_api_key_id uuid)
 RETURNS TABLE(new_api_key text, new_api_key_id uuid)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'keyhippo'
AS $function$
    SELECT * FROM keyhippo.rotate_api_key(old_api_key_id);
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_api_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_api_key(uuid) TO authenticated;

