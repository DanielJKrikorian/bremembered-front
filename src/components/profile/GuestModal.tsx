import React, { useState, useEffect } from 'react';
import { User, X, Check, ArrowLeft, ArrowRight, Users, Mail, Phone, StickyNote, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

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

interface ListPriority {
  value: '1' | '2' | '3';
  label: string;
}

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

export const GuestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest;
  mealOptions: MealOption[];
  tables: TableData[];
  couple: any;
  onSave: (guestData: GuestFormData) => void;
  isEditing: boolean;
  listPriorities: ListPriority[];
}> = ({ isOpen, onClose, guest, mealOptions, tables, couple, onSave, isEditing, listPriorities }) => {
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
    list_priority: '1',
    has_plus_one: false,
    plus_one_name: '',
    family_members: [],
    notes: '',
    meal_option_id: '',
    guest_type: 'friend',
    partner_id: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', age_category: 'adult' as 'adult' | 'child', meal_option_id: '' });

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
        family_members: guest.family_members || [],
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
        list_priority: '1',
        has_plus_one: false,
        plus_one_name: '',
        family_members: [],
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

  const handleFamilyMemberChange = (field: string, value: string) => {
    setNewFamilyMember(prev => ({ ...prev, [field]: value }));
  };

  const addFamilyMember = () => {
    if (!newFamilyMember.name.trim()) {
      setFormErrors(prev => ({ ...prev, family_member_name: 'Family member name is required' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      family_members: [...prev.family_members, { ...newFamilyMember, meal_option_id: newFamilyMember.meal_option_id || '' }]
    }));
    setNewFamilyMember({ name: '', age_category: 'adult', meal_option_id: '' });
    setFormErrors(prev => ({ ...prev, family_member_name: '' }));
  };

  const removeFamilyMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      family_members: prev.family_members.filter((_, i) => i !== index)
    }));
  };

  const validateCurrentStep = () => {
    const errors: { [key: string]: string } = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = "Guest name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceedToNextStep = () => formData.name.trim();

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
              {formData.guest_type === 'family' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Family Members</h4>
                  {formData.family_members.map((member, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...formData.family_members];
                          newMembers[index].name = e.target.value;
                          setFormData(prev => ({ ...prev, family_members: newMembers }));
                        }}
                        placeholder="Member name"
                        className="flex-1"
                      />
                      <select
                        value={member.age_category}
                        onChange={(e) => {
                          const newMembers = [...formData.family_members];
                          newMembers[index].age_category = e.target.value as 'adult' | 'child';
                          setFormData(prev => ({ ...prev, family_members: newMembers }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="adult">Adult</option>
                        <option value="child">Child</option>
                      </select>
                      <select
                        value={member.meal_option_id}
                        onChange={(e) => {
                          const newMembers = [...formData.family_members];
                          newMembers[index].meal_option_id = e.target.value;
                          setFormData(prev => ({ ...prev, family_members: newMembers }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select meal</option>
                        {mealOptions.filter(m => m.is_active).map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <Button variant="ghost" icon={X} onClick={() => removeFamilyMember(index)} className="text-red-500" />
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newFamilyMember.name}
                      onChange={(e) => handleFamilyMemberChange('name', e.target.value)}
                      placeholder="Add family member name"
                      error={formErrors.family_member_name}
                      className="flex-1"
                    />
                    <select
                      value={newFamilyMember.age_category}
                      onChange={(e) => handleFamilyMemberChange('age_category', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                    </select>
                    <select
                      value={newFamilyMember.meal_option_id}
                      onChange={(e) => handleFamilyMemberChange('meal_option_id', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select meal</option>
                      {mealOptions.filter(m => m.is_active).map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                    <Button variant="primary" onClick={addFamilyMember}>Add</Button>
                  </div>
                </div>
              )}
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
                  placeholder="Enter plus-one name (optional)"
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