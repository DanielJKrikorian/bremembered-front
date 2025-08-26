import React, { useState } from 'react';
import { Bell, MessageCircle, Camera, CreditCard, Star, Calendar, Check, X, AlertCircle, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useNotifications, Notification } from '../../hooks/useNotifications';

export const NotificationsSection: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'photos' | 'payments'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message': return MessageCircle;
      case 'photo_upload': return Camera;
      case 'payment_due': return CreditCard;
      case 'review_response': return Star;
      case 'booking_update': return Calendar;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-100 border-red-200';
    if (priority === 'high') return 'text-orange-600 bg-orange-100 border-orange-200';
    
    switch (type) {
      case 'new_message': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'photo_upload': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'payment_due': return 'text-red-600 bg-red-100 border-red-200';
      case 'review_response': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'booking_update': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    return notificationTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notificationTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'messages' && notification.type !== 'new_message') return false;
    if (filter === 'photos' && notification.type !== 'photo_upload') return false;
    if (filter === 'payments' && notification.type !== 'payment_due') return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to the action URL if provided
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Notifications</h3>
            <p className="text-gray-600">
              Stay updated on your wedding planning progress
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-rose-500">{unreadCount}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                icon={CheckCheck}
                size="sm"
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'new_message').length },
              { key: 'photos', label: 'Photos', count: notifications.filter(n => n.type === 'photo_upload').length },
              { key: 'payments', label: 'Payments', count: notifications.filter(n => n.type === 'payment_due').length }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 
             searchTerm ? 'No notifications found' : 'No notifications yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 
             'Notifications about messages, photos, and payments will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClasses = getNotificationColor(notification.type, notification.priority);
            
            return (
              <Card 
                key={notification.id} 
                className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                  !notification.read ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClasses}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.priority === 'urgent' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Urgent
                          </span>
                        )}
                        {notification.priority === 'high' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                            High
                          </span>
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 leading-relaxed ${
                      !notification.read ? 'text-gray-700' : 'text-gray-600'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      {notification.action_url && (
                        <span className="text-xs text-rose-600 font-medium">
                          Click to view →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Notification Preferences
          </h3>
          <p className="text-gray-600 mb-4">
            Customize how and when you receive notifications
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/profile?tab=settings')}
          >
            Manage Preferences
          </Button>
        </div>
      </Card>
    </div>
  );
};