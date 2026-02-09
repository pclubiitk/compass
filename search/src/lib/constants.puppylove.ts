/**
 * PuppyLove Constants
 * 
 * Contains interest groups, color mappings, and session storage keys
 * for the PuppyLove Valentine's mode feature.
 */

// ============================================================================
// Session Storage Keys (Canonical locations for PuppyLove data)
// ============================================================================
export const SESSION_KEYS = {
  ENCRYPTED_PRIVATE_KEY: 'puppylove_encrypted_private_key',
  PRIVATE_KEY: 'puppylove_private_key',
  PUBLIC_KEY: 'puppylove_public_key',
  SELECTED_HEARTS: 'puppylove_selected_hearts',
  SENT_HEARTS: 'puppylove_sent_hearts',
  PROFILES_CACHE: 'puppylove_profiles_cache',
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================
export const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// ============================================================================
// Interest Groups (Grouped like Constant.tsx style)
// ============================================================================
export const PUPPYLOVE_INTEREST_GROUPS: Record<string, string[]> = {
  'Music': ['Pop', 'Rock', 'Classical', 'Hip-Hop', 'Jazz', 'Singing', 'Instrumental'],
  'Health & Fitness': ['Gym', 'Yoga', 'Meditation', 'Running', 'Swimming', 'Cycling'],
  'Creativity': ['Dance', 'Art', 'Painting', 'Sketching', 'Crafting', 'Photography', 'Writing'],
  'Sports': ['Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball', 'Table Tennis', 'Chess'],
  'Design & Fashion': ['Design', 'Fashion', 'Makeup', 'Styling'],
  'Writing & Literature': ['Writing', 'Reading', 'Poetry', 'Literature', 'Blogging'],
  'Entertainment': ['Movies', 'TV Shows', 'Anime', 'Gaming', 'Stand-up', 'Festivals'],
  'Knowledge': ['Science', 'History', 'Philosophy', 'Psychology', 'Economics', 'Politics', 'Debating', 'Quizzing'],
  'Technology': ['Coding', 'AI/ML', 'Web Dev', 'App Dev', 'Robotics', 'Linux', 'Cybersecurity'],
  'Outdoor Activities': ['Trekking', 'Travel', 'Adventure', 'Camping', 'Nature'],
  'Food & Cooking': ['Cooking', 'Baking', 'Food Exploring', 'Coffee', 'Foodie'],
  'Social': ['Making Friends', 'Networking', 'Volunteering', 'Community'],
};

// Special key for custom interests
export const CUSTOM_INTEREST_KEY = '__custom__';

// Maximum length for custom interest
export const CUSTOM_INTEREST_MAX_LENGTH = 20;

// Flat list of all interests for easy iteration
export const ALL_INTERESTS: string[] = Object.values(PUPPYLOVE_INTEREST_GROUPS).flat();

// ============================================================================
// Color Palette for Interest Tags - Vibrant colors
// ============================================================================
export const VIBRANT_COLOR_PALETTE = [
  { bg: 'bg-rose-500', text: 'text-white', hover: 'hover:bg-rose-600' },
  { bg: 'bg-pink-500', text: 'text-white', hover: 'hover:bg-pink-600' },
  { bg: 'bg-fuchsia-500', text: 'text-white', hover: 'hover:bg-fuchsia-600' },
  { bg: 'bg-purple-500', text: 'text-white', hover: 'hover:bg-purple-600' },
  { bg: 'bg-violet-500', text: 'text-white', hover: 'hover:bg-violet-600' },
  { bg: 'bg-indigo-500', text: 'text-white', hover: 'hover:bg-indigo-600' },
  { bg: 'bg-blue-500', text: 'text-white', hover: 'hover:bg-blue-600' },
  { bg: 'bg-sky-500', text: 'text-white', hover: 'hover:bg-sky-600' },
  { bg: 'bg-cyan-500', text: 'text-white', hover: 'hover:bg-cyan-600' },
  { bg: 'bg-teal-500', text: 'text-white', hover: 'hover:bg-teal-600' },
  { bg: 'bg-emerald-500', text: 'text-white', hover: 'hover:bg-emerald-600' },
  { bg: 'bg-green-500', text: 'text-white', hover: 'hover:bg-green-600' },
  { bg: 'bg-lime-500', text: 'text-black', hover: 'hover:bg-lime-600' },
  { bg: 'bg-yellow-500', text: 'text-black', hover: 'hover:bg-yellow-600' },
  { bg: 'bg-amber-500', text: 'text-black', hover: 'hover:bg-amber-600' },
  { bg: 'bg-orange-500', text: 'text-white', hover: 'hover:bg-orange-600' },
  { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600' },
] as const;

// Legacy RGBA palette for compatibility
export const COLOR_PALETTE = [
  'rgba(47, 129, 247, 0.8)',   // GitHub Blue
  'rgba(56, 139, 253, 0.8)',   // Lighter Blue
  'rgba(88, 166, 255, 0.8)',   // Sky Blue
  'rgba(40, 167, 69, 0.8)',    // GitHub Green
  'rgba(34, 134, 58, 0.8)',    // Darker Green
  'rgba(255, 211, 77, 0.8)',   // Yellow
  'rgba(245, 159, 0, 0.8)',    // Orange Yellow
  'rgba(203, 36, 49, 0.8)',    // GitHub Red
  'rgba(248, 81, 73, 0.8)',    // Bright Red
  'rgba(163, 113, 247, 0.8)',  // Purple
  'rgba(131, 204, 255, 0.8)',  // Cyan
  'rgba(255, 123, 114, 0.8)',  // Coral Pink
  'rgba(75, 192, 192, 0.8)',   // Turquoise
  'rgba(255, 159, 64, 0.8)',   // Golden
  'rgba(233, 30, 99, 0.8)',    // Hot Pink
  'rgba(33, 150, 243, 0.8)',   // Deep Blue
  'rgba(156, 39, 176, 0.8)',   // Deep Purple
  'rgba(139, 195, 74, 0.8)',   // Light Green
  'rgba(255, 87, 34, 0.8)',    // Deep Orange
  'rgba(0, 188, 212, 0.8)',    // Cyan
] as const;

/**
 * Hash a string to a consistent color from the palette
 */
export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Hash a string to get vibrant Tailwind color classes
 */
export function getVibrantColorClasses(str: string): { bg: string; text: string; hover: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % VIBRANT_COLOR_PALETTE.length;
  return VIBRANT_COLOR_PALETTE[index];
}

/**
 * Get Tailwind-compatible background color class for an interest
 * Uses hash-based vibrant colors for consistent but colorful display
 */
export function getInterestColorClass(interest: string): string {
  const colors = getVibrantColorClasses(interest.toLowerCase());
  return `${colors.bg} ${colors.text} ${colors.hover}`;
}

// ============================================================================
// Special Message Configuration
// ============================================================================
export const SPECIAL_MESSAGE_MAX_LENGTH = 200;

// ============================================================================
// Helper Types
// ============================================================================
export interface PuppyLoveProfile {
  about: string;
  interests: string[];
}

export interface SelectedHeart {
  rollNo: string;
  name: string;
  specialMessage: string;
}

export interface ProfilesCacheData {
  data: Record<string, PuppyLoveProfile>;
  expiry: number;
}

// ============================================================================
// Cache Helpers
// ============================================================================

/**
 * Get cached profiles from localStorage, returns null if expired or not found
 */
export function getCachedProfiles(): Record<string, PuppyLoveProfile> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(SESSION_KEYS.PROFILES_CACHE);
    if (!cached) return null;
    
    const parsed: ProfilesCacheData = JSON.parse(cached);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(SESSION_KEYS.PROFILES_CACHE);
      return null;
    }
    
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Set profiles cache in localStorage with expiry
 */
export function setCachedProfiles(profiles: Record<string, PuppyLoveProfile>): void {
  if (typeof window === 'undefined') return;
  
  const cacheData: ProfilesCacheData = {
    data: profiles,
    expiry: Date.now() + CACHE_EXPIRY_MS,
  };
  
  localStorage.setItem(SESSION_KEYS.PROFILES_CACHE, JSON.stringify(cacheData));
}

/**
 * Clear all PuppyLove related storage (on logout)
 */
export function clearPuppyLoveStorage(): void {
  if (typeof window === 'undefined') return;
  
  // Clear sessionStorage
  Object.values(SESSION_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  // Clear localStorage cache
  localStorage.removeItem(SESSION_KEYS.PROFILES_CACHE);
}
