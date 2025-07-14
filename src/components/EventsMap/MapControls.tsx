import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

interface MapControlsProps {
  onGetCurrentLocation: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ onGetCurrentLocation }) => {
  return (
    <div className="flex items-center justify-between p-3 border-b">
      <h3 className="font-semibold text-sm">Event Locations</h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onGetCurrentLocation}
        className="flex items-center gap-1"
      >
        <Navigation className="h-4 w-4" />
        My Location
      </Button>
    </div>
  );
};

export default MapControls;