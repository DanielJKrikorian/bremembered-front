# Legacy Booking Import Scripts

This directory contains scripts to help import legacy bookings with the correct payment splits for the transition from the old payment model to the new 50/50 split model.

## 🎯 **Payment Models Explained**

### **Legacy Model (Old)**
- Platform gets: 100% of deposit + $150 fee
- Vendor gets: 100% of final payment

### **Split Model (New)** 
- Platform gets: 50% of deposit + 50% of final + $150 fee
- Vendor gets: 50% of deposit + 50% of final + tips

## 📁 **Files**

### `import-legacy-bookings.js`
- Main import script with sample data
- Handles couple/vendor/venue creation
- Calculates legacy payment splits
- Creates bookings with `payment_model = 'legacy'`

### `import-from-csv.js`
- CSV import script for bulk data
- Uses the template CSV format
- Same logic as main script but reads from CSV

### `legacy-bookings-template.csv`
- Template CSV file with required columns
- Replace with your actual booking data
- Includes sample data for reference

## 🚀 **How to Use**

### **Option 1: CSV Import (Recommended)**
1. **Edit the CSV file**: `scripts/legacy-bookings-template.csv`
2. **Replace sample data** with your actual bookings
3. **Run the import**:
   ```bash
   cd scripts
   node import-from-csv.js
   ```

### **Option 2: Code-based Import**
1. **Edit the sample data** in `import-legacy-bookings.js`
2. **Replace `sampleLegacyBookings`** with your data
3. **Run the import**:
   ```bash
   cd scripts
   node import-legacy-bookings.js
   ```

## 📊 **CSV Format**

| Column | Description | Example |
|--------|-------------|---------|
| `couple_name` | Full couple name | "Sarah & Michael Davis" |
| `couple_email` | Primary email | sarah.davis@email.com |
| `couple_phone` | Phone number | (555) 123-4567 |
| `vendor_name` | Vendor business name | Elegant Moments Photography |
| `service_type` | Service category | Photography |
| `package_name` | Package name | Premium Wedding Photography |
| `total_amount` | Total price in cents | 250000 |
| `event_date` | Wedding date | 2024-08-15 |
| `event_time` | Start time | 16:00 |
| `venue_name` | Venue name | Sunset Gardens |
| `venue_city` | Venue city | Los Angeles |
| `venue_state` | Venue state | CA |
| `booking_date` | When booked | 2024-01-15 |
| `status` | Booking status | confirmed |
| `deposit_paid` | Deposit paid? | true |
| `deposit_amount` | Deposit in cents | 125000 |
| `remaining_balance` | Balance in cents | 125000 |

## ⚠️ **Important Notes**

1. **Amounts in cents**: All monetary values should be in cents (e.g., $25.00 = 2500)
2. **Vendor names must match**: Vendor names in CSV must match existing vendors in database
3. **Email uniqueness**: Each couple email should be unique
4. **Date format**: Use YYYY-MM-DD for dates, HH:MM for times
5. **Backup first**: Always backup your database before running imports

## 🔍 **What the Script Does**

1. **Creates missing couples** - If couple doesn't exist, creates user account and profile
2. **Finds existing vendors** - Matches vendors by name (must exist in database)
3. **Creates venues** - Creates venue records if they don't exist
4. **Calculates legacy splits** - Uses old payment model calculations
5. **Creates events** - Sets up wedding events with proper timing
6. **Records payments** - Logs deposit payments if already made
7. **Generates contracts** - Creates service contracts for each booking

## 📈 **After Import**

- All legacy bookings will have `payment_model = 'legacy'`
- New bookings will have `payment_model = 'split'`
- Payout functions automatically use the correct model
- No changes needed to existing payout logic

## 🆘 **Support**

If you encounter issues:
1. Check the console output for specific error messages
2. Verify vendor names match exactly
3. Ensure all required CSV columns are present
4. Contact support if you need help with the import process