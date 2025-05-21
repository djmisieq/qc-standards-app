import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

// Get locale based on browser or user preference
const getLocale = () => {
  const userLang = navigator.language;
  return userLang.startsWith('pl') ? pl : enUS;
};

// Format a date string to a human-readable format
export const formatDate = (dateString: string | null | undefined, formatStr = 'PPP'): string => {
  if (!dateString) return 'N/A';
  
  const date = parseISO(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return format(date, formatStr, { locale: getLocale() });
};

// Format a date string to a relative time (e.g., "2 hours ago")
export const formatRelativeDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = parseISO(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return formatDistanceToNow(date, { addSuffix: true, locale: getLocale() });
};

// Format a time duration in seconds to a readable format (e.g., "2m 30s")
export const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds) return 'N/A';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
};
