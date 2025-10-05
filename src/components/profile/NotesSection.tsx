import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useCouple } from '../../hooks/useCouple';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Check, Trash2, Edit2, Share2, Plus, AlertCircle, StickyNote } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Note {
  id: string;
  couple_id: string;
  title: string;
  content: string;
  bgColor?: string;
  textColor?: string;
  color?: string; // For backward compatibility
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

interface NoteShare {
  id: string;
  note_id: string;
  token: string;
  status: string;
  created_at: string;
}

export const NotesSection: React.FC = () => {
  const { couple } = useCouple();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', bgColor: 'bg-rose-100', textColor: 'text-rose-900' });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const noteColors = [
    { bgValue: 'bg-rose-100', textValue: 'text-rose-900', label: 'Rose' },
    { bgValue: 'bg-amber-100', textValue: 'text-amber-900', label: 'Amber' },
    { bgValue: 'bg-teal-100', textValue: 'text-teal-900', label: 'Teal' },
    { bgValue: 'bg-pink-100', textValue: 'text-pink-900', label: 'Pink' },
  ];

  useEffect(() => {
    if (couple?.id) {
      fetchNotes();
    }
  }, [couple?.id]);

  const fetchNotes = async () => {
    if (!couple?.id) return;
    setLoading(true);
    if (!supabase || !isSupabaseConfigured()) {
      setNotes([
        {
          id: 'mock-note-1',
          couple_id: couple.id,
          title: 'Wedding Day Ideas',
          content: 'Consider a sparkler send-off and a live band for the reception.',
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-900',
          position_x: 0,
          position_y: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('wedding_notes')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotes(
        data?.map(note => {
          // Handle backward compatibility for old notes with 'color' field
          if (note.color && !note.bgColor && !note.textColor) {
            const colorMap: { [key: string]: { bgColor: string; textColor: string } } = {
              'bg-rose-100 text-rose-900': { bgColor: 'bg-rose-100', textColor: 'text-rose-900' },
              'bg-amber-100 text-amber-900': { bgColor: 'bg-amber-100', textColor: 'text-amber-900' },
              'bg-teal-100 text-teal-900': { bgColor: 'bg-teal-100', textColor: 'text-teal-900' },
              'bg-pink-100 text-pink-900': { bgColor: 'bg-pink-100', textColor: 'text-pink-900' },
            };
            const { bgColor, textColor } = colorMap[note.color] || { bgColor: 'bg-rose-100', textColor: 'text-rose-900' };
            console.log('Mapping old color:', note.color, 'to bgColor:', bgColor, 'textColor:', textColor);
            return { ...note, bgColor, textColor };
          }
          const validatedNote = {
            ...note,
            bgColor: noteColors.some(c => c.bgValue === note.bgColor) ? note.bgColor : 'bg-rose-100',
            textColor: noteColors.some(c => c.textValue === note.textColor) ? note.textColor : 'text-rose-900',
          };
          console.log('Fetched note with bgColor:', validatedNote.bgColor, 'textColor:', validatedNote.textColor);
          return validatedNote;
        }) || []
      );
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!couple?.id || !newNote.title.trim()) {
      setError('Note title is required');
      return;
    }
    if (!supabase || !isSupabaseConfigured()) {
      const newNoteData: Note = {
        id: Date.now().toString(),
        couple_id: couple.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        bgColor: newNote.bgColor,
        textColor: newNote.textColor,
        position_x: 0,
        position_y: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('Adding note with bgColor:', newNoteData.bgColor, 'textColor:', newNoteData.textColor);
      setNotes(prev => [newNoteData, ...prev]);
      setNewNote({ title: '', content: '', bgColor: 'bg-rose-100', textColor: 'text-rose-900' });
      setIsAddingNote(false);
      setSuccessMessage('Note added');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      const { error } = await supabase.from('wedding_notes').insert({
        couple_id: couple.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        bgColor: newNote.bgColor,
        textColor: newNote.textColor,
        position_x: 0,
        position_y: 0,
      });
      if (error) throw error;
      setNewNote({ title: '', content: '', bgColor: 'bg-rose-100', textColor: 'text-rose-900' });
      setIsAddingNote(false);
      setSuccessMessage('Note added');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchNotes();
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !editingNote.title.trim()) {
      setError('Note title is required');
      return;
    }
    if (!supabase || !isSupabaseConfigured()) {
      console.log('Editing note with bgColor:', editingNote.bgColor, 'textColor:', editingNote.textColor);
      setNotes(prev =>
        prev.map(note =>
          note.id === editingNote.id ? { ...editingNote, updated_at: new Date().toISOString() } : note
        )
      );
      setEditingNote(null);
      setSuccessMessage('Note updated');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      const { error } = await supabase
        .from('wedding_notes')
        .update({
          title: editingNote.title.trim(),
          content: editingNote.content.trim(),
          bgColor: editingNote.bgColor,
          textColor: editingNote.textColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id)
        .eq('couple_id', couple.id);
      if (error) throw error;
      setEditingNote(null);
      setSuccessMessage('Note updated');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchNotes();
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!couple?.id) return;
    if (!supabase || !isSupabaseConfigured()) {
      setNotes(prev => prev.filter(note => note.id !== id));
      setSuccessMessage('Note deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      await supabase.from('wedding_notes').delete().eq('id', id).eq('couple_id', couple.id);
      setSuccessMessage('Note deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    }
  };

  const handleShareNote = async (noteId: string) => {
    if (!couple?.id) return;
    if (!supabase || !isSupabaseConfigured()) {
      const token = uuidv4();
      const link = `${window.location.origin}/notes?token=${token}`;
      setShareLinks(prev => ({ ...prev, [noteId]: link }));
      setSuccessMessage('Share link generated');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('note_shares')
        .select('token')
        .eq('note_id', noteId)
        .single();
      let token;
      if (existing) {
        token = existing.token;
      } else {
        token = uuidv4();
        await supabase.from('note_shares').insert({ note_id: noteId, token, status: 'active' });
      }
      const link = `${window.location.origin}/notes?token=${token}`;
      setShareLinks(prev => ({ ...prev, [noteId]: link }));
      setSuccessMessage('Share link generated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error generating share link:', err);
      setError('Failed to generate share link');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Wedding Notes</h3>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddingNote(true)}
          >
            Add Note
          </Button>
        </div>
        <p className="text-gray-600 mb-6">Jot down your thoughts, ideas, or journal entries for your big day!</p>

        {isAddingNote && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <Input
              label="Note Title"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your thoughts..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Color</label>
              <select
                value={newNote.bgColor}
                onChange={(e) => {
                  const selectedColor = noteColors.find(c => c.bgValue === e.target.value);
                  setNewNote(prev => ({
                    ...prev,
                    bgColor: selectedColor?.bgValue || 'bg-rose-100',
                    textColor: selectedColor?.textValue || 'text-rose-900',
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {noteColors.map(color => (
                  <option key={color.bgValue} value={color.bgValue}>{color.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ title: '', content: '', bgColor: 'bg-rose-100', textColor: 'text-rose-900' });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNote}
                disabled={!newNote.title.trim()}
              >
                Add Note
              </Button>
            </div>
          </Card>
        )}

        {editingNote && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <Input
              label="Note Title"
              value={editingNote.title}
              onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : prev)}
              placeholder="Enter note title"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
              <textarea
                value={editingNote.content}
                onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : prev)}
                placeholder="Write your thoughts..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Color</label>
              <select
                value={editingNote.bgColor}
                onChange={(e) => {
                  const selectedColor = noteColors.find(c => c.bgValue === e.target.value);
                  setEditingNote(prev =>
                    prev
                      ? {
                          ...prev,
                          bgColor: selectedColor?.bgValue || 'bg-rose-100',
                          textColor: selectedColor?.textValue || 'text-rose-900',
                        }
                      : prev
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {noteColors.map(color => (
                  <option key={color.bgValue} value={color.bgValue}>{color.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setEditingNote(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleEditNote}
                disabled={!editingNote.title.trim()}
              >
                Save Note
              </Button>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {successMessage && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          </Card>
        )}

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h4>
            <p className="text-gray-600">
              Start by adding a note to capture your wedding ideas and thoughts!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <Card
                key={note.id}
                className={`p-4 !${note.bgColor || 'bg-rose-100'} !bg-opacity-100 ${note.textColor || 'text-rose-900'} shadow-md hover:shadow-lg transition-shadow relative`}
                style={{ transform: `translate(${note.position_x}px, ${note.position_y}px)` }}
                onClick={() => console.log('Note rendered with bgColor:', note.bgColor, 'textColor:', note.textColor)}
              >
                <h5 className="font-semibold mb-2">{note.title}</h5>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="ghost"
                    icon={Edit2}
                    size="sm"
                    onClick={() => setEditingNote(note)}
                  />
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleDeleteNote(note.id)}
                  />
                  <Button
                    variant="ghost"
                    icon={Share2}
                    size="sm"
                    onClick={() => handleShareNote(note.id)}
                  />
                </div>
                {shareLinks[note.id] && (
                  <div className="mt-2 p-2 bg-white rounded-lg text-sm text-gray-600">
                    Share Link: <a href={shareLinks[note.id]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{shareLinks[note.id]}</a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};