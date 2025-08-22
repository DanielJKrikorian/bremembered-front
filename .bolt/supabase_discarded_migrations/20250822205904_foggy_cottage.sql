/*
  # Fix wedding_board_favorites table schema

  1. Schema Changes
    - Make `package_id` column nullable to support blog post favorites
    - Make `blog_post_id` column nullable to support package favorites
    - Add constraint to ensure exactly one of package_id or blog_post_id is set

  2. Security
    - Maintain existing RLS policies
    - No changes to security model

  3. Data Integrity
    - Add check constraint to ensure proper item_type usage
    - Ensure referential integrity with foreign keys
*/

-- Make package_id nullable
ALTER TABLE wedding_board_favorites 
ALTER COLUMN package_id DROP NOT NULL;

-- Make blog_post_id nullable (if it exists and is not null)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_board_favorites' AND column_name = 'blog_post_id'
  ) THEN
    ALTER TABLE wedding_board_favorites 
    ALTER COLUMN blog_post_id DROP NOT NULL;
  END IF;
END $$;

-- Add constraint to ensure exactly one of package_id or blog_post_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wedding_board_favorites' 
    AND constraint_name = 'check_exactly_one_item_id'
  ) THEN
    ALTER TABLE wedding_board_favorites 
    ADD CONSTRAINT check_exactly_one_item_id 
    CHECK (
      (package_id IS NOT NULL AND blog_post_id IS NULL) OR 
      (package_id IS NULL AND blog_post_id IS NOT NULL)
    );
  END IF;
END $$;

-- Add constraint to ensure item_type matches the populated ID field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wedding_board_favorites' 
    AND constraint_name = 'check_item_type_consistency'
  ) THEN
    ALTER TABLE wedding_board_favorites 
    ADD CONSTRAINT check_item_type_consistency 
    CHECK (
      (item_type = 'package' AND package_id IS NOT NULL AND blog_post_id IS NULL) OR 
      (item_type = 'blog_post' AND blog_post_id IS NOT NULL AND package_id IS NULL)
    );
  END IF;
END $$;