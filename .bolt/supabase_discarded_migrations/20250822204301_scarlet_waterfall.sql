/*
  # Add blog posts to wedding board favorites

  1. Schema Changes
    - Add `blog_post_id` column to `wedding_board_favorites` table
    - Add `item_type` column to distinguish between packages and blog posts
    - Update constraints to allow either package_id OR blog_post_id
    - Add foreign key relationship to blog_posts table

  2. Security
    - Update existing RLS policies to handle blog posts
    - Ensure couples can only manage their own favorites

  3. Data Migration
    - Set existing records to 'package' type
    - Ensure data integrity during migration
*/

-- Add new columns to wedding_board_favorites table
DO $$
BEGIN
  -- Add blog_post_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_board_favorites' AND column_name = 'blog_post_id'
  ) THEN
    ALTER TABLE wedding_board_favorites ADD COLUMN blog_post_id uuid;
  END IF;

  -- Add item_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wedding_board_favorites' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE wedding_board_favorites ADD COLUMN item_type text DEFAULT 'package' NOT NULL;
  END IF;
END $$;

-- Update existing records to have 'package' type
UPDATE wedding_board_favorites 
SET item_type = 'package' 
WHERE item_type IS NULL OR item_type = '';

-- Add check constraint for item_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wedding_board_favorites' AND constraint_name = 'wedding_board_favorites_item_type_check'
  ) THEN
    ALTER TABLE wedding_board_favorites 
    ADD CONSTRAINT wedding_board_favorites_item_type_check 
    CHECK (item_type IN ('package', 'blog_post'));
  END IF;
END $$;

-- Add check constraint to ensure either package_id OR blog_post_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wedding_board_favorites' AND constraint_name = 'wedding_board_favorites_item_check'
  ) THEN
    ALTER TABLE wedding_board_favorites 
    ADD CONSTRAINT wedding_board_favorites_item_check 
    CHECK (
      (package_id IS NOT NULL AND blog_post_id IS NULL AND item_type = 'package') OR
      (package_id IS NULL AND blog_post_id IS NOT NULL AND item_type = 'blog_post')
    );
  END IF;
END $$;

-- Add foreign key constraint for blog_post_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wedding_board_favorites' AND constraint_name = 'wedding_board_favorites_blog_post_id_fkey'
  ) THEN
    ALTER TABLE wedding_board_favorites 
    ADD CONSTRAINT wedding_board_favorites_blog_post_id_fkey 
    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for blog_post_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'wedding_board_favorites' AND indexname = 'idx_wedding_board_favorites_blog_post_id'
  ) THEN
    CREATE INDEX idx_wedding_board_favorites_blog_post_id ON wedding_board_favorites(blog_post_id);
  END IF;
END $$;

-- Update RLS policies to handle blog posts
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Couples can manage their own favorites" ON wedding_board_favorites;
  DROP POLICY IF EXISTS "Couples can view their own favorites" ON wedding_board_favorites;

  -- Create updated policies
  CREATE POLICY "Couples can manage their own wedding board items"
    ON wedding_board_favorites
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM couples
        WHERE couples.id = wedding_board_favorites.couple_id
        AND couples.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM couples
        WHERE couples.id = wedding_board_favorites.couple_id
        AND couples.user_id = auth.uid()
      )
    );
END $$;