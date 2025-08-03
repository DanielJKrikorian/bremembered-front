import React from 'react';
import { Star, MapPin, Clock, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ServiceBundle } from '../../types';

interface ServiceCardProps {
  bundle: ServiceBundle;
  onClick?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ bundle, onClick }) => {
  return (
    <Card hover className="overflow-hidden cursor-pointer" onClick={onClick}>
      <div className="aspect-video overflow-hidden">
        <img
          src={bundle.images[0]}
          alt={bundle.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{bundle.name}</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{bundle.rating}</span>
            <span>({bundle.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{bundle.location}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{bundle.duration}h</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{bundle.services.length} services</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{bundle.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {bundle.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${bundle.originalPrice.toLocaleString()}
              </span>
            )}
            <span className="text-xl font-bold text-gray-900">
              ${bundle.price.toLocaleString()}
            </span>
          </div>
          <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};