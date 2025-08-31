import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, Star, MessageCircle, Download, Eye, Edit, Save, X, TrendingUp, Check } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";

export default function WeddingTimeline() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  const calculateEndTime = (startTime: string, hours: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    start.setHours(start.getHours() + hours);
    return start.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    // Calculate end time based on package hours
    const calculatedEndTime = calculateEndTime(time, 8); // Default 8 hours
    setNewEndTime(calculatedEndTime);
  };

  const handleSaveTime = async () => {
    if (!newStartTime) return;

    setSavingTime(true);
    setTimeError(null);

    try {
      // Mock save for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditingTime(false);
      setSavingTime(false);
    } catch (error) {
      setTimeError('Failed to save time changes');
      setSavingTime(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wedding Timeline</h1>
          <p className="text-gray-600">Manage your wedding day schedule and events</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Timeline Events</h2>
            <div className="flex gap-2">
              {!editingTime ? (
                <Button
                  variant="outline"
                  onClick={() => setEditingTime(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Times
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTime}
                    disabled={savingTime}
                    className="flex items-center gap-2"
                  >
                    {savingTime ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTime(false);
                      setTimeError(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {timeError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {timeError}
            </div>
          )}

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Photography Session</h3>
                  <p className="text-sm text-gray-600">Wedding ceremony and reception</p>
                </div>
                <div className="flex items-center gap-4">
                  {editingTime ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={newEndTime}
                        readOnly
                        className="w-32 bg-gray-50"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>2:00 PM - 10:00 PM</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ceremony</h3>
                  <p className="text-sm text-gray-600">Main wedding ceremony</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>4:00 PM - 4:30 PM</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Reception</h3>
                  <p className="text-sm text-gray-600">Dinner and dancing</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>6:00 PM - 10:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}