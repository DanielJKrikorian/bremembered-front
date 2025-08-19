/*
  # Create Blog System

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `slug` (text, unique, required)
      - `excerpt` (text, optional)
      - `content` (text, required)
      - `featured_image` (text, optional)
      - `author_id` (uuid, references auth.users)
      - `category` (text, required)
      - `tags` (text array, optional)
      - `status` (enum: draft, published, archived)
      - `featured` (boolean, default false)
      - `read_time` (integer, estimated reading time in minutes)
      - `view_count` (integer, default 0)
      - `like_count` (integer, default 0)
      - `published_at` (timestamp, optional)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)
    - `blog_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique, required)
      - `slug` (text, unique, required)
      - `description` (text, optional)
      - `color` (text, optional, for UI theming)
      - `post_count` (integer, default 0)
      - `created_at` (timestamp, default now)
    - `blog_post_views`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `user_id` (uuid, references auth.users, optional for anonymous)
      - `ip_address` (text, optional)
      - `viewed_at` (timestamp, default now)
    - `blog_post_likes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to published posts
    - Add policies for admin management
    - Add policies for user interactions (likes, views)

  3. Functions
    - Function to update post view count
    - Function to update category post count
    - Trigger to update updated_at timestamp
*/

-- Create enum for post status
CREATE TYPE blog_post_status AS ENUM ('draft', 'published', 'archived');

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  status blog_post_status DEFAULT 'draft',
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

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can view categories"
  ON blog_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage categories"
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

-- RLS Policies for blog_posts
CREATE POLICY "Anyone can view published posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Admins can manage all posts"
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

-- RLS Policies for blog_post_views
CREATE POLICY "Anyone can create views"
  ON blog_post_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own views"
  ON blog_post_views
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all views"
  ON blog_post_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin_level IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for blog_post_likes
CREATE POLICY "Users can manage their own likes"
  ON blog_post_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view likes"
  ON blog_post_likes
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON blog_post_likes(post_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for old category (if updating)
  IF TG_OP = 'UPDATE' AND OLD.category != NEW.category THEN
    UPDATE blog_categories 
    SET post_count = (
      SELECT COUNT(*) FROM blog_posts 
      WHERE category = OLD.category AND status = 'published'
    )
    WHERE slug = OLD.category;
  END IF;
  
  -- Update count for new/current category
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE blog_categories 
    SET post_count = (
      SELECT COUNT(*) FROM blog_posts 
      WHERE category = NEW.category AND status = 'published'
    )
    WHERE slug = NEW.category;
  END IF;
  
  -- Update count for deleted post category
  IF TG_OP = 'DELETE' THEN
    UPDATE blog_categories 
    SET post_count = (
      SELECT COUNT(*) FROM blog_posts 
      WHERE category = OLD.category AND status = 'published'
    )
    WHERE slug = OLD.category;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blog_posts 
  SET view_count = view_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_blog_posts_updated_at_trigger
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

CREATE TRIGGER update_category_post_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_category_post_count();

CREATE TRIGGER increment_post_view_count_trigger
  AFTER INSERT ON blog_post_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_view_count();

CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON blog_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('Wedding Planning', 'wedding-planning', 'Tips and guides for planning your perfect wedding', '#f43f5e'),
  ('Photography', 'photography', 'Wedding photography tips, trends, and inspiration', '#8b5cf6'),
  ('Videography', 'videography', 'Wedding videography and cinematography insights', '#06b6d4'),
  ('Venues', 'venues', 'Beautiful wedding venues and location ideas', '#10b981'),
  ('Music & Entertainment', 'music-entertainment', 'DJ services, live music, and wedding entertainment', '#f59e0b'),
  ('Coordination', 'coordination', 'Wedding coordination and day-of planning advice', '#ef4444'),
  ('Real Weddings', 'real-weddings', 'Real wedding stories and inspiration from our couples', '#ec4899'),
  ('Vendor Spotlights', 'vendor-spotlights', 'Featured vendors and their amazing work', '#6366f1')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, status, featured, read_time, featured_image, published_at) VALUES
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

Remember that the cheapest option isn''t always the best value. Consider the photographer''s experience, style, and what''s included in their packages.

## Red Flags to Watch Out For

- Photographers who won''t show you full wedding galleries
- Extremely low prices that seem too good to be true
- Poor communication or slow response times
- No backup equipment or contingency plans
- Unclear contracts or hidden fees

## Making Your Final Decision

Once you''ve narrowed down your choices, trust your instincts. Choose a photographer whose work you love and who you feel comfortable with. Remember, this person will be with you throughout your entire wedding day, so personality fit is just as important as photographic skill.

Your wedding photos will be one of the few things that last forever from your wedding day. Take the time to choose a photographer who will capture your love story beautifully and authentically.',
    'photography',
    ARRAY['photography', 'wedding planning', 'tips', 'guide'],
    'published',
    true,
    8,
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    now() - interval '2 days'
  ),
  (
    'Creating Your Perfect Wedding Timeline',
    'creating-perfect-wedding-timeline',
    'A well-planned timeline is the key to a stress-free wedding day. Learn how to create a schedule that works for everyone.',
    'A well-crafted wedding timeline is the backbone of a successful wedding day. It ensures that everything runs smoothly, your vendors are coordinated, and you can actually enjoy your celebration without stress.

## Starting with the Ceremony Time

Your ceremony time is the anchor point for your entire timeline. Most couples choose between:

- **Morning ceremonies** (10 AM - 12 PM): Great for brunch receptions and budget savings
- **Afternoon ceremonies** (2 PM - 4 PM): Classic timing with natural lighting
- **Evening ceremonies** (5 PM - 7 PM): Romantic golden hour lighting

## Working Backwards from Key Moments

Once you have your ceremony time, work backwards to plan:

### 6-8 Hours Before Ceremony
- Hair and makeup begins
- Photographer arrives for getting ready shots
- Breakfast/lunch for wedding party

### 2-3 Hours Before Ceremony
- Getting dressed
- First look (if planned)
- Wedding party photos
- Family photos

### 1 Hour Before Ceremony
- Final touches
- Vendor setup completion
- Guest arrival begins

## Reception Timeline Essentials

After your ceremony, plan for:

### Immediately After Ceremony (30-60 minutes)
- Cocktail hour for guests
- Couple and family photos
- Vendor transitions

### Reception Start
- Grand entrance
- First dance
- Welcome speech
- Dinner service

### Evening Celebrations
- Toasts and speeches
- Cake cutting
- Parent dances
- Open dancing
- Send-off

## Vendor Coordination Tips

Share your timeline with all vendors at least 2 weeks before your wedding. Include:

- Detailed schedule with buffer time
- Vendor arrival and setup times
- Key photo moments
- Special requests or traditions
- Emergency contact information

## Building in Buffer Time

Always add 15-30 minutes of buffer time between major events. This accounts for:
- Photos running long
- Unexpected delays
- Guest transitions
- Vendor setup needs

## Sample Timeline Template

**2:00 PM** - Hair and makeup begins
**4:00 PM** - Photographer arrives
**5:00 PM** - Getting dressed begins
**5:30 PM** - First look
**6:00 PM** - Wedding party photos
**6:30 PM** - Family photos
**7:00 PM** - Final preparations
**7:30 PM** - Ceremony begins
**8:00 PM** - Cocktail hour starts
**9:00 PM** - Reception entrance
**9:15 PM** - First dance
**9:30 PM** - Dinner service
**10:30 PM** - Toasts and speeches
**11:00 PM** - Cake cutting
**11:15 PM** - Open dancing
**12:00 AM** - Send-off

Remember, this is just a template - customize it based on your specific needs, traditions, and vendor requirements.',
    'wedding-planning',
    ARRAY['timeline', 'planning', 'coordination', 'schedule'],
    'published',
    true,
    10,
    'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
    now() - interval '5 days'
  ),
  (
    'Sarah & Michael''s Rustic Barn Wedding',
    'sarah-michael-rustic-barn-wedding',
    'A beautiful outdoor celebration in Napa Valley with string lights, vineyard views, and unforgettable moments.',
    'Sarah and Michael''s wedding at Sunset Barn in Napa Valley was everything a rustic wedding should be - romantic, intimate, and absolutely magical. From the moment guests arrived to see the vineyard views to the last dance under twinkling string lights, every detail was perfectly planned.

## The Vision

Sarah and Michael wanted a celebration that felt authentic to their relationship - relaxed, fun, and surrounded by nature. They chose a rustic barn venue that offered both indoor and outdoor spaces, allowing them to take advantage of California''s beautiful weather.

## The Details

### Venue: Sunset Barn, Napa Valley
The couple fell in love with this venue''s combination of rustic charm and elegant touches. The barn featured:
- Exposed wooden beams and stone accents
- Panoramic vineyard views
- Built-in string lighting
- Outdoor ceremony space with mountain backdrop
- Bridal suite with vintage furnishings

### Color Palette
Sarah chose a palette of dusty rose, sage green, and cream - colors that complemented the natural surroundings beautifully.

### Vendors
- **Photography**: Elegant Moments Photography
- **Videography**: Timeless Studios  
- **Coordination**: Perfect Harmony Events
- **Florals**: Garden Gate Designs
- **Catering**: Farm to Table Events

## The Ceremony

The outdoor ceremony took place during golden hour, with the vineyard and mountains as a stunning backdrop. Sarah walked down an aisle lined with wooden wine barrels topped with lush greenery and white flowers.

### Special Touches:
- Hand-written vows that brought tears to everyone''s eyes
- Unity ceremony using wine from the vineyard
- Acoustic guitar music during the processional
- Vintage wooden arch decorated with flowing fabric

## The Reception

As the sun set, guests moved into the barn for dinner and dancing. The space was transformed with:
- Long farm tables with eucalyptus runners
- Vintage brass candlesticks and lanterns
- String lights creating a warm, romantic glow
- A dessert table featuring local wines and artisanal cheeses

## Memorable Moments

### The First Look
Sarah and Michael chose to do a first look in the vineyard before the ceremony. The intimate moment allowed them to share private vows and calm their nerves before the big moment.

### The Surprise
During dinner, Michael surprised Sarah with a video message from her grandmother who couldn''t attend due to health reasons. There wasn''t a dry eye in the house.

### The Send-Off
The evening ended with a sparkler send-off as the couple walked through a tunnel of light created by their loved ones.

## Lessons Learned

Sarah and Michael''s wedding taught us several valuable lessons:

1. **Weather backup plans are essential** - Even in California, have a plan B
2. **Vendor coordination is key** - Regular check-ins ensure everyone is on the same page
3. **Personal touches matter most** - The details that reflect your relationship are what guests remember
4. **Timeline flexibility** - Build in buffer time for photos and unexpected moments

## The Photography

Elegant Moments Photography captured every detail beautifully, from the intimate getting-ready moments to the joyful celebration on the dance floor. Their photojournalistic style perfectly documented the authentic emotions and candid moments throughout the day.

## Final Thoughts

Sarah and Michael''s wedding was a perfect example of how personal style and careful planning can create an unforgettable celebration. By choosing vendors who understood their vision and a venue that reflected their personalities, they created a day that was uniquely theirs.

*Planning a rustic wedding? Contact our team to connect with vendors who specialize in outdoor and barn venue celebrations.*',
    'real-weddings',
    ARRAY['real wedding', 'rustic', 'barn wedding', 'napa valley', 'outdoor'],
    'published',
    true,
    12,
    'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
    now() - interval '1 week'
  ),
  (
    'Wedding Videography Trends for 2024',
    'wedding-videography-trends-2024',
    'Discover the latest trends in wedding videography that will make your love story cinematic and unforgettable.',
    'Wedding videography has evolved dramatically in recent years, with new technology and creative techniques making it possible to create truly cinematic love stories. Here are the top trends shaping wedding videography in 2024.

## Drone Cinematography

Aerial shots have become increasingly popular and accessible. Drones can capture:
- Stunning venue overviews
- Dramatic ceremony entrances
- Unique perspectives of outdoor celebrations
- Epic couple portraits with landscape backdrops

*Important*: Always check venue policies and local regulations regarding drone usage.

## Same-Day Edits

Many couples now want to share highlights from their wedding day immediately. Same-day edits involve:
- Quick editing during the reception
- 3-5 minute highlight reels
- Screening during dinner or dancing
- Instant social media sharing

## Documentary-Style Storytelling

Moving away from overly posed content, couples are embracing:
- Natural, unscripted moments
- Behind-the-scenes footage
- Authentic emotional reactions
- Candid interactions with family and friends

## Multi-Camera Coverage

Professional videographers now commonly use:
- Multiple camera angles during ceremony
- Dedicated cameras for different perspectives
- Seamless editing between viewpoints
- Comprehensive coverage without missing moments

## Cinematic Color Grading

Post-production techniques that create:
- Film-like color palettes
- Mood-specific grading
- Consistent visual aesthetics
- Professional, polished final products

## Audio Excellence

High-quality audio capture including:
- Wireless microphones for vows
- Ambient ceremony sounds
- Reception audio and toasts
- Musical soundtrack integration

## Choosing the Right Videographer

When selecting your wedding videographer, consider:

1. **Style compatibility** - Does their portfolio match your vision?
2. **Package inclusions** - What exactly is delivered?
3. **Timeline expectations** - When will you receive your final video?
4. **Equipment and backup plans** - Professional gear and contingencies
5. **Personality fit** - You''ll spend your entire day with them

## Investment Considerations

Wedding videography packages typically range from $2,000 to $8,000+ depending on:
- Coverage hours
- Number of videographers
- Deliverables included
- Post-production complexity
- Geographic location

## Making the Most of Your Investment

To get the best results from your videographer:
- Share your vision and must-have moments
- Provide a detailed timeline
- Communicate special traditions or cultural elements
- Trust their creative expertise
- Be present and enjoy your day

Your wedding video will be something you treasure forever, allowing you to relive not just the sights, but the sounds and emotions of your special day.',
    'videography',
    ARRAY['videography', 'trends', '2024', 'cinematography', 'wedding video'],
    'published',
    false,
    7,
    'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
    now() - interval '3 days'
  ),
  (
    'Top 10 Wedding Venues in New England',
    'top-10-wedding-venues-new-england',
    'Discover the most beautiful and unique wedding venues across New England, from historic estates to waterfront locations.',
    'New England offers some of the most stunning and diverse wedding venues in the country. From historic mansions to rustic barns, oceanfront resorts to mountain lodges, there''s a perfect setting for every couple''s vision.

## 1. The Mount, Lenox, Massachusetts

Edith Wharton''s former estate offers:
- Historic mansion with elegant ballrooms
- Manicured gardens and terraces
- Stunning Berkshire Mountain views
- Capacity for 150+ guests
- Full-service catering options

## 2. Castle Hill Inn, Newport, Rhode Island

This oceanfront resort features:
- Dramatic cliffside location
- Multiple ceremony sites
- Luxurious accommodations
- Award-winning cuisine
- Sunset ceremony options

## 3. Barn at Gibbet Hill, Groton, Massachusetts

A rustic-chic venue offering:
- Restored 18th-century barn
- Farm-to-table dining
- Scenic countryside views
- Outdoor ceremony space
- Charming bridal cottage

## 4. Wentworth by the Sea, New Castle, New Hampshire

Historic grand hotel with:
- Oceanfront location
- Multiple event spaces
- Full-service spa
- Golf course views
- Year-round availability

## 5. Hildene, Manchester, Vermont

Robert Todd Lincoln''s estate featuring:
- Historic mansion and gardens
- Mountain and valley views
- Formal gardens for ceremonies
- Carriage barn for receptions
- Rich historical significance

## 6. Ocean House, Watch Hill, Rhode Island

Luxury beachfront resort with:
- Private beach access
- Multiple ceremony locations
- Elegant ballrooms
- Full-service amenities
- Stunning ocean views

## 7. Lyman Estate, Waltham, Massachusetts

Historic venue offering:
- 1793 Federal-style mansion
- Beautiful greenhouse conservatory
- Manicured gardens
- Intimate setting for smaller weddings
- Rich architectural details

## 8. Mountain Top Inn, Chittenden, Vermont

Mountain resort featuring:
- Panoramic Green Mountain views
- Lakefront ceremony sites
- Rustic lodge atmosphere
- Outdoor adventure activities
- Four-season beauty

## 9. The Chanler at Cliff Walk, Newport, Rhode Island

Boutique mansion hotel with:
- Gilded Age elegance
- Oceanfront terraces
- Intimate ballroom
- Luxury accommodations
- Historic charm

## 10. Pinehills Golf Club, Plymouth, Massachusetts

Modern venue offering:
- Championship golf course views
- Contemporary event spaces
- Professional event coordination
- Flexible layout options
- Convenient location

## Choosing the Right Venue

When selecting your venue, consider:

### Practical Factors:
- Guest capacity and layout
- Catering restrictions or requirements
- Vendor policies and preferred lists
- Parking and accessibility
- Weather contingency plans

### Aesthetic Elements:
- Photography opportunities
- Natural lighting
- Seasonal considerations
- Decor flexibility
- Overall ambiance

### Budget Considerations:
- Venue rental fees
- Catering minimums
- Service charges and gratuities
- Additional rental needs
- Seasonal pricing variations

## Booking Tips

- **Book early**: Popular venues book 12-18 months in advance
- **Visit in person**: Photos don''t always capture the full experience
- **Read contracts carefully**: Understand all policies and restrictions
- **Ask about preferred vendors**: Some venues have exclusive or preferred vendor lists
- **Consider the season**: Pricing and availability vary significantly by season

## Making Your Decision

Your venue sets the tone for your entire celebration. Choose a location that reflects your personality as a couple and provides the atmosphere you want for your special day. Whether you envision an intimate garden party or a grand ballroom celebration, New England has the perfect venue waiting for you.

*Ready to visit these amazing venues? Contact our team to help coordinate tours and connect you with venue specialists who know these locations inside and out.*',
    'venues',
    ARRAY['venues', 'new england', 'wedding locations', 'venue guide'],
    'published',
    false,
    15,
    'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
    now() - interval '1 week'
  ),
  (
    'Working with Your Wedding DJ: A Complete Guide',
    'working-with-wedding-dj-complete-guide',
    'Your DJ sets the mood for your entire celebration. Learn how to work with them to create the perfect soundtrack for your special day.',
    'Your wedding DJ is responsible for one of the most important elements of your reception - the music that will get your guests dancing and create the perfect atmosphere for your celebration.

## Before You Book

### Questions to Ask Potential DJs:

1. **What''s your music style and library size?**
2. **Do you take requests from guests?**
3. **What equipment do you provide?**
4. **Do you offer MC services?**
5. **What''s your backup plan for equipment failure?**
6. **Can you provide references from recent weddings?**

### Red Flags:
- Won''t let you hear them perform live or see videos
- Extremely low prices with no clear explanation
- Poor communication or unprofessional behavior
- No backup equipment or contingency plans
- Unwillingness to accommodate your music preferences

## Planning Your Music

### Essential Playlists to Prepare:

**Ceremony Music:**
- Prelude (as guests arrive)
- Processional (wedding party entrance)
- Bridal entrance
- Recessional (exit music)

**Cocktail Hour:**
- Background music that encourages conversation
- Usually jazz, acoustic, or light pop
- Volume should allow for easy conversation

**Reception Music:**
- Dinner music (background, conversational)
- First dance song
- Parent dance songs
- Party music for dancing
- Last dance/send-off song

### Do Not Play List

Just as important as your must-play list:
- Songs that remind you of exes
- Music that doesn''t fit your vibe
- Explicit content if you have young guests
- Overly sad or inappropriate songs

## Timeline Coordination

Your DJ should work closely with your coordinator (or act as MC) to:
- Announce key moments
- Coordinate with other vendors
- Keep the timeline moving smoothly
- Handle any unexpected changes

### Key Announcements:
- Welcome and introduction
- Dinner service instructions
- Toast introductions
- Special dances
- Bouquet/garter toss
- Last dance announcement

## Equipment and Setup

Professional DJs should provide:
- High-quality sound system appropriate for your venue size
- Wireless microphones for ceremony and toasts
- Backup equipment for all critical components
- Appropriate lighting (if included in package)
- Professional setup and breakdown

## Music Preferences Meeting

Schedule a detailed meeting 4-6 weeks before your wedding to discuss:

### Must-Play Songs:
- Your special songs as a couple
- Family favorites and requests
- Songs that get your crowd dancing
- Cultural or traditional music

### Reception Flow:
- Dinner music preferences
- Dancing music style and energy level
- Special moment songs
- Timeline and announcement preferences

## Working with Venue Restrictions

Some venues have:
- Sound level restrictions
- Equipment limitations
- Setup/breakdown time limits
- Preferred vendor lists

Make sure your DJ is familiar with your venue''s requirements and has worked there before if possible.

## Day-of Coordination

### Final Details to Confirm:
- Setup and breakdown times
- Sound check schedule
- Emergency contact information
- Final playlist and announcements
- Special requests or changes

### Communication:
- Designate one person (coordinator or family member) to communicate with DJ during reception
- Provide written timeline and key information
- Discuss hand signals for volume adjustments

## Getting the Most Value

### Package Inclusions to Look For:
- Ceremony sound system
- Cocktail hour music
- Reception DJ services
- MC/announcement services
- Basic lighting
- Online planning tools

### Potential Add-Ons:
- Additional lighting packages
- Photo booth services
- Extended hours
- Extra microphones
- Special effects (fog, sparklers)

## Budget Considerations

Wedding DJ services typically range from:
- **Basic packages**: $800 - $1,500
- **Standard packages**: $1,500 - $3,000
- **Premium packages**: $3,000 - $5,000+

Remember that your DJ will be responsible for keeping your party going all night long - it''s worth investing in someone who understands how to read a crowd and keep the energy high.

## Final Tips

- **Trust their expertise**: Good DJs know how to read a room and adjust accordingly
- **Be flexible**: Allow them to make adjustments based on crowd response
- **Communicate clearly**: Share your vision but be open to professional suggestions
- **Enjoy the moment**: Once you''ve done the planning, trust your DJ and dance the night away

Your DJ plays a crucial role in creating the atmosphere and energy of your wedding reception. By choosing the right professional and communicating your vision clearly, you''ll ensure your guests are dancing all night long.',
    'music-entertainment',
    ARRAY['dj', 'music', 'reception', 'entertainment', 'planning'],
    'published',
    false,
    9,
    'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    now() - interval '4 days'
  )
ON CONFLICT (slug) DO NOTHING;