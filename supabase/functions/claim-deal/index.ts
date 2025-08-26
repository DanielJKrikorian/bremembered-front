@@ .. @@
   try {
     const { packageId, packageName, serviceType, discountPercent } = await req.json();
     
     if (!packageId || !packageName || !serviceType) {
       throw new Error('Missing required fields: packageId, packageName, serviceType');
     }
 
     // Generate unique coupon code
     const servicePrefix = serviceType.substring(0, 3).toUpperCase();
     const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
     const code = `${servicePrefix}${randomSuffix}`;
     
     // Set expiration to 7 days from now
     const expirationDate = new Date();
     expirationDate.setDate(expirationDate.getDate() + 7);
 
     // Create coupon in database
     const { data: coupon, error } = await supabase
       .from('coupons')
       .insert({
         code,
         discount_percent: discountPercent,
         expiration_date: expirationDate.toISOString(),
         is_valid: true,
         service_package_id: packageId
       })
       .select()
       .single();
   } catch (error) {
   }