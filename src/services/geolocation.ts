import { supabase } from '../supabase';

// Configuration for geolocation
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 30000, // 30 seconds
  timeout: 27000 // 27 seconds
};

// Distance threshold for nearby tasks (in meters)
const PROXIMITY_THRESHOLD = 500;

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

let watchId: number | null = null;
let lastLocation: Location | null = null;

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check for nearby tasks and trigger notifications
 */
async function checkNearbyTasks(location: Location) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false);

    if (error) throw error;

    const nearbyTasks = tasks?.filter(task => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        task.latitude,
        task.longitude
      );
      return distance <= PROXIMITY_THRESHOLD;
    });

    if (nearbyTasks?.length) {
      notifyNearbyTasks(nearbyTasks);
    }
  } catch (error) {
    console.error('Error checking nearby tasks:', error);
  }
}

/**
 * Notify user about nearby tasks
 */
function notifyNearbyTasks(tasks: any[]) {
  if (!('Notification' in window)) return;

  tasks.forEach(task => {
    if (Notification.permission === 'granted') {
      new Notification('Nearby Task', {
        body: task.task,
        icon: '/vite.svg'
      });
    }
  });
}

/**
 * Start tracking location
 */
export function startLocationTracking() {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser.');
    return;
  }

  // Request notification permission
  if ('Notification' in window) {
    Notification.requestPermission();
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };

      // Only process if location has changed significantly or enough time has passed
      if (!lastLocation || 
          calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            newLocation.latitude,
            newLocation.longitude
          ) > 10 || // 10 meters
          newLocation.timestamp - lastLocation.timestamp > 60000 // 1 minute
      ) {
        lastLocation = newLocation;
        checkNearbyTasks(newLocation);
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    GEOLOCATION_OPTIONS
  );
}

/**
 * Stop tracking location
 */
export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    lastLocation = null;
  }
}

/**
 * Get current location as a promise
 */
export function getCurrentLocationPromise(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      GEOLOCATION_OPTIONS
    );
  });
}