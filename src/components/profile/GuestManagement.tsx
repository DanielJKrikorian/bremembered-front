import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Check, Trash2, Edit2, Send, Plus, Table2, Utensils, Upload, AlertCircle, SortAsc, SortDesc, Users, Download, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';
import { GuestModal } from './GuestModal';
import { TableEditModal } from './TableEditModal';
import { MealEditModal } from './MealEditModal';

interface Guest {
  id: string;
  couple_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  table_id?: string;
  table_name?: string;
  list_priority: '1' | '2' | '3';
  has_plus_one: boolean;
  plus_one_name?: string;
  family_members?: { name: string; age_category: 'adult' | 'child'; meal_option_id?: string; meal_option_name?: string }[];
  notes?: string;
  meal_option_id?: string;
  meal_option_name?: string;
  guest_type?: string;
  partner_id?: string;
  rsvp_status?: 'pending' | 'accepted' | 'declined';
  rsvp_token?: string;
  created_at: string;
  updated_at: string;
}

interface TableData {
  id: string;
  name: string;
}

interface MealOption {
  id: string;
  couple_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TableLayout {
  id: string;
  couple_id: string;
  table_id: string;
  table_name: string;
  type: 'round' | 'rectangle' | 'sweetheart';
  x: number;
  y: number;
}

interface RsvpShare {
  id: string;
  guest_id: string;
  token: string;
  status: string;
  created_at: string;
}

interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  table_id: string;
  list_priority: '1' | '2' | '3';
  has_plus_one: boolean;
  plus_one_name: string;
  family_members: { name: string; age_category: 'adult' | 'child'; meal_option_id: string }[];
  notes: string;
  meal_option_id: string;
  guest_type: string;
  partner_id: string;
}

const listPriorities = [
  { value: '1', label: 'Tier 1 (Must Invite)' },
  { value: '2', label: 'Tier 2 (Should Invite)' },
  { value: '3', label: 'Tier 3 (Optional)' },
];

const guestTypes = [
  { value: 'best_man', label: 'Best Man' },
  { value: 'maid_of_honor', label: 'Maid of Honor' },
  { value: 'matron_of_honor', label: 'Matron of Honor' },
  { value: 'groomsman', label: 'Groomsman' },
  { value: 'bridesmaid', label: 'Bridesmaid' },
  { value: 'family', label: 'Family' },
  { value: 'family_friend', label: 'Family Friend' },
  { value: 'friend', label: 'Friend' },
  { value: 'co_worker', label: 'Co-Worker' },
  { value: 'other', label: 'Other' }
];

const rsvpStatuses = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800' },
};

const sortOptions = [
  { value: 'list_priority', label: 'Priority' },
  { value: 'meal_option_name', label: 'Meal' },
  { value: 'rsvp_status', label: 'RSVP Status' },
  { value: 'guest_type', label: 'Type' },
  { value: 'partner_id', label: 'Invited By' }
];

export const GuestManagement: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [activeSubTab, setActiveSubTab] = useState<'guests' | 'tables' | 'meals' | 'import-export' | 'layout'>('guests');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [layouts, setLayouts] = useState<TableLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [rsvpLinks, setRsvpLinks] = useState<{ [key: string]: string }>({});
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealOption | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'list_priority' | 'meal_option_name' | 'rsvp_status' | 'guest_type' | 'partner_id'>('list_priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (couple?.id) {
      fetchAllData();
    }
  }, [couple]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchGuests(),
      fetchTables(),
      fetchMealOptions(),
      fetchLayouts()
    ]);
    setLoading(false);
  };

  const fetchGuests = async () => {
    if (!couple?.id) return;
    if (!supabase || !isSupabaseConfigured()) {
      setGuests([
        {
          id: '1',
          couple_id: couple.id,
          name: 'Smith Family',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St, Apt 4B, New York, NY, 10001, USA',
          table_id: 'table1',
          table_name: 'Table 1',
          list_priority: '1',
          has_plus_one: false,
          plus_one_name: '',
          family_members: [
            { name: 'John Smith', age_category: 'adult', meal_option_id: mealOptions[0]?.id, meal_option_name: 'Beef' },
            { name: 'Jane Smith', age_category: 'adult', meal_option_id: mealOptions[0]?.id, meal_option_name: 'Beef' },
            { name: 'Timmy Smith', age_category: 'child', meal_option_id: '', meal_option_name: '' }
          ],
          notes: 'Family with kids',
          meal_option_id: '',
          meal_option_name: '',
          guest_type: 'family',
          partner_id: couple.partner1_name || '',
          rsvp_status: 'accepted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          *,
          table:table_id ( name ),
          meal_option:meal_option_id ( name )
        `)
        .eq('couple_id', couple.id)
        .order('name');
      if (error) throw error;
      setGuests((data || []).map(g => ({
        ...g,
        table_name: g.table?.name || '',
        meal_option_name: g.meal_option?.name || '',
        guest_type: g.guest_type || 'friend',
        partner_id: g.partner_id || '',
        plus_one_name: g.plus_one_name || '',
        family_members: g.family_members || []
      })));
    } catch (err) {
      setError('Failed to fetch guests: ' + (err as Error).message);
    }
  };

  const fetchTables = async () => {
    if (!couple?.id) return;
    if (!supabase || !isSupabaseConfigured()) {
      setTables([{ id: 'table1', name: 'Table 1' }]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('couple_id', couple.id)
        .order('name');
      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      setError('Failed to fetch tables: ' + (err as Error).message);
    }
  };

  const fetchMealOptions = async () => {
    if (!couple?.id) return;
    if (!supabase || !isSupabaseConfigured()) {
      setMealOptions([
        { id: '1', couple_id: couple.id, name: 'Vegetarian', description: 'Veggie option', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', couple_id: couple.id, name: 'Chicken', description: 'Chicken entrée', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', couple_id: couple.id, name: 'Beef', description: 'Beef option', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('meal_options')
        .select('*')
        .eq('couple_id', couple.id)
        .order('name');
      if (error) throw error;
      setMealOptions(data || []);
    } catch (err) {
      setError('Failed to fetch meal options: ' + (err as Error).message);
    }
  };

  const fetchLayouts = async () => {
    if (!couple?.id) return;
    if (!supabase || !isSupabaseConfigured()) {
      setLayouts([{ id: 'layout1', couple_id: couple.id, table_id: 'table1', table_name: 'Table 1', type: 'round', x: 50, y: 50 }]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('table_layouts')
        .select('*')
        .eq('couple_id', couple.id);
      if (error) throw error;
      setLayouts(data || []);
    } catch (err) {
      setError('Failed to fetch table layouts: ' + (err as Error).message);
    }
  };

  const handleSaveGuest = async (formData: GuestFormData) => {
    if (!couple?.id) return;
    const address = [formData.street, formData.apt, formData.city, formData.state, formData.zip, formData.country].filter(Boolean).join(', ');
    const dataToSave = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      address: address || null,
      table_id: formData.table_id || null,
      list_priority: formData.list_priority,
      has_plus_one: formData.has_plus_one,
      plus_one_name: formData.has_plus_one ? formData.plus_one_name || null : null,
      family_members: formData.family_members.length > 0 ? formData.family_members : null,
      notes: formData.notes || null,
      meal_option_id: formData.meal_option_id || null,
      guest_type: formData.guest_type,
      partner_id: formData.partner_id || null,
      couple_id: couple.id
    };
    if (!supabase || !isSupabaseConfigured()) {
      const newGuest: Guest = {
        ...dataToSave,
        id: editingGuest ? editingGuest.id : Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        table_name: tables.find(t => t.id === formData.table_id)?.name || '',
        meal_option_name: mealOptions.find(m => m.id === formData.meal_option_id)?.name || '',
        family_members: formData.family_members.map(member => ({
          ...member,
          meal_option_name: mealOptions.find(m => m.id === member.meal_option_id)?.name || ''
        }))
      };
      if (editingGuest) {
        setGuests(prev => prev.map(g => g.id === editingGuest.id ? newGuest : g));
      } else {
        setGuests(prev => [...prev, newGuest]);
      }
      setSuccessMessage(editingGuest ? 'Guest updated' : 'Guest added');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowGuestModal(false);
      setEditingGuest(null);
      return;
    }
    try {
      if (editingGuest) {
        await supabase.from('guests').update(dataToSave).eq('id', editingGuest.id);
      } else {
        await supabase.from('guests').insert([dataToSave]);
      }
      await fetchGuests();
      setSuccessMessage(editingGuest ? 'Guest updated' : 'Guest added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save guest: ' + (err as Error).message);
    } finally {
      setShowGuestModal(false);
      setEditingGuest(null);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      setGuests(prev => prev.filter(g => g.id !== id));
      setSuccessMessage('Guest deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      await supabase.from('guests').delete().eq('id', id).eq('couple_id', couple!.id);
      await fetchGuests();
      setSuccessMessage('Guest deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete guest: ' + (err as Error).message);
    }
  };

  const handleSaveTable = async (id: string, name: string) => {
    if (!name.trim()) {
      setError('Table name is required');
      return;
    }
    if (!supabase || !isSupabaseConfigured()) {
      if (id) {
        setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
        setLayouts(prev => prev.map(l => l.table_id === id ? { ...l, table_name: name } : l));
      } else {
        const newId = Date.now().toString();
        setTables(prev => [...prev, { id: newId, name }]);
      }
      setSuccessMessage(id ? 'Table updated' : 'Table added');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      if (id) {
        await Promise.all([
          supabase.from('tables').update({ name }).eq('id', id).eq('couple_id', couple!.id),
          supabase.from('table_layouts').update({ table_name: name }).eq('table_id', id).eq('couple_id', couple!.id)
        ]);
      } else {
        const { data } = await supabase.from('tables').insert({ couple_id: couple!.id, name }).select().single();
        if (data) {
          setTables(prev => [...prev, { id: data.id, name }]);
        }
      }
      await Promise.all([fetchTables(), fetchLayouts()]);
      setSuccessMessage(id ? 'Table updated' : 'Table added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save table: ' + (err as Error).message);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      setTables(prev => prev.filter(t => t.id !== id));
      setLayouts(prev => prev.filter(l => l.table_id === id));
      setSuccessMessage('Table deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      const { data: assignedGuests } = await supabase
        .from('guests')
        .select('id')
        .eq('table_id', id)
        .eq('couple_id', couple!.id);
      if (assignedGuests && assignedGuests.length > 0) {
        setError('Cannot delete table: it is assigned to guests');
        return;
      }
      await Promise.all([
        supabase.from('tables').delete().eq('id', id).eq('couple_id', couple!.id),
        supabase.from('table_layouts').delete().eq('table_id', id).eq('couple_id', couple!.id)
      ]);
      await Promise.all([fetchTables(), fetchLayouts()]);
      setSuccessMessage('Table deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete table: ' + (err as Error).message);
    }
  };

  const handleSaveMeal = async (id: string, name: string, description: string) => {
    if (!name.trim()) {
      setError('Meal name is required');
      return;
    }
    if (!supabase || !isSupabaseConfigured()) {
      if (id) {
        setMealOptions(prev => prev.map(m => m.id === id ? { ...m, name, description } : m));
      } else {
        setMealOptions(prev => [...prev, { id: Date.now().toString(), couple_id: couple!.id, name, description, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
      }
      setSuccessMessage(id ? 'Meal updated' : 'Meal added');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      if (id) {
        await supabase.from('meal_options').update({ name, description }).eq('id', id).eq('couple_id', couple!.id);
      } else {
        await supabase.from('meal_options').insert({ couple_id: couple!.id, name, description, is_active: true });
      }
      await fetchMealOptions();
      setSuccessMessage(id ? 'Meal updated' : 'Meal added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save meal: ' + (err as Error).message);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      setMealOptions(prev => prev.map(m => m.id === id ? { ...m, is_active: false } : m));
      setSuccessMessage('Meal deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      const { data: assignedGuests } = await supabase
        .from('guests')
        .select('id')
        .eq('meal_option_id', id)
        .eq('couple_id', couple!.id);
      if (assignedGuests && assignedGuests.length > 0) {
        setError('Cannot delete meal: it is assigned to guests');
        return;
      }
      await supabase.from('meal_options').update({ is_active: false }).eq('id', id).eq('couple_id', couple!.id);
      await fetchMealOptions();
      setSuccessMessage('Meal deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete meal: ' + (err as Error).message);
    }
  };

  const generateRsvpLink = async (guestId: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      const token = crypto.randomUUID();
      const link = `${window.location.origin}/rsvp?token=${token}&guest=${guestId}`;
      setRsvpLinks(prev => ({ ...prev, [guestId]: link }));
      setSuccessMessage('RSVP link generated');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('rsvp_shares')
        .select('token')
        .eq('guest_id', guestId)
        .single();
      let token;
      if (existing) {
        token = existing.token;
      } else {
        token = crypto.randomUUID();
        await supabase.from('rsvp_shares').insert({ guest_id: guestId, token, status: 'active' });
      }
      const link = `${window.location.origin}/rsvp?token=${token}`;
      setRsvpLinks(prev => ({ ...prev, [guestId]: link }));
      setSuccessMessage('RSVP link generated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to generate RSVP link: ' + (err as Error).message);
    }
  };

  const handleSaveLayout = async (newLayouts: TableLayout[]) => {
    if (!supabase || !isSupabaseConfigured()) {
      setLayouts(newLayouts);
      setSuccessMessage('Layout saved');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      console.log('Saving layouts:', newLayouts);
      const { error } = await supabase
        .from('table_layouts')
        .upsert(newLayouts, { onConflict: 'id', ignoreDuplicates: false });
      if (error) throw error;
      await fetchLayouts();
      setSuccessMessage('Layout saved');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Layout save error:', err);
      setError('Failed to save layout: ' + (err as Error).message);
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) return;
    setImportLoading(true);
    setImportErrors([]);
    Papa.parse(csvFile, {
      header: true,
      complete: async (results: any) => {
        console.log('Parsed headers:', results.meta.fields); // Debug header mapping
        console.log('Parsed data:', results.data); // Debug all rows
        const importErrors: string[] = [];
        const newGuests: any[] = [];
        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];
          if (!row.Name || row.Name.trim() === '') {
            importErrors.push(`Row ${i + 1}: Missing name`);
            continue;
          }
          let mealOptionId = '';
          if (row.Meal) {
            const existingMeal = mealOptions.find(m => m.name.toLowerCase() === row.Meal.toLowerCase());
            if (existingMeal) {
              mealOptionId = existingMeal.id;
            } else if (supabase) {
              const { data: newMeal } = await supabase.from('meal_options').insert({
                couple_id: couple!.id,
                name: row.Meal,
                is_active: true
              }).select().single();
              if (newMeal) mealOptionId = newMeal.id;
            }
          }
          let tableId = '';
          if (row.Table) {
            const existingTable = tables.find(t => t.name === row.Table);
            if (existingTable) {
              tableId = existingTable.id;
            } else if (supabase) {
              const { data: newTable } = await supabase.from('tables').insert({
                couple_id: couple!.id,
                name: row.Table
              }).select().single();
              if (newTable) tableId = newTable.id;
            }
          }
          const guestType = row.Guest_Type ? row.Guest_Type.toLowerCase().replace(/\s+/g, '_') : 'friend';
          const validGuestTypes = guestTypes.map(t => t.value);
          const finalGuestType = validGuestTypes.includes(guestType) ? guestType : 'friend';
          const validPartners = [couple?.partner1_name, couple?.partner2_name].filter(Boolean) as string[];
          const partnerId = row.Partner ? (validPartners.includes(row.Partner) ? row.Partner : null) : null;
          const listPriority = ['1', '2', '3'].includes(row.Priority) ? row.Priority : '1';
          let familyMembers: { name: string; age_category: 'adult' | 'child'; meal_option_id: string }[] = [];
          if (row['Family Members Names']) {
            const names = row['Family Members Names'].split(';').map((n: string) => n.trim());
            const ages = row['Family Members Ages'] ? row['Family Members Ages'].split(';').map((a: string) => a.trim()) : names.map(() => 'adult');
            const meals = row['Family Members Meals'] ? row['Family Members Meals'].split(';').map((m: string) => m.trim()) : names.map(() => '');
            for (let j = 0; j < names.length; j++) {
              let mealOptionId = '';
              if (meals[j]) {
                const existingMeal = mealOptions.find(m => m.name.toLowerCase() === meals[j].toLowerCase());
                if (existingMeal) {
                  mealOptionId = existingMeal.id;
                } else if (supabase) {
                  const { data: newMeal } = await supabase.from('meal_options').insert({
                    couple_id: couple!.id,
                    name: meals[j],
                    is_active: true
                  }).select().single();
                  if (newMeal) mealOptionId = newMeal.id;
                }
              }
              familyMembers.push({
                name: names[j],
                age_category: ages[j] === 'child' ? 'child' : 'adult',
                meal_option_id: mealOptionId
              });
            }
          }
          newGuests.push({
            name: row.Name,
            email: row.Email || null,
            phone: row.Phone || null,
            address: [row.Street, row.Apt, row.City, row.State, row.Zip, row.Country].filter(Boolean).join(', ') || null,
            table_id: tableId || null,
            list_priority: listPriority,
            has_plus_one: row['Plus One'] === 'true' || false,
            plus_one_name: row['Plus One'] === 'true' ? row['Plus One Name'] || null : null,
            family_members: familyMembers.length > 0 ? familyMembers : null,
            notes: row.Notes || null,
            meal_option_id: mealOptionId || null,
            guest_type: finalGuestType,
            partner_id: partnerId,
            couple_id: couple!.id
          });
        }
        if (newGuests.length > 0 && supabase) {
          const { error } = await supabase.from('guests').insert(newGuests);
          if (error) importErrors.push('Database error: ' + error.message);
        }
        if (importErrors.length > 0) {
          setImportErrors(importErrors);
          setError(`Import completed with errors: ${importErrors.length} issues`);
        } else {
          setSuccessMessage(`${newGuests.length} guests imported successfully`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
        await fetchAllData();
        setImportLoading(false);
        setCsvFile(null);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setImportErrors(['Failed to parse CSV file']);
        setImportLoading(false);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Street', 'Apt', 'City', 'State', 'Zip', 'Country', 
      'Table', 'Priority', 'Plus One', 'Plus One Name', 'Family Members Names', 
      'Family Members Ages', 'Family Members Meals', 'Meal', 'Guest Type', 'Partner', 'Notes', 'RSVP Status'
    ];
    const csvContent = [
      headers.join(','),
      ...guests.map(guest => {
        const addressParts = (guest.address || '').split(', ').map(p => p.trim());
        const familyMembersNames = guest.family_members ? guest.family_members.map(m => m.name).join(';') : '';
        const familyMembersAges = guest.family_members ? guest.family_members.map(m => m.age_category).join(';') : '';
        const familyMembersMeals = guest.family_members ? guest.family_members.map(m => m.meal_option_name || '').join(';') : '';
        return [
          `"${guest.name.replace(/"/g, '""')}"`,
          `"${(guest.email || '').replace(/"/g, '""')}"`,
          `"${(guest.phone || '').replace(/"/g, '""')}"`,
          `"${addressParts[0] || ''}"`,
          `"${addressParts[1] || ''}"`,
          `"${addressParts[2] || ''}"`,
          `"${addressParts[3] || ''}"`,
          `"${addressParts[4] || ''}"`,
          `"${addressParts[5] || ''}"`,
          `"${guest.table_name || ''}"`,
          guest.list_priority,
          guest.has_plus_one,
          `"${(guest.plus_one_name || '').replace(/"/g, '""')}"`,
          `"${familyMembersNames.replace(/"/g, '""')}"`,
          `"${familyMembersAges}"`,
          `"${familyMembersMeals.replace(/"/g, '""')}"`,
          `"${guest.meal_option_name || ''}"`,
          `"${guest.guest_type || ''}"`,
          `"${guest.partner_id || ''}"`,
          `"${(guest.notes || '').replace(/"/g, '""')}"`,
          guest.rsvp_status || 'pending'
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('CSV exported successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleExportExampleCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Street', 'Apt', 'City', 'State', 'Zip', 'Country', 
      'Table', 'Priority', 'Plus One', 'Plus One Name', 'Family Members Names', 
      'Family Members Ages', 'Family Members Meals', 'Meal', 'Guest Type', 'Partner', 'Notes', 'RSVP Status'
    ];
    const exampleData = [
      [
        '"Smith Family"', '"john@example.com"', '"123-456-7890"', '"123 Main St"', '"Apt 4B"', '"New York"', '"NY"', '"10001"', '"USA"',
        '"Table 1"', '1', 'false', '""', '"John Smith;Jane Smith;Timmy Smith"', '"adult;adult;child"', '"Beef;Beef;"', '""', '"family"', '"Partner 1"', '"Family with kids"', '"accepted"'
      ]
    ];
    const csvContent = [headers.join(','), ...exampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `example_guests.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Example CSV downloaded');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedGuests = [...guests].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (sortBy === 'list_priority') {
      return (a.list_priority.localeCompare(b.list_priority)) * direction;
    } else if (sortBy === 'meal_option_name') {
      const aName = a.meal_option_name || '';
      const bName = b.meal_option_name || '';
      return aName.localeCompare(bName) * direction;
    } else if (sortBy === 'rsvp_status') {
      const aStatus = a.rsvp_status || 'pending';
      const bStatus = b.rsvp_status || 'pending';
      return aStatus.localeCompare(bStatus) * direction;
    } else if (sortBy === 'guest_type') {
      const aType = a.guest_type || '';
      const bType = b.guest_type || '';
      return aType.localeCompare(bType) * direction;
    } else if (sortBy === 'partner_id') {
      const aPartner = a.partner_id || '';
      const bPartner = b.partner_id || '';
      return aPartner.localeCompare(bPartner) * direction;
    }
    return 0;
  });

  const filteredGuests = sortedGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGuests = filteredGuests.reduce((count, guest) => {
    let total = 1; // Primary guest
    if (guest.has_plus_one && guest.plus_one_name) total += 1;
    if (guest.family_members) total += guest.family_members.length;
    return count + total;
  }, 0);
  const rsvpdGuests = filteredGuests.reduce((count, guest) => {
    if (guest.rsvp_status === 'accepted') {
      let total = 1; // Primary guest
      if (guest.has_plus_one && guest.plus_one_name) total += 1;
      if (guest.family_members) total += guest.family_members.length;
      return count + total;
    }
    return count;
  }, 0);
  const declinedGuests = filteredGuests.reduce((count, guest) => {
    if (guest.rsvp_status === 'declined') {
      let total = 1; // Primary guest
      if (guest.has_plus_one && guest.plus_one_name) total += 1;
      if (guest.family_members) total += guest.family_members.length;
      return count + total;
    }
    return count;
  }, 0);
  const pendingGuests = filteredGuests.reduce((count, guest) => {
    if (guest.rsvp_status === 'pending') {
      let total = 1; // Primary guest
      if (guest.has_plus_one && guest.plus_one_name) total += 1;
      if (guest.family_members) total += guest.family_members.length;
      return count + total;
    }
    return count;
  }, 0);
  const tier1Guests = filteredGuests.reduce((count, guest) => {
    if (guest.list_priority === '1') {
      let total = 1; // Primary guest
      if (guest.has_plus_one && guest.plus_one_name) total += 1;
      if (guest.family_members) total += guest.family_members.length;
      return count + total;
    }
    return count;
  }, 0);
  const tier2Guests = filteredGuests.reduce((count, guest) => {
    if (guest.list_priority === '2') {
      let total = 1; // Primary guest
      if (guest.has_plus_one && guest.plus_one_name) total += 1;
      if (guest.family_members) total += guest.family_members.length;
      return count + total;
    }
    return count;
  }, 0);
  const tier3Guests = filteredGuests.reduce((count, guest) => {
    if (guest.list_priority === '3') {
      let total = 1; // Primary guest
      if (guest.has_plus_one && guest.plus_one_name) total += 1;
      if (guest.family_members) total += guest.family_members.length;
      return count + total;
    }
    return count;
  }, 0);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {successMessage && <Card className="p-4 bg-green-50 border-green-200"><Check className="w-5 h-5 text-green-500 mr-2 inline" />{successMessage}</Card>}
      {error && <Card className="p-4 bg-red-50 border-red-200"><AlertCircle className="w-5 h-5 text-red-500 mr-2 inline" />{error}</Card>}
      {importErrors.length > 0 && <Card className="p-4 bg-yellow-50 border-yellow-200"><AlertCircle className="w-5 h-5 text-yellow-500 mr-2 inline" />{importErrors.join('; ')}</Card>}

      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Guest Management</h3>
        <p className="text-gray-600 mb-4">Manage guests, tables, meals, and bulk operations</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-blue-800">{totalGuests}</div>
            <div className="text-sm text-gray-600">Total Guests</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-indigo-800">{rsvpdGuests}</div>
            <div className="text-sm text-gray-600">RSVPs</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-red-800">{declinedGuests}</div>
            <div className="text-sm text-gray-600">Declined</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-yellow-800">{pendingGuests}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-green-800">{tier1Guests}</div>
            <div className="text-sm text-gray-600">Tier 1</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-orange-800">{tier2Guests}</div>
            <div className="text-sm text-gray-600">Tier 2</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-purple-800">{tier3Guests}</div>
            <div className="text-sm text-gray-600">Tier 3</div>
          </div>
        </div>
        <div className="flex space-x-2 border-b">
          {[
            { key: 'guests', label: 'Guests', icon: Users },
            { key: 'tables', label: 'Tables', icon: Table2 },
            { key: 'meals', label: 'Meals', icon: Utensils },
            { key: 'layout', label: 'Table Layout', icon: Table2 },
            { key: 'import-export', label: 'Import/Export', icon: Upload }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeSubTab === tab.key ? 'bg-rose-500 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {activeSubTab === 'guests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="text-lg font-semibold">Guest List ({filteredGuests.length})</h4>
            <div className="flex space-x-2 items-center">
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="w-full md:w-64"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                icon={sortDirection === 'asc' ? SortAsc : SortDesc}
                onClick={handleSort}
              >
                Sort {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingGuest(null);
                  setShowGuestModal(true);
                }}
              >
                Add Guest
              </Button>
            </div>
          </div>
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h5 className="font-semibold">
                    {guest.name}
                    {guest.has_plus_one && guest.plus_one_name ? ` & ${guest.plus_one_name}` : ''}
                  </h5>
                  {guest.family_members && guest.family_members.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 font-semibold">Family Members:</p>
                      <ul className="text-sm text-gray-600">
                        {guest.family_members.map((member, index) => (
                          <li key={index}>
                            {member.name} ({member.age_category}, Meal: {member.meal_option_name || 'None'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Email: {guest.email || 'N/A'} | Phone: {guest.phone || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Address: {guest.address || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    Table: {guest.table_name || 'Unassigned'} | Priority: {listPriorities.find((p) => p.value === guest.list_priority)?.label || guest.list_priority} | Meal: {guest.meal_option_name || 'None'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: {guestTypes.find((t) => t.value === guest.guest_type)?.label || 'N/A'} | Invited By: {guest.partner_id || 'N/A'} | Plus One: {guest.has_plus_one ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-600">RSVP: {rsvpStatuses[guest.rsvp_status || 'pending'].label}</p>
                  <p className="text-sm text-gray-600">Notes: {guest.notes || 'N/A'}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" icon={Edit2} onClick={() => { setEditingGuest(guest); setShowGuestModal(true); }} />
                  <Button variant="ghost" icon={Trash2} onClick={() => handleDeleteGuest(guest.id)} className="text-red-500" />
                  <Button variant="ghost" icon={Send} onClick={() => generateRsvpLink(guest.id)} />
                </div>
              </div>
              {rsvpLinks[guest.id] && (
                <div className="mt-4 p-2 bg-blue-50 rounded">
                  <p className="text-sm">RSVP Link: {rsvpLinks[guest.id]}</p>
                </div>
              )}
            </Card>
          ))}
          <GuestModal
            isOpen={showGuestModal}
            onClose={() => setShowGuestModal(false)}
            guest={editingGuest}
            mealOptions={mealOptions}
            tables={tables}
            couple={couple}
            onSave={handleSaveGuest}
            isEditing={!!editingGuest}
            listPriorities={listPriorities}
            guestTypes={guestTypes}
          />
        </div>
      )}

      {activeSubTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Tables ({tables.length})</h4>
            <Button variant="primary" icon={Plus} onClick={() => { setEditingTable(null); setShowTableModal(true); }}>
              Add Table
            </Button>
          </div>
          {tables.map((table) => (
            <Card key={table.id} className="p-4 flex justify-between items-center">
              <span>{table.name}</span>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  icon={Edit2}
                  size="sm"
                  onClick={() => {
                    setEditingTable(table);
                    setShowTableModal(true);
                  }}
                />
                <Button variant="ghost" icon={Trash2} onClick={() => handleDeleteTable(table.id)} size="sm" className="text-red-500" />
              </div>
            </Card>
          ))}
          <TableEditModal isOpen={showTableModal} onClose={() => setShowTableModal(false)} table={editingTable} onSave={handleSaveTable} />
        </div>
      )}

      {activeSubTab === 'meals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Meal Options ({mealOptions.filter((m) => m.is_active).length})</h4>
            <Button variant="primary" icon={Plus} onClick={() => { setEditingMeal(null); setShowMealModal(true); }}>
              Add Meal
            </Button>
          </div>
          {mealOptions.filter((m) => m.is_active).map((meal) => (
            <Card key={meal.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-semibold">{meal.name}</h5>
                  <p className="text-sm text-gray-600">{meal.description || 'No description'}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" icon={Edit2} onClick={() => { setEditingMeal(meal); setShowMealModal(true); }} size="sm" />
                  <Button variant="ghost" icon={Trash2} onClick={() => handleDeleteMeal(meal.id)} size="sm" className="text-red-500" />
                </div>
              </div>
            </Card>
          ))}
          <MealEditModal isOpen={showMealModal} onClose={() => setShowMealModal(false)} meal={editingMeal} onSave={handleSaveMeal} />
        </div>
      )}

      {activeSubTab === 'layout' && (
        <Card className="p-6 text-center">
          <h4 className="text-lg font-semibold mb-4">Table Layout</h4>
          <p className="text-gray-600">Coming Soon</p>
        </Card>
      )}

      {activeSubTab === 'import-export' && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Bulk Operations</h4>
          <div className="space-y-6">
            <div>
              <h5 className="font-medium mb-2 flex items-center"><Upload className="w-4 h-4 mr-2" />Import CSV</h5>
              <Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              <p className="text-sm text-gray-600 mt-1">
                Expected columns: name (required), email, phone, street, apt, city, state, zip, country, table_name, list_priority (1/2/3), has_plus_one (true/false), plus_one_name, family_members_names, family_members_ages, family_members_meals, meal_name, guest_type, partner_id, notes
              </p>
              <Button onClick={handleImportCSV} loading={importLoading} disabled={!csvFile} className="mt-2">
                Import
              </Button>
            </div>
            <div>
              <h5 className="font-medium mb-2 flex items-center"><Download className="w-4 h-4 mr-2" />Export CSV</h5>
              <Button onClick={handleExportCSV} variant="outline">
                Download Guests CSV
              </Button>
            </div>
            <div>
              <h5 className="font-medium mb-2 flex items-center"><Download className="w-4 h-4 mr-2" />Download Example CSV</h5>
              <Button onClick={handleExportExampleCSV} variant="outline">
                Download Example CSV
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};