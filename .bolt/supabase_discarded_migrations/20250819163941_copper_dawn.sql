/*
  # Create Blog System

  1. New Tables
    - `blog_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text, optional)
      - `color` (text, hex color for UI)
      - `post_count` (integer, auto-updated)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `excerpt` (text)
      - `content` (text)
      - `featured_image` (text, URL)
      - `author_id` (uuid, references auth.users)
      - `category` (text, references blog_categories.slug)
      - `tags` (text array)
      - `status` (enum: draft, published, archived)
      - `featured` (boolean)
      - `read_time` (integer, minutes)
      - `view_count` (integer)
      - `like_count` (integer)
      - `published_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `blog_post_views`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `user_id` (uuid, references auth.users, optional)
      - `ip_address` (text)
      - `viewed_at` (timestamp)
    
    - `blog_post_likes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to published posts
    - Add policies for admin management
    - Add policies for user interactions (likes, views)

  3. Functions
    - Auto-update post counts in categories
    - Auto-calculate read time based on content
*/

-- Create enum for post status
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  featured_image text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text REFERENCES blog_categories(slug) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  status post_status DEFAULT 'draft',
  featured boolean DEFAULT false,
  read_time integer DEFAULT 5,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_post_views table
CREATE TABLE IF NOT EXISTS blog_post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  viewed_at timestamptz DEFAULT now()
);

-- Create blog_post_likes table
CREATE TABLE IF NOT EXISTS blog_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;

-- Policies for blog_categories
CREATE POLICY "Anyone can read blog categories"
  ON blog_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage blog categories"
  ON blog_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin_level IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin_level IN ('admin', 'super_admin')
    )
  );

-- Policies for blog_posts
CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Admins can manage all blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin_level IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin_level IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Authors can manage their own posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Policies for blog_post_views
CREATE POLICY "Anyone can record views"
  ON blog_post_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own views"
  ON blog_post_views
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for blog_post_likes
CREATE POLICY "Authenticated users can manage their likes"
  ON blog_post_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read like counts"
  ON blog_post_likes
  FOR SELECT
  TO public
  USING (true);

-- Function to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post count for old category (if exists)
  IF TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category THEN
    UPDATE blog_categories 
    SET post_count = (
      SELECT COUNT(*) FROM blog_posts 
      WHERE category = OLD.category AND status = 'published'
    ),
    updated_at = now()
    WHERE slug = OLD.category;
  END IF;
  
  -- Update post count for new/current category
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE blog_categories 
    SET post_count = (
      SELECT COUNT(*) FROM blog_posts 
      WHERE category = NEW.category AND status = 'published'
    ),
    updated_at = now()
    WHERE slug = NEW.category;
  END IF;
  
  -- Update post count for deleted post category
  IF TG_OP = 'DELETE' THEN
    UPDATE blog_categories 
    SET post_count = (
      SELECT COUNT(*) FROM blog_posts 
      WHERE category = OLD.category AND status = 'published'
    ),
    updated_at = now()
    WHERE slug = OLD.category;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate read time
CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate read time based on content length (average 200 words per minute)
  NEW.read_time = GREATEST(1, ROUND(array_length(string_to_array(NEW.content, ' '), 1) / 200.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update view count
CREATE OR REPLACE FUNCTION update_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blog_posts 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update like count
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_posts 
    SET like_count = like_count + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_posts 
    SET like_count = like_count - 1,
        updated_at = now()
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_post_read_time
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_read_time();

CREATE TRIGGER update_category_post_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_category_post_count();

CREATE TRIGGER update_post_view_count
  AFTER INSERT ON blog_post_views
  FOR EACH ROW
  EXECUTE FUNCTION update_view_count();

CREATE TRIGGER update_post_like_count
  AFTER INSERT OR DELETE ON blog_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_count();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('Wedding Planning', 'wedding-planning', 'Tips and guides for planning your perfect wedding', '#f43f5e'),
  ('Photography', 'photography', 'Wedding photography tips, trends, and inspiration', '#8b5cf6'),
  ('Real Weddings', 'real-weddings', 'Real wedding stories and inspiration from our couples', '#ec4899'),
  ('Venues', 'venues', 'Beautiful wedding venues and location ideas', '#10b981'),
  ('Music & Entertainment', 'music-entertainment', 'DJ services, live music, and wedding entertainment', '#f59e0b'),
  ('Videography', 'videography', 'Wedding videography tips and cinematic inspiration', '#3b82f6'),
  ('Coordination', 'coordination', 'Wedding coordination and day-of planning advice', '#6366f1'),
  ('Trends', 'trends', 'Latest wedding trends and style inspiration', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, category, tags, status, featured, published_at) VALUES
  (
    'How to Choose the Perfect Wedding Photographer',
    'how-to-choose-perfect-wedding-photographer',
    'Your wedding photographer will capture the most important moments of your life. Here''s how to find the perfect one for your style and budget.',
    'Your wedding day is one of the most important days of your life, and choosing the right photographer to capture those precious moments is crucial. With so many talented photographers available, it can be overwhelming to make the right choice. Here''s a comprehensive guide to help you find your perfect wedding photographer.

## Understanding Your Photography Style

Before you start your search, it''s important to understand what style of photography speaks to you. Wedding photography styles range from traditional posed portraits to candid photojournalistic shots, and everything in between.

### Popular Photography Styles:

**Traditional/Classic**: Formal, posed shots with classic compositions. Perfect for couples who want timeless, elegant photos.

**Photojournalistic/Documentary**: Candid, unposed moments that tell the story of your day naturally. Great for couples who want authentic emotions captured.

**Fine Art**: Artistic, creative compositions with attention to lighting, color, and artistic elements. Ideal for couples who appreciate artistic vision.

**Editorial**: Fashion-inspired photography with dramatic lighting and poses. Perfect for couples who want magazine-quality images.

## Questions to Ask Potential Photographers

When interviewing photographers, here are essential questions to ask:

1. **Can we see a full wedding gallery?** Don''t just look at highlight reels - see how they capture an entire day.

2. **What''s included in your packages?** Understand exactly what you''re getting for your investment.

3. **How many photos will we receive?** Get a clear number of edited images you can expect.

4. **What''s your backup plan?** Ensure they have backup equipment and a second photographer if needed.

5. **When will we receive our photos?** Understand the timeline for receiving your final gallery.

## Budget Considerations

Wedding photography is an investment in preserving your memories forever. While it''s important to stay within budget, remember that these photos will be treasured for generations.

### Typical Photography Package Ranges:
- **Budget-friendly**: $1,500 - $3,000
- **Mid-range**: $3,000 - $6,000  
- **Luxury**: $6,000 - $15,000+

Remember that the cheapest option isn''t always the best value. Consider the photographer''s experience, style, and what''s included in their packages.',
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    'photography',
    ARRAY['photography', 'wedding planning', 'tips', 'guide'],
    'published',
    true,
    now()
  ),
  (
    'Creating Your Perfect Wedding Timeline',
    'creating-perfect-wedding-timeline',
    'A well-planned timeline is the key to a stress-free wedding day. Learn how to create a schedule that works for everyone.',
    'A well-planned wedding timeline is the backbone of a successful wedding day. It ensures that everything runs smoothly, your vendors are coordinated, and you can actually enjoy your special day without stress.

## Why a Timeline Matters

Your wedding timeline serves multiple purposes:
- Keeps all vendors on the same page
- Ensures you don''t miss important moments
- Helps manage guest expectations
- Reduces stress for everyone involved

## Starting Your Timeline

Begin with the non-negotiable elements:
1. **Ceremony start time** - This is usually your anchor point
2. **Venue restrictions** - Some venues have specific time requirements
3. **Vendor availability** - Check when your key vendors are available
4. **Sunset time** - Important for outdoor photos

## Sample Timeline Structure

### Getting Ready (3-4 hours before ceremony)
- Hair and makeup
- Getting dressed
- Detail shots
- Bridal party photos

### Pre-Ceremony (1-2 hours before)
- First look (optional)
- Family photos
- Bridal party photos
- Vendor setup

### Ceremony (30-60 minutes)
- Guest seating
- Processional
- Ceremony
- Recessional
- Immediate family photos

### Cocktail Hour (60-90 minutes)
- Guest mingling
- Couple portraits
- Family photos
- Vendor transitions

### Reception
- Grand entrance
- First dance
- Dinner service
- Toasts
- Dancing
- Special moments (cake cutting, bouquet toss)
- Send-off

## Pro Tips

1. **Build in buffer time** - Add 15-30 minutes between major events
2. **Consider travel time** - Account for transportation between locations
3. **Communicate with vendors** - Share your timeline with all vendors
4. **Be realistic** - Don''t pack too much into one day
5. **Have a backup plan** - Weather and unexpected delays happen

Remember, your timeline should work for you, not against you. The goal is to create a day that flows naturally and allows you to be present for all the special moments.',
    'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
    'wedding-planning',
    ARRAY['timeline', 'planning', 'coordination', 'schedule'],
    'published',
    true,
    now() - interval '2 days'
  ),
  (
    'Sarah & Michael''s Rustic Barn Wedding',
    'sarah-michael-rustic-barn-wedding',
    'A beautiful outdoor celebration in Napa Valley with string lights, vineyard views, and unforgettable moments.',
    'Sarah and Michael''s wedding was a perfect blend of rustic charm and elegant sophistication. Set against the backdrop of Napa Valley''s rolling hills, their celebration was everything they had dreamed of and more.

## The Vision

From the beginning, Sarah and Michael knew they wanted something that felt authentic to who they are as a couple. "We''re not fancy people," Sarah laughs, "but we wanted our day to feel special and beautiful." They chose a rustic barn venue that had been converted into a stunning event space, complete with exposed beams, string lights, and panoramic views of the vineyard.

## The Details

### Venue: Sunset Ridge Barn
The couple fell in love with Sunset Ridge Barn the moment they saw it. The venue offered both indoor and outdoor ceremony options, which was perfect since they wanted to be outside but needed a backup plan for weather.

### Photography: Capturing Natural Moments
They chose a photographer who specialized in natural, candid photography. "We wanted photos that felt like us," Michael explains. "Not too posed, but still beautiful." The photographer captured everything from Sarah''s getting-ready moments to the spontaneous dance party that erupted during cocktail hour.

### Music: Live Acoustic Duo
Instead of a traditional DJ, Sarah and Michael hired a local acoustic duo for their ceremony and cocktail hour, then switched to a playlist for dancing. "The live music during our ceremony was so romantic," Sarah recalls. "It made everything feel more intimate."

## The Day

The wedding day started with Sarah getting ready in the bridal suite while Michael and his groomsmen prepared in the groom''s quarters. The first look took place in the vineyard, with the photographer capturing their genuine emotions as they saw each other for the first time.

The ceremony was held on the venue''s outdoor terrace, with the vineyard as a backdrop. String lights and greenery created a romantic atmosphere as the sun began to set. After the ceremony, guests enjoyed cocktails on the lawn while the couple took photos around the property.

Dinner was served family-style in the barn, with long wooden tables decorated with simple greenery and candles. The couple''s personal touches were everywhere - from handwritten place cards to a dessert bar featuring their favorite treats instead of a traditional wedding cake.

## The Vendors

**Photography**: Elegant Moments Photography
**Venue**: Sunset Ridge Barn
**Catering**: Farm-to-Table Events
**Florals**: Wild & Free Florals
**Music**: The Acoustic Duo

## Advice from the Couple

"Don''t stress about the little things," Sarah advises future couples. "Focus on what really matters to you as a couple. For us, it was having our closest family and friends together in a beautiful setting. Everything else was just details."

Michael adds, "Trust your vendors. We found amazing people through B. Remembered, and they made our day so much easier. We could actually enjoy our wedding instead of worrying about logistics."

## The Result

Sarah and Michael''s wedding was featured in several local publications and has inspired countless other couples planning rustic celebrations. But more importantly, it was exactly what they wanted - a day that felt authentically them, surrounded by the people they love most.',
    'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
    'real-weddings',
    ARRAY['real wedding', 'rustic', 'barn wedding', 'napa valley', 'outdoor'],
    'published',
    true,
    now() - interval '5 days'
  ),
  (
    'Top 10 Wedding Venues in New England',
    'top-10-wedding-venues-new-england',
    'Discover the most stunning wedding venues across New England, from historic estates to waterfront locations.',
    'New England offers some of the most picturesque wedding venues in the country. From historic mansions to charming barns, coastal estates to mountain lodges, there''s something for every couple''s vision.

## 1. The Mount, Lenox, Massachusetts

This historic estate was once home to author Edith Wharton and offers breathtaking views of the Berkshire Mountains. The formal gardens and elegant architecture make it perfect for sophisticated celebrations.

**Best for**: Classic, elegant weddings
**Capacity**: Up to 150 guests
**Season**: May through October

## 2. Castle Hill Inn, Newport, Rhode Island

Perched on 40 acres overlooking Narragansett Bay, this Victorian-era inn offers stunning ocean views and luxurious accommodations for you and your guests.

**Best for**: Coastal, romantic weddings
**Capacity**: Up to 200 guests
**Season**: Year-round

## 3. Sugarbush Resort, Warren, Vermont

For couples who love the mountains, Sugarbush offers spectacular views and rustic elegance. The resort provides multiple venue options from intimate lodges to grand ballrooms.

**Best for**: Mountain, rustic weddings
**Capacity**: Up to 300 guests
**Season**: Year-round (especially beautiful in fall)

## 4. Wentworth by the Sea, New Castle, New Hampshire

This grand hotel has been hosting celebrations since 1874. Located on a private island, it offers both historic charm and modern amenities.

**Best for**: Historic, waterfront weddings
**Capacity**: Up to 250 guests
**Season**: April through November

## 5. Hildene, Manchester, Vermont

The former home of Robert Todd Lincoln offers 412 acres of formal gardens, rolling meadows, and mountain views. The Georgian Revival mansion provides an elegant backdrop.

**Best for**: Garden, historic weddings
**Capacity**: Up to 180 guests
**Season**: May through October

## Planning Tips

- **Book early**: Popular New England venues book 12-18 months in advance
- **Consider the season**: Fall foliage is stunning but comes with premium pricing
- **Weather backup**: Always have an indoor option for outdoor ceremonies
- **Local vendors**: Many venues have preferred vendor lists with local expertise

## Why Choose New England

New England venues offer:
- Four distinct seasons for varied photo opportunities
- Rich history and architectural beauty
- Farm-to-table dining options
- Proximity to major cities
- Stunning natural backdrops

Whether you''re dreaming of a seaside celebration, a mountain retreat, or a historic mansion wedding, New England has the perfect venue waiting for you.',
    'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
    'venues',
    ARRAY['venues', 'new england', 'wedding locations', 'venue guide'],
    'published',
    false,
    now() - interval '1 week'
  ),
  (
    'Wedding Music Trends for 2024',
    'wedding-music-trends-2024',
    'From live bands to curated playlists, discover the hottest music trends that will make your wedding unforgettable.',
    'Music sets the tone for your entire wedding celebration. As we move through 2024, couples are embracing new trends while honoring timeless classics. Here''s what''s trending in wedding music this year.

## Live Music is Back

After years of restrictions, live music is making a huge comeback. Couples are investing in:

### Acoustic Duos for Ceremonies
Simple, intimate performances that create emotional moments during your vows.

### Jazz Bands for Cocktail Hours
Sophisticated background music that encourages conversation and sets an elegant tone.

### Full Bands for Receptions
Nothing gets people dancing like live music. Many couples are choosing bands that can play both dinner music and dance hits.

## Playlist Curation

DIY playlists are more popular than ever, but they''re getting more sophisticated:

### Micro-Moments
Specific songs for specific moments - entrance songs, cake cutting, bouquet toss, etc.

### Genre Blending
Mixing different musical eras and styles to appeal to all generations of guests.

### Personal Storytelling
Including songs that tell your love story throughout the reception.

## Technology Integration

Modern weddings are embracing tech:

### Silent Discos
Perfect for venues with noise restrictions or couples who want multiple music options.

### Live Streaming Audio
For virtual guests to hear ceremony music clearly.

### Interactive Playlists
Guests can request songs through apps during the reception.

## Cultural Fusion

More couples are incorporating:
- Traditional music from their heritage
- Bilingual songs for multicultural celebrations
- Regional music that reflects their venue location

## What to Avoid

- Overplayed wedding songs (unless they''re meaningful to you)
- Songs with inappropriate lyrics
- Music that doesn''t match your venue''s vibe
- Too many slow songs in a row

## Working with Your DJ or Band

1. **Share your vision early** - Explain the vibe you want
2. **Create "do not play" lists** - Be specific about what you don''t want
3. **Trust their expertise** - Good DJs know how to read a room
4. **Plan for all ages** - Include music that appeals to different generations

The key is choosing music that reflects your personality as a couple while keeping your guests engaged and entertained.',
    'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
    'music-entertainment',
    ARRAY['music', 'dj', 'trends', 'entertainment', '2024'],
    'published',
    false,
    now() - interval '3 days'
  )
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON blog_post_likes(post_id);