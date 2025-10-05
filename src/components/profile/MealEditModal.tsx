import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface MealOption {
  id: string;
  couple_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const MealEditModal: React.FC<{
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