-- =========================================================================
-- SOSHKA REGISTER USER DIRECTLY FUNCTION FIX
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =========================================================================

-- Drop the old function if it exists to avoid function signature mismatch
DROP FUNCTION IF EXISTS public.register_user_directly(text, text, text, text);
DROP FUNCTION IF EXISTS public.register_user_directly(text, text, text, text, text);

-- Create the updated version of register_user_directly with p_phone argument
CREATE OR REPLACE FUNCTION public.register_user_directly(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'user',
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = LOWER(p_email)
  ) INTO v_user_exists;

  IF v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'User with this email already exists.');
  END IF;

  -- Insert user into auth.users (triggers sync profile automatically via handle_new_user)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    LOWER(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', p_name, 'role', p_role, 'phone', COALESCE(p_phone, '')),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User registered successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
