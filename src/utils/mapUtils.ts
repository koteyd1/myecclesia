import { MapLocation } from '@/types/EventsMap';

export const getMockCoordinates = (location: string): MapLocation => {
  const locationMocks: { [key: string]: MapLocation } = {
    // London locations
    'london': { lat: 51.5074, lng: -0.1278 },
    'st. paul': { lat: 51.5138, lng: -0.0984 },
    'westminster abbey': { lat: 51.4994, lng: -0.1273 },
    'royal albert hall': { lat: 51.5009, lng: -0.1773 },
    
    // Other UK cities
    'manchester': { lat: 53.4808, lng: -2.2426 },
    'birmingham': { lat: 52.4862, lng: -1.8904 },
    'edinburgh': { lat: 55.9533, lng: -3.1883 },
    'cardiff': { lat: 51.4816, lng: -3.1791 },
    'york': { lat: 53.9600, lng: -1.0873 },
    'canterbury': { lat: 51.2802, lng: 1.0789 },
    'salisbury': { lat: 51.0693, lng: -1.7958 },
    'bath': { lat: 51.3811, lng: -2.3590 },
    'liverpool': { lat: 53.4084, lng: -2.9916 },
    'glasgow': { lat: 55.8642, lng: -4.2518 },
    'durham': { lat: 54.7753, lng: -1.5849 },
    'chester': { lat: 53.1906, lng: -2.8837 },
    'monmouthshire': { lat: 51.8120, lng: -2.7190 },
    'tintern': { lat: 51.6998, lng: -2.6781 },
    'stonehenge': { lat: 51.1789, lng: -1.8262 },
  };

  const lowerLocation = location.toLowerCase();
  for (const [key, coords] of Object.entries(locationMocks)) {
    if (lowerLocation.includes(key)) {
      return coords;
    }
  }

  // Return coordinates around central England for demo
  return {
    lat: 52.5 + (Math.random() - 0.5) * 2,
    lng: -1.5 + (Math.random() - 0.5) * 2
  };
};

export const createEventInfoWindowContent = (event: { title: string; location: string; date: string; time: string; category?: string }): string => {
  return `
    <div class="p-3 max-w-xs">
      <h3 class="font-semibold text-sm mb-1">${event.title}</h3>
      <p class="text-xs text-gray-600 mb-1">${event.location}</p>
      <p class="text-xs text-gray-600 mb-2">${event.date} at ${event.time}</p>
      ${event.category ? `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${event.category}</span>` : ''}
    </div>
  `;
};