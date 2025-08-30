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

// Helper function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

// Helper function to calculate legacy payment splits
function calculateLegacyPaymentSplits(totalAmount) {
  const depositAmount = Math.round(totalAmount * 0.5);
  const finalAmount = totalAmount - depositAmount;
  const platformFee = 15000; // $150 in cents

  return {
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

async function findOrCreateCouple(coupleData) {
  try {
    const { data: existingCouple, error: searchError } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('email', coupleData.couple_email.toLowerCase())
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingCouple) {
      return existingCouple;
    }

    // Create new user and couple (same logic as previous script)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: coupleData.couple_email.toLowerCase(),
      password: Math.random().toString(36).slice(-8) + 'A1!',
      email_confirm: true,
      user_metadata: {
        name: coupleData.couple_name,
        role: 'couple'
      }
    });

    if (authError) throw authError;

    await supabase.from('users').insert({
      id: authUser.user.id,
      email: coupleData.couple_email.toLowerCase(),
      name: coupleData.couple_name,
      role: 'couple'
    });

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
      guest_count: parseInt(coupleData.guest_count) || null
    };

    const { data: createdCouple, error: coupleError } = await supabase
      .from('couples')
      .insert(newCouple)
      .select('id, user_id')
      .single();

    if (coupleError) throw coupleError;
    return createdCouple;
  } catch (error) {
    console.error(`Error with couple ${coupleData.couple_name}:`, error);
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

    return vendor;
  } catch (error) {
    console.error(`Error finding vendor ${vendorName}:`, error);
    return null;
  }
}

async function importBookingFromCSV(row) {
  try {
    console.log(`\n📝 Processing: ${row.couple_name} - ${row.service_type}`);

    // Find or create couple
    const couple = await findOrCreateCouple(row);

    // Find vendor
    const vendor = await findVendorByName(row.vendor_name);
    if (!vendor) {
      throw new Error(`Vendor not found: ${row.vendor_name}`);
    }

    // Create event
    const eventStartTime = `${row.event_date}T${row.event_time || '16:00'}:00`;
    const eventEndTime = new Date(new Date(eventStartTime).getTime() + 8 * 60 * 60 * 1000).toISOString();

    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        vendor_id: vendor.id,
        couple_id: couple.id,
        start_time: eventStartTime,
        end_time: eventEndTime,
        type: 'wedding',
        title: `${row.couple_name} Wedding - ${row.service_type}`,
        location: row.venue_name || null
      })
      .select('id')
      .single();

    if (eventError) throw eventError;

    // Calculate legacy payment splits
    const totalAmount = parseInt(row.total_amount);
    const paymentSplits = calculateLegacyPaymentSplits(totalAmount);

    // Create booking
    const bookingRecord = {
      couple_id: couple.id,
      vendor_id: vendor.id,
      status: row.status || 'confirmed',
      amount: totalAmount,
      service_type: row.service_type,
      event_id: newEvent.id,
      initial_payment: parseInt(row.deposit_amount) || Math.round(totalAmount * 0.5),
      paid_amount: row.deposit_paid === 'true' ? (parseInt(row.deposit_amount) || Math.round(totalAmount * 0.5)) : 0,
      created_at: `${row.booking_date}T10:00:00Z`,
      updated_at: new Date().toISOString(),
      
      // Legacy payment splits
      ...paymentSplits
    };

    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select('id')
      .single();

    if (bookingError) throw bookingError;

    // Record deposit payment if paid
    if (row.deposit_paid === 'true') {
      await supabase
        .from('payments')
        .insert({
          booking_id: newBooking.id,
          amount: parseInt(row.deposit_amount) || Math.round(totalAmount * 0.5),
          status: 'succeeded',
          payment_type: 'deposit',
          couple_id: couple.id,
          vendor_id: vendor.id,
          created_at: `${row.booking_date}T10:30:00Z`
        });
    }

    console.log(`✅ Successfully imported: ${row.couple_name}`);
    return { success: true, bookingId: newBooking.id };

  } catch (error) {
    console.error(`❌ Failed to import: ${row.couple_name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function importFromCSV(csvFilePath) {
  try {
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const bookings = parseCSV(csvContent);

    console.log(`📁 Found ${bookings.length} bookings in CSV file`);
    console.log('🚀 Starting import...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const booking of bookings) {
      const result = await importBookingFromCSV(booking);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push({
          couple: booking.couple_name,
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

    console.log('\n🎉 CSV import completed!');
    
  } catch (error) {
    console.error('❌ CSV import failed:', error);
  }
}

// Usage instructions
console.log(`
📋 LEGACY BOOKING IMPORT TOOL

USAGE:
1. Update the CSV file: scripts/legacy-bookings-template.csv
2. Run: node scripts/import-from-csv.js

CSV COLUMNS REQUIRED:
- couple_name, couple_email, couple_phone
- vendor_name, service_type, package_name  
- total_amount (in cents), event_date, event_time
- venue_name, venue_city, venue_state
- booking_date, status, deposit_paid
- deposit_amount, remaining_balance

EXAMPLE:
node scripts/import-from-csv.js
`);

// Run import if CSV file exists
const csvPath = path.join(__dirname, 'legacy-bookings-template.csv');
if (require.main === module && fs.existsSync(csvPath)) {
  importFromCSV(csvPath).catch(console.error);
}

module.exports = { importFromCSV, importBookingFromCSV };