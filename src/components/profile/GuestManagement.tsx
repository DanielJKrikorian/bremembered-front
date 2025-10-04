import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  User, MapPin, List, StickyNote, Check, Trash2, Edit2, Send, X, Plus, Save, ArrowLeft, ArrowRight, 
  ChevronDown, ChevronUp, Mail, Phone, Utensils, Users, Table2, Upload, Download, AlertCircle, SortAsc, SortDesc 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface Guest {
  id: string;
  couple_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  table_id?: string;
  table_name?: string;
  list_priority: 'A' | 'B' | 'C';
  has_plus_one: boolean;
  plus_one_name?: string;
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
  list_priority: 'A' | 'B' | 'C';
  has_plus_one: boolean;
  plus_one_name: string;
  notes: string;
  meal_option_id: string;
  guest_type: string;
  partner_id: string;
}

interface RsvpShare {
  id: string;
  guest_id: string;
  token: string;
  status: string;
  created_at: string;
}

const listPriorities = [
  { value: 'A', label: 'A List (Must Invite)' },
  { value: 'B', label: 'B List (Should Invite)' },
  { value: 'C', label: 'C List (Optional)' },
];

const guestTypes = [
  { value: 'best_man', label: 'Best Man' },
  { value: 'maid_of_honor', label: 'Maid of Honor' },
  { value: 'matron_of_honor', label: 'Matron of Honor' },
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
  { value: 'rsvp_status', label: 'RSVP Status' }
];

// GuestModal Component
const GuestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest;
  mealOptions: MealOption[];
  tables: TableData[];
  couple: any;
  onSave: (guestData: GuestFormData) => void;
  isEditing: boolean;
}> = ({ isOpen, onClose, guest, mealOptions, tables, couple, onSave, isEditing }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    email: '',
    phone: '',
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    table_id: '',
    list_priority: 'A',
    has_plus_one: false,
    plus_one_name: '',
    notes: '',
    meal_option_id: '',
    guest_type: 'friend',
    partner_id: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (guest) {
      let street = '', apt = '', city = '', state = '', zip = '', country = '';
      if (guest.address) {
        const parts = guest.address.split(', ').map(p => p.trim());
        street = parts[0] || '';
        apt = parts[1] || '';
        city = parts[2] || '';
        state = parts[3] || '';
        zip = parts[4] || '';
        country = parts[5] || '';
      }
      setFormData({
        name: guest.name,
        email: guest.email || '',
        phone: guest.phone || '',
        street,
        apt,
        city,
        state,
        zip,
        country,
        table_id: guest.table_id || '',
        list_priority: guest.list_priority,
        has_plus_one: guest.has_plus_one,
        plus_one_name: guest.plus_one_name || '',
        notes: guest.notes || '',
        meal_option_id: guest.meal_option_id || '',
        guest_type: guest.guest_type || 'friend',
        partner_id: guest.partner_id || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        street: '',
        apt: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        table_id: '',
        list_priority: 'A',
        has_plus_one: false,
        plus_one_name: '',
        notes: '',
        meal_option_id: '',
        guest_type: 'friend',
        partner_id: ''
      });
    }
    setCurrentStep(1);
    setFormErrors({});
  }, [guest, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCurrentStep = () => {
    const errors: { [key: string]: string } = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = "Guest name is required";
      if (formData.has_plus_one && !formData.plus_one_name.trim()) errors.plus_one_name = "Plus-one name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceedToNextStep = () => formData.name.trim() && (!formData.has_plus_one || formData.plus_one_name.trim());

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      onSave(formData);
      onClose();
      setCurrentStep(1);
    }
  };

  const getStepTitle = () => ['Guest Details', 'Seating & Priority', 'Additional Notes'][currentStep - 1];

  const partnerOptions = [
    { value: '', label: 'Select Partner' },
    ...(couple?.partner1_name ? [{ value: couple.partner1_name, label: couple.partner1_name }] : []),
    ...(couple?.partner2_name ? [{ value: couple.partner2_name, label: couple.partner2_name }] : [])
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{isEditing ? 'Edit Guest' : 'Add New Guest'}</h3>
            <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 3: {getStepTitle()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && <div className={`w-16 h-1 mx-2 rounded-full ${currentStep > step ? 'bg-rose-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 md:p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Guest Details</h2>
              </div>
              <Input label="Guest Name" name="name" value={formData.name} onChange={handleInputChange} required icon={User} error={formErrors.name} />
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={Mail} error={formErrors.email} />
              <Input label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} icon={Phone} error={formErrors.phone} />
              <Input label="Street Address" name="street" value={formData.street} onChange={handleInputChange} placeholder="123 Main St" />
              <Input label="Apt/Suite #" name="apt" value={formData.apt} onChange={handleInputChange} placeholder="Apt 4B" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" name="city" value={formData.city} onChange={handleInputChange} placeholder="New York" />
                <Input label="State/Province" name="state" value={formData.state} onChange={handleInputChange} placeholder="NY" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="ZIP/Postal Code" name="zip" value={formData.zip} onChange={handleInputChange} placeholder="10001" />
                <Input label="Country" name="country" value={formData.country} onChange={handleInputChange} placeholder="USA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Type</label>
                <select name="guest_type" value={formData.guest_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                  {guestTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invited By</label>
                <select name="partner_id" value={formData.partner_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                  {partnerOptions.map(partner => <option key={partner.value} value={partner.value}>{partner.label}</option>)}
                </select>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Seating & Priority</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Assignment</label>
                <select name="table_id" value={formData.table_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select table</option>
                  {tables.map(table => <option key={table.id} value={table.id}>{table.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Priority</label>
                <select name="list_priority" value={formData.list_priority} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {listPriorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Option</label>
                <select name="meal_option_id" value={formData.meal_option_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select meal</option>
                  {mealOptions.filter(m => m.is_active).map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="has_plus_one" checked={formData.has_plus_one} onChange={handleInputChange} className="h-4 w-4 text-rose-500" />
                <span>Has Plus One</span>
              </label>
              {formData.has_plus_one && (
                <Input
                  label="Plus-One Name"
                  name="plus_one_name"
                  value={formData.plus_one_name}
                  onChange={handleInputChange}
                  required
                  error={formErrors.plus_one_name}
                  placeholder="Enter plus-one name"
                />
              )}
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StickyNote className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Notes</h2>
              </div>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Notes" />
            </div>
          )}
        </div>
        <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-200">
          {currentStep > 1 && <Button type="button" variant="outline" onClick={handleBack} icon={ArrowLeft}>Back</Button>}
          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {currentStep < 3 ? (
              <Button type="button" variant="primary" onClick={handleNext} disabled={!canProceedToNextStep()} icon={ArrowRight}>
                Next
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit} icon={Save}>
                {isEditing ? 'Update' : 'Add'} Guest
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// TableEditModal
const TableEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  table: TableData | null;
  onSave: (id: string, name: string) => void;
}> = ({ isOpen, onClose, table, onSave }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(table?.name || '');
    setError(null);
  }, [table]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Table name is required');
      return;
    }
    onSave(table?.id || '', name);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">{table ? 'Edit Table' : 'Add Table'}</h3>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Table name" error={error} />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </Card>
    </div>
  );
};

// MealEditModal
const MealEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  meal: MealOption | null;
  onSave: (id: string, name: string, description: string) => void;
}> = ({ isOpen, onClose, meal, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(meal?.name || '');
    setDescription(meal?.description || '');
    setError(null);
  }, [meal]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Meal name is required');
      return;
    }
    onSave(meal?.id || '', name, description);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">{meal ? 'Edit Meal' : 'Add Meal'}</h3>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Meal name" className="mb-4" error={error} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4" />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </Card>
    </div>
  );
};

// Main GuestManagement Component
export const GuestManagement: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [activeSubTab, setActiveSubTab] = useState<'guests' | 'tables' | 'meals' | 'import-export'>('guests');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
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
  const [sortBy, setSortBy] = useState<'list_priority' | 'meal_option_name' | 'rsvp_status'>('list_priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
      fetchMealOptions()
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
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St, Apt 4B, New York, NY, 10001, USA',
          table_id: 'table1',
          table_name: 'Table 1',
          list_priority: 'A',
          has_plus_one: true,
          plus_one_name: 'Jane Doe',
          notes: 'Best friend',
          meal_option_id: mealOptions[0]?.id || '',
          meal_option_name: mealOptions[0]?.name || 'Beef',
          guest_type: 'friend',
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
        plus_one_name: g.plus_one_name || ''
      })));
    } catch (err) {
      setError('Failed to fetch guests');
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
      setError('Failed to fetch tables');
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
      setError('Failed to fetch meal options');
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
        meal_option_name: mealOptions.find(m => m.id === formData.meal_option_id)?.name || ''
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
      setError('Failed to save guest');
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
      setError('Failed to delete guest');
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
      } else {
        setTables(prev => [...prev, { id: Date.now().toString(), name }]);
      }
      setSuccessMessage(id ? 'Table updated' : 'Table added');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      if (id) {
        await supabase.from('tables').update({ name }).eq('id', id).eq('couple_id', couple!.id);
      } else {
        await supabase.from('tables').insert({ couple_id: couple!.id, name });
      }
      await fetchTables();
      setSuccessMessage(id ? 'Table updated' : 'Table added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save table');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      setTables(prev => prev.filter(t => t.id !== id));
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
      await supabase.from('tables').delete().eq('id', id).eq('couple_id', couple!.id);
      await fetchTables();
      setSuccessMessage('Table deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete table');
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
      setError('Failed to save meal');
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
      setError('Failed to delete meal');
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
      setError('Failed to generate RSVP link');
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) return;
    setImportLoading(true);
    setImportErrors([]);
    Papa.parse(csvFile, {
      header: true,
      complete: async (results: any) => {
        const importErrors: string[] = [];
        const newGuests: any[] = [];
        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];
          if (!row.name) {
            importErrors.push(`Row ${i + 1}: Missing name`);
            continue;
          }
          // Find or create meal option
          let mealOptionId = '';
          if (row.meal_name) {
            const existingMeal = mealOptions.find(m => m.name.toLowerCase() === row.meal_name.toLowerCase());
            if (existingMeal) {
              mealOptionId = existingMeal.id;
            } else if (supabase) {
              const { data: newMeal } = await supabase.from('meal_options').insert({
                couple_id: couple!.id,
                name: row.meal_name,
                is_active: true
              }).select().single();
              if (newMeal) mealOptionId = newMeal.id;
            }
          }
          // Find or create table
          let tableId = '';
          if (row.table_name) {
            const existingTable = tables.find(t => t.name === row.table_name);
            if (existingTable) {
              tableId = existingTable.id;
            } else if (supabase) {
              const { data: newTable } = await supabase.from('tables').insert({
                couple_id: couple!.id,
                name: row.table_name
              }).select().single();
              if (newTable) tableId = newTable.id;
            }
          }
          // Handle guest type
          const guestType = row.guest_type ? row.guest_type.toLowerCase().replace(/\s+/g, '_') : 'friend';
          const validGuestTypes = guestTypes.map(t => t.value);
          const finalGuestType = validGuestTypes.includes(guestType) ? guestType : 'friend';
          // Handle partner_id
          const validPartners = [couple?.partner1_name, couple?.partner2_name].filter(Boolean) as string[];
          const partnerId = row.partner_id && validPartners.includes(row.partner_id) ? row.partner_id : null;
          newGuests.push({
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            address: [row.street, row.apt, row.city, row.state, row.zip, row.country].filter(Boolean).join(', ') || null,
            table_id: tableId || null,
            list_priority: ['A', 'B', 'C'].includes(row.list_priority) ? row.list_priority : 'A',
            has_plus_one: row.has_plus_one === 'true' || false,
            plus_one_name: row.has_plus_one === 'true' ? row.plus_one_name || null : null,
            notes: row.notes || null,
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
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Street', 'Apt', 'City', 'State', 'Zip', 'Country', 'Table', 'Priority', 'Plus One', 'Plus One Name', 'Meal', 'Guest Type', 'Partner', 'Notes', 'RSVP Status'];
    const csvContent = [
      headers.join(','),
      ...guests.map(guest => {
        const addressParts = (guest.address || '').split(', ').map(p => p.trim());
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
    }
    return 0;
  });

  // Calculate guest statistics
  const totalGuests = sortedGuests.length;
  const aListGuests = sortedGuests.filter(g => g.list_priority === 'A').length;
  const bListGuests = sortedGuests.filter(g => g.list_priority === 'B').length;
  const cListGuests = sortedGuests.filter(g => g.list_priority === 'C').length;
  const pendingGuests = sortedGuests.filter(g => g.rsvp_status === 'pending').length;
  const rsvpdGuests = sortedGuests.filter(g => g.rsvp_status === 'accepted' || g.rsvp_status === 'declined').length;

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {successMessage && <Card className="p-4 bg-green-50 border-green-200"><Check className="w-5 h-5 text-green-500 mr-2 inline" />{successMessage}</Card>}
      {error && <Card className="p-4 bg-red-50 border-red-200"><X className="w-5 h-5 text-red-500 mr-2 inline" />{error}</Card>}
      {importErrors.length > 0 && <Card className="p-4 bg-yellow-50 border-yellow-200"><AlertCircle className="w-5 h-5 text-yellow-500 mr-2 inline" />{importErrors.join('; ')}</Card>}

      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Guest Management</h3>
        <p className="text-gray-600 mb-4">Manage guests, tables, meals, and bulk operations</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-blue-800">{totalGuests}</div>
            <div className="text-sm text-gray-600">Total Guests</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-green-800">{aListGuests}</div>
            <div className="text-sm text-gray-600">A List</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-yellow-800">{bListGuests}</div>
            <div className="text-sm text-gray-600">B List</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-red-800">{cListGuests}</div>
            <div className="text-sm text-gray-600">C List</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-purple-800">{pendingGuests}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-center">
            <div className="text-lg font-semibold text-indigo-800">{rsvpdGuests}</div>
            <div className="text-sm text-gray-600">RSVP'd</div>
          </div>
        </div>
        <div className="flex space-x-2 border-b">
          {[
            { key: 'guests', label: 'Guests', icon: Users },
            { key: 'tables', label: 'Tables', icon: Table2 },
            { key: 'meals', label: 'Meals', icon: Utensils },
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
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Guest List ({guests.length})</h4>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
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
                onClick={() => { setEditingGuest(null); setShowGuestModal(true); }}
              >
                Add Guest
              </Button>
            </div>
          </div>
          {sortedGuests.map(guest => (
            <Card key={guest.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h5 className="font-semibold">{guest.name}{guest.has_plus_one && guest.plus_one_name ? ` & ${guest.plus_one_name}` : ''}</h5>
                  <p className="text-sm text-gray-600">Email: {guest.email || 'N/A'} | Phone: {guest.phone || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Address: {guest.address || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Table: {guest.table_name || 'Unassigned'} | Priority: {guest.list_priority} | Meal: {guest.meal_option_name || 'None'}</p>
                  <p className="text-sm text-gray-600">Type: {guestTypes.find(t => t.value === guest.guest_type)?.label || 'N/A'} | Invited By: {guest.partner_id || 'N/A'} | Plus One: {guest.has_plus_one ? 'Yes' : 'No'}</p>
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
          {tables.map(table => (
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
            <h4 className="text-lg font-semibold">Meal Options ({mealOptions.filter(m => m.is_active).length})</h4>
            <Button variant="primary" icon={Plus} onClick={() => { setEditingMeal(null); setShowMealModal(true); }}>
              Add Meal
            </Button>
          </div>
          {mealOptions.filter(m => m.is_active).map(meal => (
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

      {activeSubTab === 'import-export' && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Bulk Operations</h4>
          <div className="space-y-6">
            <div>
              <h5 className="font-medium mb-2 flex items-center"><Upload className="w-4 h-4 mr-2" />Import CSV</h5>
              <Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
              <p className="text-sm text-gray-600 mt-1">Expected columns: name (required), email, phone, street, apt, city, state, zip, country, table_name, list_priority (A/B/C), has_plus_one (true/false), plus_one_name, meal_name, guest_type, partner_id, notes</p>
              <Button onClick={handleImportCSV} loading={importLoading} disabled={!csvFile} className="mt-2">Import</Button>
            </div>
            <div>
              <h5 className="font-medium mb-2 flex items-center"><Download className="w-4 h-4 mr-2" />Export CSV</h5>
              <Button onClick={handleExportCSV} variant="outline">Download Guests CSV</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};