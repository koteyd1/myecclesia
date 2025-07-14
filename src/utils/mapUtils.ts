import { MapLocation } from '@/types/EventsMap';

export const getMockCoordinates = (location: string): MapLocation => {
  const locationMocks: { [key: string]: MapLocation } = {
    'downtown': { lat: 40.7831, lng: -73.9712 },
    'main street': { lat: 40.7589, lng: -73.9851 },
    'city center': { lat: 40.7505, lng: -73.9934 },
    'central park': { lat: 40.7829, lng: -73.9654 },
    'times square': { lat: 40.7580, lng: -73.9855 },
  };

  const lowerLocation = location.toLowerCase();
  for (const [key, coords] of Object.entries(locationMocks)) {
    if (lowerLocation.includes(key)) {
      return coords;
    }
  }

  // Return random coordinates around NYC area for demo
  return {
    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
    lng: -74.0060 + (Math.random() - 0.5) * 0.1
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