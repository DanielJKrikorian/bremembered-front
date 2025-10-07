import React, { useState, useEffect } from 'react';
import { useCouple } from '../../hooks/useCouple';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { DollarSign, AlertCircle, Megaphone, Plus, Trash2, Edit } from 'lucide-react';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// 2025 recommended budget breakdown (from Zola, The Knot: average $36,000)
const RECOMMENDED_BREAKDOWN = [
  { category: 'Venue', percentage: 25, average: 9000, tip: 'Largest expense; off-peak dates save 20-30% ($1,800-2,700).' },
  { category: 'Catering', percentage: 20, average: 7200, tip: '$100-200 per guest; buffet saves 15% ($1,080).' },
  { category: 'Photography', percentage: 10, average: 3600, tip: '8 hours $3,000-4,000; add video for +$3,600.' },
  { category: 'Music/DJ', percentage: 8, average: 2880, tip: 'DJ $1,500-3,000; bands +20% ($576).' },
  { category: 'Flowers/Decor', percentage: 8, average: 2880, tip: 'Seasonal $2,500; rentals save 50% ($1,440).' },
  { category: 'Attire', percentage: 7, average: 2520, tip: 'Dress $1,500-3,000; suits $200-500.' },
  { category: 'Planner', percentage: 10, average: 3600, tip: 'Full-service 10-15% ($3,600-5,400).' },
  { category: 'Officiant', percentage: 2, average: 720, tip: 'Civil $200-500; religious $300-800.' },
  { category: 'Transportation', percentage: 2, average: 720, tip: 'Limousines $500-1,000; shuttles save parking costs.' },
  { category: 'Rings', percentage: 3, average: 1080, tip: 'Bands $1,000-5,000; engagement 1-3 months salary.' },
  { category: 'Cake', percentage: 2, average: 720, tip: '$5-8 per guest; sheet cakes cheaper.' },
  { category: 'Invitations', percentage: 2, average: 720, tip: 'Digital saves 50%; printed $1-3 per guest.' },
  { category: 'Attendants Gifts', percentage: 1, average: 360, tip: '$50-100 per attendant; group gifts reduce.' },
];

interface CustomVendor {
  id?: string;
  vendor_name: string;
  service_type: string;
  total_cost: number;
  deposit_paid: number;
  balance_owed: number;
  notes?: string;
}

export const WeddingBudgetTable: React.FC = () => {
  const { couple } = useCouple();
  const [totalBudget, setTotalBudget] = useState<number>(36000); // Default to 2025 US average
  const [customVendors, setCustomVendors] = useState<CustomVendor[]>([]);
  const [bookedServices, setBookedServices] = useState<any[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings and custom vendors
  useEffect(() => {
    const fetchData = async () => {
      if (!couple?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('couple_id', couple.id);
        if (bookingsError) throw bookingsError;
        setBookedServices(bookingsData || []);

        // Fetch custom vendors
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('wedding_budget_entries')
          .select('*')
          .eq('couple_id', couple.id);
        if (vendorsError) throw vendorsError;
        setCustomVendors(vendorsData || []);
      } catch (err: any) {
        console.error('Error fetching budget data:', err);
        setError('Failed to fetch budget data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [couple?.id]);

  // Calculate totals
  const calculateSpent = () => {
    let total = 0;
    // Bookings
    bookedServices.forEach(booking => {
      const deposit = (booking.vendor_deposit_share || 0) + (booking.platform_deposit_share || 0);
      const final = (booking.vendor_final_share || 0) + (booking.platform_final_share || 0);
      total += deposit + final;
    });
    // Custom vendors
    customVendors.forEach(vendor => {
      total += vendor.deposit_paid;
    });
    // Other
    total += otherExpenses;
    return total;
  };

  const calculateOwed = () => {
    let total = 0;
    // Bookings (final owed)
    bookedServices.forEach(booking => {
      if (booking.final_payment_status !== 'paid') {
        total += (booking.vendor_final_share || 0) + (booking.platform_final_share || 0);
      }
    });
    // Custom vendors
    customVendors.forEach(vendor => {
      total += vendor.balance_owed;
    });
    return total;
  };

  const spent = calculateSpent();
  const owed = calculateOwed();
  const remaining = totalBudget - spent;

  // Add custom vendor
  const addCustomVendor = () => {
    setCustomVendors([...customVendors, { vendor_name: '', service_type: '', total_cost: 0, deposit_paid: 0, balance_owed: 0 }]);
  };

  // Update custom vendor
  const updateCustomVendor = (index: number, field: keyof CustomVendor, value: string | number) => {
    const newVendors = [...customVendors];
    newVendors[index] = { ...newVendors[index], [field]: value };
    setCustomVendors(newVendors);
  };

  // Remove custom vendor
  const removeCustomVendor = async (index: number) => {
    const vendor = customVendors[index];
    if (vendor.id) {
      // Delete from Supabase
      const { error } = await supabase
        .from('wedding_budget_entries')
        .delete()
        .eq('id', vendor.id);
      if (error) {
        setError('Failed to delete vendor: ' + error.message);
        return;
      }
    }
    setCustomVendors(customVendors.filter((_, i) => i !== index));
  };

  // Save custom vendors
  const saveCustomVendors = async () => {
    setSaving(true);
    try {
      for (const vendor of customVendors) {
        if (vendor.vendor_name && !vendor.id) {
          // Insert new
          const { error } = await supabase
            .from('wedding_budget_entries')
            .insert({
              couple_id: couple.id,
              vendor_name: vendor.vendor_name,
              service_type: vendor.service_type,
              total_cost: vendor.total_cost,
              deposit_paid: vendor.deposit_paid,
              balance_owed: vendor.balance_owed,
              notes: vendor.notes,
            });
          if (error) throw error;
        } else if (vendor.id) {
          // Update existing
          const { error } = await supabase
            .from('wedding_budget_entries')
            .update({
              vendor_name: vendor.vendor_name,
              service_type: vendor.service_type,
              total_cost: vendor.total_cost,
              deposit_paid: vendor.deposit_paid,
              balance_owed: vendor.balance_owed,
              notes: vendor.notes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', vendor.id);
          if (error) throw error;
        }
      }
      setError(null);
    } catch (err: any) {
      console.error('Error saving vendors:', err);
      setError('Failed to save vendors: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Pie chart data
  const chartData = {
    labels: RECOMMENDED_BREAKDOWN.map(item => item.category),
    datasets: [{
      data: RECOMMENDED_BREAKDOWN.map(item => (totalBudget * item.percentage) / 100),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
        '#36A2EB', '#FFCE56', '#4BC0C0'
      ],
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const category = RECOMMENDED_BREAKDOWN[context.dataIndex];
            return `${category.category}: $${context.parsed.toLocaleString()} (${category.percentage}%) - ${category.tip}`;
          },
        },
      },
    },
  };

  if (loading) {
    return <div className="p-8 text-center">Loading budget...</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Wedding Budget Hub</h2>
        <p className="text-gray-600 mb-6">Track all expenses, see what's owed, and get a clear picture of your financials. Based on 2025 averages ($36,000 total).</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Total Budget"
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
            placeholder="36000"
            icon={DollarSign}
            className="md:col-span-1"
          />
          <div className="md:col-span-2 space-y-2">
            <p className="text-sm text-gray-600">Spent: ${spent.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Owed: ${owed.toLocaleString()}</p>
            <p className="text-lg font-semibold text-green-600">Remaining: ${remaining.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Recommended Allocation</h3>
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-md">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECOMMENDED_BREAKDOWN.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">{item.category}</h4>
              <p className="text-lg font-semibold">${(totalBudget * item.percentage / 100).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mb-2">{item.percentage}% of budget</p>
              <p className="text-xs text-gray-500">{item.tip}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Booked Services (On-Platform)</h3>
        {error && <p className="text-red-600 mb-4 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> {error}</p>}
        {bookedServices.length === 0 ? (
          <p className="text-gray-600">No on-platform bookings yet. Book through our site to track here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Service Type</th>
                  <th className="text-left p-2">Vendor ID</th>
                  <th className="text-left p-2">Deposit Paid</th>
                  <th className="text-left p-2">Final Owed</th>
                  <th className="text-left p-2">Total Spent</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookedServices.map((booking) => {
                  const deposit = (booking.vendor_deposit_share || 0) + (booking.platform_deposit_share || 0);
                  const final = (booking.vendor_final_share || 0) + (booking.platform_final_share || 0);
                  const total = deposit + final;
                  return (
                    <tr key={booking.id} className="border-b">
                      <td className="p-2">{booking.service_type}</td>
                      <td className="p-2">{booking.vendor_id}</td>
                      <td className="p-2">${deposit.toLocaleString()}</td>
                      <td className="p-2">${final.toLocaleString()}</td>
                      <td className="p-2 font-semibold">${total.toLocaleString()}</td>
                      <td className="p-2">{booking.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Custom Vendors (Off-Platform)</h3>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">Add vendors booked outside our site.</p>
          <Button variant="outline" onClick={addCustomVendor} icon={Plus}>
            Add Vendor
          </Button>
        </div>
        {customVendors.length === 0 ? (
          <p className="text-gray-600">No custom vendors added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vendor Name</th>
                  <th className="text-left p-2">Service Type</th>
                  <th className="text-left p-2">Total Cost</th>
                  <th className="text-left p-2">Deposit Paid</th>
                  <th className="text-left p-2">Balance Owed</th>
                  <th className="text-left p-2">Notes</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customVendors.map((vendor, index) => (
                  <tr key={vendor.id || index} className="border-b">
                    <td className="p-2">
                      <Input
                        value={vendor.vendor_name}
                        onChange={(e) => updateCustomVendor(index, 'vendor_name', e.target.value)}
                        placeholder="Vendor name"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={vendor.service_type}
                        onChange={(e) => updateCustomVendor(index, 'service_type', e.target.value)}
                        placeholder="e.g., Florist"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={vendor.total_cost}
                        onChange={(e) => updateCustomVendor(index, 'total_cost', Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={vendor.deposit_paid}
                        onChange={(e) => updateCustomVendor(index, 'deposit_paid', Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={vendor.balance_owed}
                        onChange={(e) => updateCustomVendor(index, 'balance_owed', Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={vendor.notes}
                        onChange={(e) => updateCustomVendor(index, 'notes', e.target.value)}
                        placeholder="Notes"
                      />
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" icon={Trash2} onClick={() => removeCustomVendor(index)} className="text-red-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button onClick={saveCustomVendors} loading={saving} className="mt-4">
              Save Custom Vendors
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Other Expenses</h3>
        <Input
          type="number"
          label="Miscellaneous (stamps, alterations, etc.)"
          value={otherExpenses}
          onChange={(e) => setOtherExpenses(Number(e.target.value) || 0)}
          placeholder="0"
          icon={DollarSign}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Budget Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Venue and catering: 45% of budget—prioritize for impact.</li>
          <li>• Photography: Book early for 10-15% discounts.</li>
          <li>• Track deposits vs. finals to avoid surprises.</li>
          <li>• For 100 guests, food alone is $6,000-8,000.</li>
          <li>• Use spreadsheets or apps like Mint for real-time tracking.</li>
        </ul>
      </Card>
    </div>
  );
};