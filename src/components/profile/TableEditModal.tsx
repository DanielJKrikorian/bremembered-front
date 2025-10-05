import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TableData {
  id: string;
  name: string;
}

export const TableEditModal: React.FC<{
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