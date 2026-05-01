import { create } from 'zustand';
import api from '@/lib/api';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/utils/formatters';

export interface CustomCategory {
  name: string;   // slug (e.g. "rent_expenses")
  label: string;  // display name (e.g. "Rent Expenses")
  emoji: string;
  color: string;
  is_default: boolean;
}

interface CategoryStore {
  customCategories: CustomCategory[];
  isLoaded: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (label: string, emoji: string) => Promise<string>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  customCategories: [],
  isLoaded: false,

  fetchCategories: async () => {
    if (get().isLoaded) return;
    try {
      const res = await api.get('/categories');
      const all: Array<{ name: string; icon: string; color: string; is_default: boolean }> = res.data ?? [];

      const custom = all.filter((c) => !c.is_default).map((c) => ({
        name: c.name,
        label: c.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        emoji: c.icon,
        color: c.color || '#6366f1',
        is_default: false,
      }));

      // Inject custom categories into the shared display maps so they work everywhere
      custom.forEach((c) => {
        if (!CATEGORY_LABELS[c.name as keyof typeof CATEGORY_LABELS]) {
          (CATEGORY_LABELS as Record<string, string>)[c.name] = c.label;
          (CATEGORY_ICONS as Record<string, string>)[c.name] = c.emoji;
          (CATEGORY_COLORS as Record<string, string>)[c.name] = c.color;
        }
      });

      set({ customCategories: custom, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  createCategory: async (label: string, emoji: string) => {
    const res = await api.post('/categories', { label, emoji });
    const { slug, label: displayLabel, color } = res;

    const newCat: CustomCategory = { name: slug, label: displayLabel, emoji, color, is_default: false };

    (CATEGORY_LABELS as Record<string, string>)[slug] = displayLabel;
    (CATEGORY_ICONS as Record<string, string>)[slug] = emoji;
    (CATEGORY_COLORS as Record<string, string>)[slug] = color;

    set((s) => ({ customCategories: [...s.customCategories, newCat] }));
    return slug;
  },
}));
