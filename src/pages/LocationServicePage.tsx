// src/pages/LocationServicePage.tsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet"; // For SEO meta tags
import { SearchResults } from "./SearchResults";

export const LocationServicePage: React.FC = () => {
  const { state, city, service } = useParams<{ state: string; city: string; service: string }>();

  // Format text
  const formattedState = state?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  const formattedCity = city?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  const formattedService = service?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";

  const pageTitle = `${formattedService} in ${formattedCity}, ${formattedState} | B. Remembered`;
  const pageDescription = `Find trusted ${formattedService.toLowerCase()} vendors in ${formattedCity}, ${formattedState}. 
    Browse wedding professionals, compare packages, and book directly on B. Remembered.`;

  // Scroll to top when loading
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state, city, service]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://bremembered.io/locations/${state}/${city}/${service}`} />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-rose-500 to-pink-600 py-16 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">
          {formattedService} in {formattedCity}, {formattedState}
        </h1>
        <p className="max-w-2xl mx-auto text-lg opacity-90">
          Discover and book the best {formattedService.toLowerCase()} professionals in {formattedCity}.  
          Plan, organize, and make your special day unforgettable with B. Remembered.
        </p>
      </section>

      {/* Optional: Render Search Results pre-filtered */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <SearchResults
          initialFilters={{
            serviceTypes: [formattedService],
            locations: [`${formattedCity}, ${formattedState}`],
          }}
        />
      </div>

      {/* Static SEO Content */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">Why Choose B. Remembered?</h2>
          <p className="text-gray-600 leading-relaxed">
            At B. Remembered, we make wedding planning seamless. Whether you’re booking
            photographers, videographers, DJs, planners, or venues in {formattedCity}, our
            platform helps you compare options, customize packages, and book instantly —
            all in one place.
          </p>
        </div>
      </section>
    </div>
  );
};
