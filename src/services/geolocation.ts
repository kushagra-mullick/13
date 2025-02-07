import { supabase } from '../supabase';

// Configuration for geolocation
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0, // Don't use cached positions
  timeout: 10000 // 10 seconds
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
 * Handle geolocation errors
 */
function handleGeolocationError(error: GeolocationPositionError): never {
  let message: string;
  let resolution: string;

  switch (error.code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      message = "Location access was denied. Please enable location services in your browser settings.";
      resolution = "To fix: Click the location icon in your browser's address bar and allow access.";
      break;
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      message = "Unable to determine your location. The GPS signal might be weak or unavailable.";
      resolution = "Please try: \n1. Moving to an area with better GPS coverage\n2. Checking your device's location settings\n3. Using the manual location input or map selection";
      break;
    case GeolocationPositionError.TIMEOUT:
      message = "Location request timed out. The server took too long to respond.";
      resolution = "Please try again. If the problem persists, use the manual location input or map selection.";
      break;
    default:
      message = "An unknown error occurred while trying to fetch your location.";
      resolution = "Please try again or use the manual location input options.";
  }

  throw new Error(`${message}\n\n${resolution}`);
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
    throw new Error('Geolocation is not supported by this browser. Please use a modern browser with geolocation support.');
  }

  // Request notification permission
  if ('Notification' in window) {
    Notification.requestPermission();
  }

  // Check for HTTPS
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    throw new Error('Geolocation requires a secure connection (HTTPS). Please access this site using HTTPS.');
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
    handleGeolocationError,
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
      reject(new Error('Geolocation is not supported by this browser. Please use a modern browser with geolocation support.'));
      return;
    }

    // Check for HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      reject(new Error('Geolocation requires a secure connection (HTTPS). Please access this site using HTTPS.'));
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
      handleGeolocationError,
      GEOLOCATION_OPTIONS
    );
  });
}