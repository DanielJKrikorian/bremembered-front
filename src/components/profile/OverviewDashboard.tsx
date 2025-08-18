import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckSquare, AlertCircle, Plus, X, Edit2, Save, AlertTriangle, MessageCircle, User, Camera, Heart, Star } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';
import { useConversations } from '../../hooks/useMessaging';
import { useWeddingGallery } from '../../hooks/useWeddingGallery';

interface TodoItem {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  due_time: string | null;
  created_at: string;
  updated_at: string;
}

export const OverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { couple } = useCouple();
  const { conversations } = useConversations();
  const { files } = useWeddingGallery();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newTodoDate, setNewTodoDate] = useState('');
  const [newTodoTime, setNewTodoTime] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [daysUntilWedding, setDaysUntilWedding] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTabNavigation = (tab: string) => {
    navigate(`/profile?tab=${tab}`);
  };

  useEffect(() => {
    if (couple?.wedding_date) {
      try {
        const days = differenceInDays(parseISO(couple.wedding_date), new Date());
        setDaysUntilWedding(days > 0 ? days : 0);
      } catch (err) {
        console.error('Error parsing wedding date:', err);
        setDaysUntilWedding(null);
      }
    }
  }, [couple?.wedding_date]);

  useEffect(() => {
    if (user?.id) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock todos for demo
      const mockTodos: TodoItem[] = [
        {
          id: 'mock-todo-1',
          user_id: user.id,
          title: 'Book wedding photographer',
          completed: true,
          due_date: '2024-02-15',
          due_time: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'mock-todo-2',
          user_id: user.id,
          title: 'Finalize wedding timeline with vendors',
          completed: false,
          due_date: '2024-02-20',
          due_time: '14:00',
          created_at: '2024-01-16T10:00:00Z',
          updated_at: '2024-01-16T10:00:00Z'
        },
        {
          id: 'mock-todo-3',
          user_id: user.id,
          title: 'Send playlist to DJ',
          completed: false,
          due_date: '2024-02-25',
          due_time: null,
          created_at: '2024-01-17T10:00:00Z',
          updated_at: '2024-01-17T10:00:00Z'
        }
      ];
      setTodos(mockTodos);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wedding_todos')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch todos');
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async () => {
    if (!user?.id || !newTodo.trim()) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Add to local state for demo
      const newTodoItem: TodoItem = {
        id: `mock-todo-${Date.now()}`,
        user_id: user.id,
        title: newTodo.trim(),
        completed: false,
        due_date: newTodoDate || null,
        due_time: newTodoTime || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTodos(prev => [...prev, newTodoItem]);
      setNewTodo('');
      setNewTodoDate('');
      setNewTodoTime('');
      setIsAddingTodo(false);
      return;
    }

    try {
      const { error } = await supabase.from('wedding_todos').insert({
        user_id: user.id,
        title: newTodo.trim(),
        completed: false,
        due_date: newTodoDate || null,
        due_time: newTodoTime || null
      });

      if (error) throw error;

      setNewTodo('');
      setNewTodoDate('');
      setNewTodoTime('');
      setIsAddingTodo(false);
      await fetchTodos();
    } catch (err) {
      console.error('Error adding todo:', err);
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user?.id) return;

    // Update local state immediately
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed } : todo
    ));

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_todos')
        .update({ completed })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      // Revert local state on error
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
      console.error('Error toggling todo:', err);
    }
  };

  const updateTodo = async (id: string) => {
    if (!user?.id || !editText.trim()) return;

    const updatedTodo = {
      title: editText.trim(),
      due_date: editDate || null,
      due_time: editTime || null,
      updated_at: new Date().toISOString()
    };

    // Update local state immediately
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...updatedTodo } : todo
    ));

    setEditingTodo(null);
    setEditText('');
    setEditDate('');
    setEditTime('');

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_todos')
        .update(updatedTodo)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating todo:', err);
      await fetchTodos(); // Refresh from server on error
    }
  };

  const startEditing = (todo: TodoItem) => {
    setEditingTodo(todo.id);
    setEditText(todo.title);
    setEditDate(todo.due_date || '');
    setEditTime(todo.due_time || '');
  };

  const deleteTodo = async (id: string) => {
    if (!user?.id) return;

    // Remove from local state immediately
    setTodos(prev => prev.filter(todo => todo.id !== id));

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting todo:', err);
      await fetchTodos(); // Refresh from server on error
    }
  };

  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date) return '';
    try {
      const formattedDate = format(parseISO(date), 'MMM d, yyyy');
      return time
        ? `${formattedDate} at ${format(new Date(`2000-01-01T${time}`), 'h:mm a')}`
        : formattedDate;
    } catch (err) {
      console.error('Error formatting date/time:', err);
      return date || '';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get recent conversations (last 3)
  const recentConversations = conversations.slice(0, 3);

  // Get recent photos (last 6)
  const recentPhotos = files.filter(file => 
    file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ).slice(0, 6);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wedding Countdown */}
      <Card className="overflow-hidden">
        <div className="px-6 py-8 text-center bg-gradient-to-r from-rose-500 to-amber-500">
          <h2 className="text-3xl font-bold text-white mb-2">
            {daysUntilWedding !== null ? (
              daysUntilWedding > 0 ? (
                <>
                  {daysUntilWedding} {daysUntilWedding === 1 ? 'Day' : 'Days'}
                  <span className="block text-lg font-normal mt-1">
                    until your wedding
                  </span>
                </>
              ) : (
                'Congratulations on your wedding!'
              )
            ) : (
              'Set your wedding date'
            )}
          </h2>
          {couple?.wedding_date && (
            <p className="text-rose-100 mt-2">
              {format(parseISO(couple.wedding_date), 'MMMM d, yyyy')}
            </p>
          )}
          {couple?.venue_name && (
            <p className="text-rose-100 mt-1">
              at {couple.venue_name}
            </p>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-rose-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Wedding Date</h3>
              <p className="text-gray-500">
                {couple?.wedding_date ? formatDate(couple.wedding_date) : 'Not set'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Venue</h3>
              <p className="text-gray-500">
                {couple?.venue_name || 'Not selected'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
              <p className="text-gray-500">
                {todos.filter(todo => todo.completed).length} of {todos.length} completed
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Gallery</h3>
              <p className="text-gray-500">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTabNavigation('messages')}
            >
              View All
            </Button>
          </div>

          {recentConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
              <p className="text-gray-600">
                Once you book services, you'll be able to message your vendors here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  {conversation.other_participant?.profile_photo ? (
                    <img
                      src={conversation.other_participant.profile_photo}
                      alt={conversation.other_participant.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {conversation.other_participant?.name || 'Unknown Contact'}
                    </h4>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message.message_text}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {conversation.last_message && 
                      new Date(conversation.last_message.timestamp).toLocaleDateString()
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Wedding Todo List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Wedding Todo List</h3>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddingTodo(true)}
            >
              Add Task
            </Button>
          </div>

          {isAddingTodo && (
            <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Enter a new task..."
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Due Date"
                  type="date"
                  value={newTodoDate}
                  onChange={(e) => setNewTodoDate(e.target.value)}
                />
                <Input
                  label="Due Time"
                  type="time"
                  value={newTodoTime}
                  onChange={(e) => setNewTodoTime(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingTodo(false);
                    setNewTodo('');
                    setNewTodoDate('');
                    setNewTodoTime('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                >
                  Add Task
                </Button>
              </div>
            </div>
          )}

          {todos.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
              <p className="text-gray-600">
                Get started by adding some tasks to your wedding checklist
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={(e) => toggleTodo(todo.id, e.target.checked)}
                      className="w-4 h-4 text-rose-500 focus:ring-rose-500 border-gray-300 rounded"
                    />
                    {editingTodo === todo.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && updateTodo(todo.id)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                          />
                          <Input
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className={todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                          {todo.title}
                        </span>
                        {(todo.due_date || todo.due_time) && (
                          <div className="text-sm text-gray-500 mt-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDateTime(todo.due_date, todo.due_time)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {editingTodo === todo.id ? (
                      <>
                        <button
                          onClick={() => updateTodo(todo.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTodo(null)}
                          className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(todo)}
                          className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 text-red-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Gallery Photos */}
      {recentPhotos.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Photos</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTabNavigation('gallery')}
            >
              View Gallery
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentPhotos.map((file) => (
              <div key={file.id} className="aspect-square">
                <img
                  src={file.public_url}
                  alt={file.file_name}
                  className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-16 flex-col"
            onClick={() => handleTabNavigation('timeline')}
          >
            <Calendar className="w-6 h-6 mb-2" />
            <span>Update Timeline</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col"
            onClick={() => handleTabNavigation('messages')}
          >
            <MessageCircle className="w-6 h-6 mb-2" />
            <span>Message Vendors</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col"
            onClick={() => handleTabNavigation('gallery')}
          >
            <Camera className="w-6 h-6 mb-2" />
            <span>View Gallery</span>
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}
    </div>
  );
};