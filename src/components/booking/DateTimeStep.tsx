import React from 'react';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DateTimeStepProps {
  eventDate: string;
  eventTime: string;
  eventType: string;
  onEventDateChange: (date: string) => void;
  onEventTimeChange: (time: string) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
}

export const DateTimeStep: React.FC<DateTimeStepProps> = ({
  eventDate,
  eventTime,
  eventType,
  onEventDateChange,
  onEventTimeChange,
  onNext,
  onPrev,
  canProceed
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-amber-600" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          When is your {eventType.toLowerCase()}?
        </h4>
        <p className="text-gray-600">
          Select your event date and time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Input
          label="Event Date"
          type="date"
          value={eventDate}
          onChange={(e) => onEventDateChange(e.target.value)}
          icon={Calendar}
          required
        />
        <Input
          label="Event Time"
          type="time"
          value={eventTime}
          onChange={(e) => onEventTimeChange(e.target.value)}
          icon={Clock}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button
          variant="outline"
          onClick={onPrev}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canProceed}
          icon={ArrowRight}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};