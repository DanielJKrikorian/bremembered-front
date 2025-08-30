const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to calculate legacy payment splits
function calculateLegacyPaymentSplits(totalAmount) {
  const depositAmount = Math.round(totalAmount * 0.5); // 50% deposit
  const finalAmount = totalAmount - depositAmount; // Remaining 50%
  const platformFee = 15000; // $150 in cents

  return {
    // Legacy model: Platform gets deposit, vendor gets final payment
    vendor_deposit_share: 0,
    platform_deposit_share: depositAmount,
    vendor_final_share: finalAmount,
    platform_final_share: 0,
    vendor_total_earnings: finalAmount,
    platform_total_earnings: depositAmount + platformFee,
    platform_fee: platformFee,
    payment_model: 'legacy'
  };
}

// Sample legacy bookings data structure
const sampleLegacyBookings = [
  {
    // Required fields
    couple_name: 'Sarah & Michael Davis',
    couple_email: 'sarah.davis@email.com',
    couple_phone: '(555) 123-4567',
    vendor_name: 'Elegant Moments Photography',
    service_type: 'Photography',
    package_name: 'Premium Wedding Photography',
    total_amount: 250000, // $2,500 in cents
    event_date: '2024-08-15',
    event_time: '16:00',
    venue_name: 'Sunset Gardens',
    venue_city: 'Los Angeles',
    venue_state: 'CA',
    booking_date: '2024-01-15',
    status: 'confirmed',
    
    // Optional fields
    guest_count: 120,
    special_requests: 'Please capture sunset photos',
    deposit_paid: true,
    deposit_amount: 125000, // $1,250 in cents
    remaining_balance: 125000 // $1,250 in cents
  }
  // Add more bookings here...
];

async function findOrCreateCouple(coupleData) {
  try {
    // First, try to find existing couple by email
    const { data: existingCouple, error: searchError } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('email', coupleData.couple_email.toLowerCase())
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingCouple) {
      console.log(`✅ Found existing couple: ${coupleData.couple_name}`);
      return existingCouple;
    }

    // Create new user account
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: coupleData.couple_email.toLowerCase(),
      password: Math.random().toString(36).slice(-8) + 'A1!',
      email_confirm: true,
      user_metadata: {
        name: coupleData.couple_name,
        role: 'couple'
      }
    });

    if (authError) {
      throw authError;
    }

    // Create user record
    await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: coupleData.couple_email.toLowerCase(),
        name: coupleData.couple_name,
        role: 'couple'
      });

    // Create couple profile
    const [partner1Name, partner2Name] = coupleData.couple_name.split(' & ');
    
    const newCouple = {
      id: crypto.randomUUID(),
      user_id: authUser.user.id,
      name: coupleData.couple_name,
      partner1_name: partner1Name || coupleData.couple_name,
      partner2_name: partner2Name || null,
      email: coupleData.couple_email.toLowerCase(),
      phone: coupleData.couple_phone || null,
      wedding_date: coupleData.event_date || null,
      venue_name: coupleData.venue_name || null,
      venue_city: coupleData.venue_city || null,
      venue_state: coupleData.venue_state || null,
      guest_count: coupleData.guest_count || null
    };

    const { data: createdCouple, error: coupleError } = await supabase
      .from('couples')
      .insert(newCouple)
      .select('id, user_id')
      .single();

    if (coupleError) {
      throw coupleError;
    }

    console.log(`✅ Created new couple: ${coupleData.couple_name}`);
    return createdCouple;
  } catch (error) {
    console.error(`❌ Error with couple ${coupleData.couple_name}:`, error);
    throw error;
  }
}

async function findVendorByName(vendorName) {
  try {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, name')
      .ilike('name', `%${vendorName}%`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!vendor) {
      console.warn(`⚠️  Vendor not found: ${vendorName}`);
      return null;
    }

    return vendor;
  } catch (error) {
    console.error(`❌ Error finding vendor ${vendorName}:`, error);
    return null;
  }
}

async function findOrCreateVenue(venueData) {
  if (!venueData.venue_name) return null;

  try {
    // Try to find existing venue
    const { data: existingVenue, error: searchError } = await supabase
      .from('venues')
      .select('id')
      .eq('name', venueData.venue_name)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingVenue) {
      return existingVenue;
    }

    // Create new venue
    const newVenue = {
      name: venueData.venue_name,
      city: venueData.venue_city || null,
      state: venueData.venue_state || null,
      region: venueData.venue_state || null
    };

    const { data: createdVenue, error: venueError } = await supabase
      .from('venues')
      .insert(newVenue)
      .select('id')
      .single();

    if (venueError) {
      throw venueError;
    }

    console.log(`✅ Created venue: ${venueData.venue_name}`);
    return createdVenue;
  } catch (error) {
    console.error(`❌ Error with venue ${venueData.venue_name}:`, error);
    return null;
  }
}

async function findServicePackage(serviceType, packageName) {
  try {
    const { data: package, error } = await supabase
      .from('service_packages')
      .select('id')
      .eq('service_type', serviceType)
      .ilike('name', `%${packageName}%`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return package;
  } catch (error) {
    console.error(`❌ Error finding package ${packageName}:`, error);
    return null;
  }
}

async function importLegacyBooking(bookingData) {
  try {
    console.log(`\n📝 Processing: ${bookingData.couple_name} - ${bookingData.service_type}`);

    // 1. Find or create couple
    const couple = await findOrCreateCouple(bookingData);

    // 2. Find vendor
    const vendor = await findVendorByName(bookingData.vendor_name);
    if (!vendor) {
      console.error(`❌ Skipping booking - vendor not found: ${bookingData.vendor_name}`);
      return { success: false, error: 'Vendor not found' };
    }

    // 3. Find or create venue
    const venue = await findOrCreateVenue(bookingData);

    // 4. Find service package
    const servicePackage = await findServicePackage(bookingData.service_type, bookingData.package_name);

    // 5. Create event
    const eventStartTime = `${bookingData.event_date}T${bookingData.event_time || '16:00'}:00`;
    const eventEndTime = new Date(new Date(eventStartTime).getTime() + 8 * 60 * 60 * 1000).toISOString(); // +8 hours

    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        vendor_id: vendor.id,
        couple_id: couple.id,
        start_time: eventStartTime,
        end_time: eventEndTime,
        type: 'wedding',
        title: `${bookingData.couple_name} Wedding - ${bookingData.service_type}`,
        location: bookingData.venue_name || null
      })
      .select('id')
      .single();

    if (eventError) {
      throw eventError;
    }

    // 6. Calculate legacy payment splits
    const paymentSplits = calculateLegacyPaymentSplits(bookingData.total_amount);

    // 7. Create booking with legacy payment model
    const bookingRecord = {
      couple_id: couple.id,
      vendor_id: vendor.id,
      status: bookingData.status || 'confirmed',
      amount: bookingData.total_amount,
      service_type: bookingData.service_type,
      package_id: servicePackage?.id || null,
      event_id: newEvent.id,
      venue_id: venue?.id || null,
      initial_payment: bookingData.deposit_amount || Math.round(bookingData.total_amount * 0.5),
      paid_amount: bookingData.deposit_paid ? (bookingData.deposit_amount || Math.round(bookingData.total_amount * 0.5)) : 0,
      created_at: `${bookingData.booking_date}T10:00:00Z`,
      updated_at: new Date().toISOString(),
      
      // Legacy payment splits
      ...paymentSplits
    };

    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select('id')
      .single();

    if (bookingError) {
      throw bookingError;
    }

    // 8. Record deposit payment if paid
    if (bookingData.deposit_paid) {
      await supabase
        .from('payments')
        .insert({
          booking_id: newBooking.id,
          amount: bookingData.deposit_amount || Math.round(bookingData.total_amount * 0.5),
          status: 'succeeded',
          payment_type: 'deposit',
          couple_id: couple.id,
          vendor_id: vendor.id,
          created_at: `${bookingData.booking_date}T10:30:00Z`
        });
    }

    console.log(`✅ Successfully imported booking for ${bookingData.couple_name}`);
    return { success: true, bookingId: newBooking.id };

  } catch (error) {
    console.error(`❌ Failed to import booking for ${bookingData.couple_name}:`, error);
    return { success: false, error: error.message };
  }
}

async function importAllLegacyBookings() {
  console.log('🚀 Starting legacy booking import...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const bookingData of sampleLegacyBookings) {
    const result = await importLegacyBooking(bookingData);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      errors.push({
        couple: bookingData.couple_name,
        error: result.error
      });
    }
  }

  console.log('\n📊 IMPORT SUMMARY:');
  console.log(`✅ Successful imports: ${successCount}`);
  console.log(`❌ Failed imports: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(err => {
      console.log(`- ${err.couple}: ${err.error}`);
    });
  }

  console.log('\n🎉 Legacy booking import completed!');
}

// Export functions for use
module.exports = {
  importLegacyBooking,
  importAllLegacyBookings,
  calculateLegacyPaymentSplits,
  sampleLegacyBookings
};

// Run import if called directly
if (require.main === module) {
  importAllLegacyBookings().catch(console.error);
}