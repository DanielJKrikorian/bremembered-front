/*
  # Fix message read function to avoid set-returning functions

  1. Function Updates
    - Replace `is_message_read_by_user` function to use array containment operator
    - Remove problematic `ANY()` usage that causes RLS errors
  
  2. Security
    - Maintain same functionality with proper array operators
    - Ensure RLS policies can use this function without errors
*/

-- Drop and recreate the function to use array containment instead of ANY()
DROP FUNCTION IF EXISTS is_message_read_by_user(uuid, uuid[]);

CREATE OR REPLACE FUNCTION is_message_read_by_user(user_uuid uuid, message_read_by uuid[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT message_read_by @> ARRAY[user_uuid];
$$;