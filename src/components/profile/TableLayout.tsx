import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Circle, Square, Heart, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Stage, Layer, Circle as KonvaCircle, Rect, Text } from 'react-konva';

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

interface TableLayout {
  id: string;
  couple_id: string;
  table_id: string;
  table_name: string;
  type: 'round' | 'rectangle' | 'sweetheart';
  x: number;
  y: number;
}

export const TableLayout: React.FC<{
  tables: TableData[];
  layouts: TableLayout[];
  guests: Guest[];
  coupleId: string;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  onSaveLayout: (layouts: TableLayout[]) => void;
}> = ({ tables, layouts, guests, coupleId, selectedTableId, setSelectedTableId, onSaveLayout }) => {
  const [localLayouts, setLocalLayouts] = useState<TableLayout[]>(layouts);
  const [selectedTableIdInput, setSelectedTableIdInput] = useState('');
  const [selectedTableType, setSelectedTableType] = useState<'round' | 'rectangle' | 'sweetheart'>('round');
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null); // Prevent multiple delete clicks

  // Sync localLayouts with layouts prop
  useEffect(() => {
    setLocalLayouts(layouts);
  }, [layouts]);

  const handleDragEnd = (index: number, x: number, y: number) => {
    setLocalLayouts(prev => {
      const newLayouts = prev.map((layout, i) =>
        i === index ? { ...layout, x: Math.round(x), y: Math.round(y) } : layout
      );
      console.log('Dragging table, new layouts:', newLayouts); // Debug
      onSaveLayout(newLayouts); // Auto-save on drag, keep existing IDs
      return newLayouts;
    });
  };

  const handleAddTable = () => {
    if (!selectedTableIdInput) return;
    const table = tables.find(t => t.id === selectedTableIdInput);
    if (!table || localLayouts.some(layout => layout.table_id === selectedTableIdInput)) return; // Prevent duplicates
    const newLayout = {
      id: uuidv4(), // Generate fresh UUID for new layout
      couple_id: coupleId,
      table_id: table.id,
      table_name: table.name,
      type: selectedTableType,
      x: 50,
      y: 50
    };
    console.log('Adding table with layout:', newLayout); // Debug
    setLocalLayouts(prev => {
      const newLayouts = [...prev, newLayout];
      onSaveLayout(newLayouts); // Auto-save on add
      return newLayouts;
    });
    setSelectedTableIdInput('');
    setSelectedTableType('round');
  };

  const handleDeleteTable = (tableId: string) => {
    if (deletingTableId) return; // Prevent multiple deletes
    setDeletingTableId(tableId);
    setLocalLayouts(prev => {
      const newLayouts = prev.filter(layout => layout.table_id !== tableId);
      console.log('Deleting table, new layouts:', newLayouts); // Debug
      onSaveLayout(newLayouts); // Auto-save on delete
      return newLayouts;
    });
    if (selectedTableId === tableId) setSelectedTableId(null); // Clear selection if deleted
    setTimeout(() => setDeletingTableId(null), 500); // Reset after save
  };

  const getGuestCount = (tableId: string) => {
    return guests.reduce((count, guest) => {
      if (guest.table_id === tableId) {
        let total = 1; // Primary guest
        if (guest.has_plus_one && guest.plus_one_name) total += 1;
        if (guest.family_members) total += guest.family_members.length;
        return count + total;
      }
      return count;
    }, 0);
  };

  return (
    <Card className="p-6">
      <h4 className="text-lg font-semibold mb-4">Table Layout</h4>
      <div className="flex space-x-4 mb-4">
        <select
          value={selectedTableIdInput}
          onChange={(e) => setSelectedTableIdInput(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Table</option>
          {tables
            .filter(t => !localLayouts.some(layout => layout.table_id === t.id))
            .map(table => (
              <option key={table.id} value={table.id}>{table.name}</option>
            ))}
        </select>
        <select
          value={selectedTableType}
          onChange={(e) => setSelectedTableType(e.target.value as 'round' | 'rectangle' | 'sweetheart')}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="round">Round</option>
          <option value="rectangle">Rectangle</option>
          <option value="sweetheart">Sweetheart</option>
        </select>
        <Button onClick={handleAddTable} disabled={!selectedTableIdInput}>Add Table</Button>
        <Button onClick={() => onSaveLayout(localLayouts)} variant="primary">Save Layout</Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Stage width={800} height={600}>
          <Layer>
            {localLayouts.map((layout, index) => (
              <React.Fragment key={layout.id}>
                {layout.type === 'round' && (
                  <>
                    <KonvaCircle
                      x={layout.x}
                      y={layout.y}
                      radius={30}
                      fill={selectedTableId === layout.table_id ? 'rose' : 'gray'}
                      stroke="black"
                      strokeWidth={2}
                      draggable
                      onDragEnd={(e) => handleDragEnd(index, e.target.x(), e.target.y())}
                      onClick={() => setSelectedTableId(layout.table_id)}
                    />
                    <KonvaCircle
                      x={layout.x + 25}
                      y={layout.y - 25}
                      radius={8}
                      fill="red"
                      stroke="black"
                      strokeWidth={1}
                      onClick={() => {
                        console.log('Delete clicked for table:', layout.table_id); // Debug
                        handleDeleteTable(layout.table_id);
                      }}
                      onTap={() => {
                        console.log('Delete tapped for table:', layout.table_id); // Debug
                        handleDeleteTable(layout.table_id);
                      }}
                    />
                    <Text
                      x={layout.x + 21}
                      y={layout.y - 29}
                      text="X"
                      fontSize={10}
                      fill="white"
                      onClick={() => handleDeleteTable(layout.table_id)}
                      onTap={() => handleDeleteTable(layout.table_id)}
                    />
                  </>
                )}
                {layout.type === 'rectangle' && (
                  <>
                    <Rect
                      x={layout.x}
                      y={layout.y}
                      width={60}
                      height={30}
                      fill={selectedTableId === layout.table_id ? 'rose' : 'gray'}
                      stroke="black"
                      strokeWidth={2}
                      draggable
                      onDragEnd={(e) => handleDragEnd(index, e.target.x(), e.target.y())}
                      onClick={() => setSelectedTableId(layout.table_id)}
                    />
                    <KonvaCircle
                      x={layout.x + 55}
                      y={layout.y - 5}
                      radius={8}
                      fill="red"
                      stroke="black"
                      strokeWidth={1}
                      onClick={() => {
                        console.log('Delete clicked for table:', layout.table_id); // Debug
                        handleDeleteTable(layout.table_id);
                      }}
                      onTap={() => {
                        console.log('Delete tapped for table:', layout.table_id); // Debug
                        handleDeleteTable(layout.table_id);
                      }}
                    />
                    <Text
                      x={layout.x + 51}
                      y={layout.y - 9}
                      text="X"
                      fontSize={10}
                      fill="white"
                      onClick={() => handleDeleteTable(layout.table_id)}
                      onTap={() => handleDeleteTable(layout.table_id)}
                    />
                  </>
                )}
                {layout.type === 'sweetheart' && (
                  <>
                    <Rect
                      x={layout.x}
                      y={layout.y}
                      width={40}
                      height={20}
                      fill={selectedTableId === layout.table_id ? 'rose' : 'gray'}
                      stroke="black"
                      strokeWidth={2}
                      draggable
                      onDragEnd={(e) => handleDragEnd(index, e.target.x(), e.target.y())}
                      onClick={() => setSelectedTableId(layout.table_id)}
                    />
                    <KonvaCircle
                      x={layout.x + 35}
                      y={layout.y - 5}
                      radius={8}
                      fill="red"
                      stroke="black"
                      strokeWidth={1}
                      onClick={() => {
                        console.log('Delete clicked for table:', layout.table_id); // Debug
                        handleDeleteTable(layout.table_id);
                      }}
                      onTap={() => {
                        console.log('Delete tapped for table:', layout.table_id); // Debug
                        handleDeleteTable(layout.table_id);
                      }}
                    />
                    <Text
                      x={layout.x + 31}
                      y={layout.y - 9}
                      text="X"
                      fontSize={10}
                      fill="white"
                      onClick={() => handleDeleteTable(layout.table_id)}
                      onTap={() => handleDeleteTable(layout.table_id)}
                    />
                  </>
                )}
                <Text
                  x={layout.x - 30}
                  y={layout.y + 40}
                  text={`${layout.table_name} (${getGuestCount(layout.table_id)})`}
                  fontSize={12}
                  fill="black"
                />
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>
      {selectedTableId && (
        <div className="mt-4">
          <h5 className="font-semibold">Selected Table: {tables.find(t => t.id === selectedTableId)?.name}</h5>
          <p>Guest Count: {getGuestCount(selectedTableId)}</p>
        </div>
      )}
    </Card>
  );
};