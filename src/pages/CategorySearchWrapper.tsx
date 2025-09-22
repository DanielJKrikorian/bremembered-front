import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SearchResults } from './SearchResults';

const categoryMap: Record<string, { name: string; filter: string; description: string }> = {
  photography: {
    name: "Wedding Photography",
    filter: "Photography",
    description: "Find professional wedding photographers worldwide for every style and budget."
  },
  videography: {
    name: "Wedding Videography",
    filter: "Videography",
    description: "Capture your wedding day with cinematic videographers offering highlight films and full edits."
  },
  "dj-services": {
    name: "Wedding DJs",
    filter: "DJ Services",
    description: "Book experienced DJs to create the perfect soundtrack for your wedding celebration."
  },
  venues: {
    name: "Wedding Venues",
    filter: "Venues",
    description: "Browse stunning wedding venues across the globe, from rustic barns to luxury resorts."
  },
  catering: {
    name: "Wedding Catering",
    filter: "Catering",
    description: "Discover caterers offering gourmet menus, buffets, and cultural cuisine for weddings."
  },
  "photo-booth": {
    name: "Wedding Photo Booths",
    filter: "Photo Booth",
    description: "Add fun to your reception with modern and classic wedding photo booth rentals."
  },
  rentals: {
    name: "Wedding Rentals",
    filter: "Rentals",
    description: "Find wedding rentals including chairs, tables, linens, arches, tents, and décor."
  },
  planning: {
    name: "Wedding Planning",
    filter: "Planning",
    description: "Work with expert planners to organize, design, and manage your dream wedding."
  },
  coordination: {
    name: "Day-of Coordination",
    filter: "Coordination",
    description: "Hire coordinators to ensure your wedding day runs smoothly from start to finish."
  },
  "live-music": {
    name: "Live Wedding Musicians",
    filter: "Live Musician",
    description: "Book live musicians for ceremonies, cocktail hours, and receptions."
  }
};

export const CategorySearchWrapper: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const categoryData = category ? categoryMap[category] : null;

  useEffect(() => {
    if (!categoryData) {
      navigate('/search');
    }
  }, [category, categoryData, navigate]);

  if (!categoryData) return null;

  return (
    <>
      {/* SEO Metadata */}
      <Helmet>
        <title>{categoryData.name} | B. Remembered</title>
        <meta name="description" content={categoryData.description} />
        <link rel="canonical" href={`https://bremembered.io/services/${category}`} />

        {/* JSON-LD Schema for Service */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": categoryData.name,
            "provider": {
              "@type": "Organization",
              "name": "B. Remembered",
              "url": "https://bremembered.io"
            },
            "areaServed": { "@type": "Place", "name": "Worldwide" },
            "description": categoryData.description,
            "url": `https://bremembered.io/services/${category}`
          })}
        </script>
      </Helmet>

      {/* Pass filters to SearchResults */}
      <SearchResults initialFilters={{ serviceTypes: [categoryData.filter] }} />
    </>
  );
};
