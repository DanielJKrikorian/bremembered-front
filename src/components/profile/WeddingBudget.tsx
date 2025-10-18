import React, { useState, useEffect } from 'react';
import { useCouple } from '../../hooks/useCouple';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { DollarSign, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import { Progress } from '../ui/Progress';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Recommended budget breakdown (2025 US averages from wedding industry data)
const RECOMMENDED_BREAKDOWN = [
  { category: 'Venue', percentage: 25 },
  { category: 'Catering', percentage: 20 },
  { category: 'Photography', percentage: 10 },
  { category: 'Music/DJ', percentage: 8 },
  { category: 'Flowers/Decor', percentage: 8 },
  { category: 'Attire', percentage: 7 },
  { category: 'Planner', percentage: 10 },
  { category: 'Officiant', percentage: 2 },
  { category: 'Transportation', percentage: 2 },
  { category: 'Rings', percentage: 3 },
  { category: 'Cake', percentage: 2 },
  { category: 'Invitations', percentage: 2 },
  { category: 'Attendants Gifts', percentage: 1 },
];

// Budget tips
const BUDGET_TIPS = [
  'Venue and catering: 45% of budget—book off-peak for 20-30% savings (2025 wedding industry data).',
  'Photography: $3,300 average for 8 hours; add video for $2,000-3,000 (2025 wedding industry data).',
  'Music/DJ: $1,500-3,000; live bands cost 20% more (2025 wedding industry data).',
  'Flowers/Decor: Seasonal or DIY saves 30-50% (2025 wedding industry data).',
  'Track planned expenses with zero payments to see budget impact.',
];

interface BudgetItem {
  id: string;
  couple_id: string;
  category: string;
  vendor_name: string;
  total_cost: number; // In cents
  deposit_paid: number;
  final_paid: number;
  notes: string;
  created_at: string;
}

interface BookingSummary {
  id: string;
  service_type: string;
  vendor_id: string;
  vendor_name: string;
  status: string;
  spent: number; // Sum of payments.amount
  total: number; // vendor_deposit_share + platform_deposit_share + vendor_final_share + platform_final_share
}

export const WeddingBudget: React.FC = () => {
  const { couple, loading: coupleLoading } = useCouple();
  const [totalBudget, setTotalBudget] = useState<number>(33000); // Default $33,000
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BudgetItem | null>(null);

  // Fetch budget data
  useEffect(() => {
    const fetchBudgetData = async () => {
      if (coupleLoading || !couple?.id) {
        console.log('Waiting for couple data to load or no couple ID available');
        return;
      }
      try {
        setLoading(true);
        // Fetch total budget
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('budget_total')
          .eq('id', couple.id)
          .single();
        if (coupleError) {
          console.error('Error fetching budget_total:', coupleError);
          throw new Error('Failed to fetch total budget. Ensure the budget_total column exists in the couples table.');
        }
        setTotalBudget((coupleData?.budget_total || 33000 * 100) / 100);

        // Fetch manual budget items
        const { data: items, error: itemsError } = await supabase
          .from('wedding_budget_items')
          .select('*')
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false });
        if (itemsError) {
          console.error('Error fetching wedding_budget_items:', itemsError);
          throw new Error('Failed to fetch budget items. Ensure the wedding_budget_items table exists.');
        }
        setBudgetItems(items || []);

        // Fetch bookings with vendor name and payment amounts
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            id,
            service_type,
            vendor_id,
            status,
            vendor_deposit_share,
            platform_deposit_share,
            vendor_final_share,
            platform_final_share,
            vendors!inner(name)
          `)
          .eq('couple_id', couple.id)
          .in('status', ['confirmed', 'completed']);
        if (bookingError) {
          console.error('Error fetching bookings:', bookingError);
          throw new Error('Failed to fetch bookings: ' + bookingError.message);
        }

        // Fetch payment amounts for each booking
        const summaries = await Promise.all(
          bookingData?.map(async (b: any) => {
            const { data: paymentData, error: paymentError } = await supabase
              .from('payments')
              .select('amount')
              .eq('vendor_id', b.vendor_id)
              .eq('couple_id', couple.id);
            if (paymentError) {
              console.error(`Error fetching payments for vendor ${b.vendor_id}, couple ${couple.id}:`, paymentError);
              throw new Error(`Failed to fetch payments: ${paymentError.message}`);
            }
            const spent = paymentData?.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) || 0;
            return {
              id: b.id,
              service_type: b.service_type,
              vendor_id: b.vendor_id,
              vendor_name: b.vendors?.name || 'Unknown Vendor',
              status: b.status,
              spent, // Sum of payments.amount
              total: ((b.vendor_deposit_share || 0) + (b.platform_deposit_share || 0) + (b.vendor_final_share || 0) + (b.platform_final_share || 0)),
            };
          }) || [],
        );
        setBookings(summaries);
      } catch (err: any) {
        console.error('Error fetching budget data:', err);
        setError(err.message || 'Failed to fetch budget data');
      } finally {
        setLoading(false);
      }
    };
    fetchBudgetData();
  }, [couple?.id, coupleLoading]);

  // Save total budget
  const saveTotalBudget = async () => {
    if (!couple?.id) {
      setError('Please log in to save your budget');
      return;
    }
    try {
      const { error } = await supabase
        .from('couples')
        .update({ budget_total: Math.round(totalBudget * 100) }) // Store in cents
        .eq('id', couple.id);
      if (error) throw error;
      alert('Budget saved!');
    } catch (err: any) {
      console.error('Error saving budget:', err);
      setError('Failed to save budget: ' + err.message);
    }
  };

  // Add new budget item
  const addBudgetItem = () => {
    if (!couple?.id) {
      setError('Please log in to add a budget item');
      return;
    }
    setEditingId(null);
    setEditForm({
      id: '',
      couple_id: couple.id,
      category: '',
      vendor_name: '',
      total_cost: 0,
      deposit_paid: 0,
      final_paid: 0,
      notes: '',
      created_at: new Date().toISOString(),
    });
  };

  // Save/edit budget item
  const saveBudgetItem = async () => {
    if (!editForm || !couple?.id) {
      setError('Please log in to save a budget item');
      return;
    }
    try {
      const { error } = await supabase
        .from('wedding_budget_items')
        .upsert({
          id: editForm.id || undefined,
          couple_id: couple.id,
          category: editForm.category,
          vendor_name: editForm.vendor_name,
          total_cost: Math.round(editForm.total_cost * 100),
          deposit_paid: Math.round(editForm.deposit_paid * 100),
          final_paid: Math.round(editForm.final_paid * 100),
          notes: editForm.notes,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      setEditingId(null);
      setEditForm(null);
      const { data, error: fetchError } = await supabase
        .from('wedding_budget_items')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setBudgetItems(data || []);
    } catch (err: any) {
      console.error('Error saving item:', err);
      setError('Failed to save item: ' + err.message);
    }
  };

  // Delete budget item
  const deleteBudgetItem = async (id: string) => {
    if (!couple?.id) {
      setError('Please log in to delete a budget item');
      return;
    }
    try {
      const { error } = await supabase
        .from('wedding_budget_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setBudgetItems(budgetItems.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item: ' + err.message);
    }
  };

  // Edit budget item
  const editBudgetItem = (item: BudgetItem) => {
    if (!couple?.id) {
      setError('Please log in to edit a budget item');
      return;
    }
    setEditingId(item.id);
    setEditForm({ ...item, total_cost: item.total_cost / 100, deposit_paid: item.deposit_paid / 100, final_paid: item.final_paid / 100 });
  };

  // Aggregate spending and planned expenses by category
  const spendingByCategory = () => {
    const categories: { [key: string]: { spent: number; owed: number } } = {};
    RECOMMENDED_BREAKDOWN.forEach(item => {
      categories[item.category] = { spent: 0, owed: 0 };
    });
    budgetItems.forEach(item => {
      categories[item.category] = categories[item.category] || { spent: 0, owed: 0 };
      categories[item.category].spent += item.deposit_paid + item.final_paid;
      categories[item.category].owed += item.total_cost - item.deposit_paid - item.final_paid;
    });
    bookings.forEach(booking => {
      categories[booking.service_type] = categories[booking.service_type] || { spent: 0, owed: 0 };
      categories[booking.service_type].spent += booking.spent;
      categories[booking.service_type].owed += booking.total - booking.spent;
    });
    return Object.entries(categories)
      .filter(([_, { spent, owed }]) => spent > 0 || owed > 0)
      .map(([category, { spent, owed }]) => ({
        category,
        spent: spent / 100,
        owed: owed / 100,
        total: (spent + owed) / 100,
      }));
  };

  // Calculate totals
  const totalSpent = spendingByCategory().reduce((sum, item) => sum + item.spent, 0);
  const totalOwed = spendingByCategory().reduce((sum, item) => sum + item.owed, 0);
  const remaining = totalBudget - (totalSpent + totalOwed);

  // Donut chart data
  const chartData = {
    labels: spendingByCategory().map(item => item.category),
    datasets: [{
      data: spendingByCategory().map(item => item.total),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
      borderWidth: 1,
      cutout: '60%', // Donut effect
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const { category, total } = spendingByCategory()[context.dataIndex];
            const percentage = totalBudget ? ((total / totalBudget) * 100).toFixed(1) : 0;
            return `${category}: $${total.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (coupleLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!couple?.id) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">Please log in to view your wedding budget.</p>
        <Button variant="primary" onClick={() => window.location.href = '/login'}>
          Log In
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading budget...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Wedding Budget Planner</h2>
        <p className="text-gray-600 mb-6">Track all wedding expenses, including planned costs. Average US wedding in 2025: $33,000 (wedding industry data).</p>
        {error && <p className="text-red-600 mb-4 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> {error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Total Budget ($)"
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
              placeholder="33000"
              icon={DollarSign}
            />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Total Spent: ${totalSpent.toLocaleString()}</p>
              <p className="text-sm text-orange-600">Total Owed: ${totalOwed.toLocaleString()}</p>
              <p className="text-lg font-semibold text-green-600">Remaining: ${remaining.toLocaleString()}</p>
              <Progress value={totalBudget ? ((totalSpent + totalOwed) / totalBudget) * 100 : 0} className="w-full" />
            </div>
            <Button onClick={saveTotalBudget}>Save Budget</Button>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Add/Edit Expense</h3>
        {editForm && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="Category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                placeholder="Photography"
              />
              <Input
                label="Vendor Name"
                value={editForm.vendor_name}
                onChange={(e) => setEditForm({ ...editForm, vendor_name: e.target.value })}
                placeholder="Vendor Name"
              />
              <Input
                label="Total Cost ($)"
                type="number"
                value={editForm.total_cost}
                onChange={(e) => setEditForm({ ...editForm, total_cost: Number(e.target.value) })}
                placeholder="1000"
              />
              <Input
                label="Deposit Paid ($)"
                type="number"
                value={editForm.deposit_paid}
                onChange={(e) => setEditForm({ ...editForm, deposit_paid: Number(e.target.value) })}
                placeholder="0"
              />
              <Input
                label="Final Paid ($)"
                type="number"
                value={editForm.final_paid}
                onChange={(e) => setEditForm({ ...editForm, final_paid: Number(e.target.value) })}
                placeholder="0"
              />
              <Input
                label="Notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notes..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</Button>
              <Button onClick={saveBudgetItem}>Save</Button>
            </div>
          </div>
        )}
        {!editForm && (
          <Button onClick={addBudgetItem} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">All Expenses</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Owed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vendor_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(item.total_cost / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${((item.deposit_paid + item.final_paid) / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">${((item.total_cost - item.deposit_paid - item.final_paid) / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.notes || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button size="sm" variant="ghost" onClick={() => editBudgetItem(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteBudgetItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {bookings.map((booking) => (
                <tr key={booking.id} className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.service_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(booking.total / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(booking.spent / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">${((booking.total - booking.spent) / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Booked on platform</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Recommended Allocation</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount ($)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {RECOMMENDED_BREAKDOWN.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.percentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${(totalBudget * item.percentage / 100).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Budget Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {BUDGET_TIPS.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};