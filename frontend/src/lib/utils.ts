import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 60) {
    return diffMins === 0 ? 'now' : `${diffMins > 0 ? 'in' : ''} ${Math.abs(diffMins)}m${diffMins < 0 ? ' ago' : ''}`;
  } else if (Math.abs(diffHours) < 24) {
    return `${diffHours > 0 ? 'in' : ''} ${Math.abs(diffHours)}h${diffHours < 0 ? ' ago' : ''}`;
  } else {
    return `${diffDays > 0 ? 'in' : ''} ${Math.abs(diffDays)}d${diffDays < 0 ? ' ago' : ''}`;
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'twitter':
      return 'bg-blue-500';
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'facebook':
      return 'bg-blue-600';
    case 'linkedin':
      return 'bg-blue-700';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'published':
      return 'text-green-600 bg-green-50';
    case 'paused':
    case 'draft':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
    case 'failed':
      return 'text-red-600 bg-red-50';
    case 'scheduled':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}