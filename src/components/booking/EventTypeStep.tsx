import React from 'react';

interface EventType {
  id: string;
  name: string;
  emoji: string;
}

interface EventTypeStepProps {
  eventTypes: EventType[];
  selectedEventType: string;
  onEventTypeSelect: (eventType: string) => void;
}

export const EventTypeStep: React.FC<EventTypeStepProps> = ({
  eventTypes,
  selectedEventType,
  onEventTypeSelect
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-2xl font-bold text-gray-900 mb-3">
          What type of event are you planning?
        </h4>
        <p className="text-gray-600">
          Choose the type of celebration you're planning
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {eventTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onEventTypeSelect(type.id)}
            className="p-6 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-center group"
          >
            <div className="text-4xl mb-3">{type.emoji}</div>
            <h5 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600">
              {type.name}
            </h5>
          </button>
        ))}
      </div>
    </div>
  );
};