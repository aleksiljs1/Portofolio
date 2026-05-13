import { create } from 'zustand'

interface FilterStore {
  activeTech: string | null
  setActiveTech: (name: string | null) => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  activeTech: null,
  setActiveTech: (name) => set({ activeTech: name }),
}))
