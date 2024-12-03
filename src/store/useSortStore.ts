import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SortPreferences, SortOrder } from '../types/sort';

interface SortStore extends SortPreferences {
  toggleOrder: () => void;
}

export const useSortStore = create<SortStore>()(
  persist(
    (set) => ({
      order: 'desc' as SortOrder,
      toggleOrder: () => set((state) => ({ 
        order: state.order === 'asc' ? 'desc' : 'asc' 
      })),
    }),
    {
      name: 'photo-sort-preferences',
    }
  )
);