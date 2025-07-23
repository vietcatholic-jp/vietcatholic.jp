import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Format age group for display
export function formatAgeGroup(ageGroup: string): string {
  const ageGroupMap: Record<string, string> = {
    'under_12': 'Dưới 12 tuổi',
    '12_17': '12-17 tuổi',
    '18_25': '18-25 tuổi',
    '26_35': '26-35 tuổi',
    '36_50': '36-50 tuổi',
    'over_50': 'Trên 50 tuổi',
  };
  return ageGroupMap[ageGroup] || ageGroup;
}

// Format gender for display
export function formatGender(gender: string): string {
  return gender === 'male' ? 'Nam' : 'Nữ';
}
