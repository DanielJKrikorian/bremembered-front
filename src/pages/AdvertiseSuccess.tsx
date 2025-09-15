import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AdvertiseSuccess: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const handleSuccess = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');
      const adData = JSON.parse(decodeURIComponent(params.get('adData') || '{}'));

      if (!sessionId || !adData) return;

      try {
        // Verify Stripe session (optional, for security)
        // Example: await fetch(`/api/verify-session?session_id=${sessionId}`);

        // Upload images to Supabase Storage
        let assetUrl = '';
        let logoUrl = '';
        if (adData.selected_pages.image) {
          const fileName = `${Date.now()}-image-${adData.selected_pages.image.name}`;
          const { error } = await supabase.storage
            .from('ads')
            .upload(fileName, adData.selected_pages.image, { contentType: adData.selected_pages.image.type });
          if (error) throw new Error(`Failed to upload image: ${error.message}`);
          const { data: publicData } = supabase.storage.from('ads').getPublicUrl(fileName);
          assetUrl = publicData.publicUrl;
        }
        if (adData.selected_pages.logo) {
          const fileName = `${Date.now()}-logo-${adData.selected_pages.logo.name}`;
          const { error } = await supabase.storage
            .from('ads')
            .upload(fileName, adData.selected_pages.logo, { contentType: adData.selected_pages.logo.type });
          if (error) throw new Error(`Failed to upload logo: ${error.message}`);
          const { data: publicData } = supabase.storage.from('ads').getPublicUrl(fileName);
          logoUrl = publicData.publicUrl;
        }

        // Insert into ads table
        const { error: dbError } = await supabase.from('ads').insert({
          ...adData,
          asset_url: assetUrl,
          logo_url: logoUrl,
        });
        if (dbError) throw new Error(`Failed to save ad: ${dbError.message}`);
      } catch (error) {
        console.error('Error processing payment:', error);
      }
    };

    handleSuccess();
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
        <p className="text-gray-600">Your ad purchase has been processed. You'll receive a confirmation email soon.</p>
      </Card>
    </div>
  );
};