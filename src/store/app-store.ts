"use client";

import { create } from "zustand";

type AppState = {
  launches: number;
  incrementLaunches: () => void;
  resetLaunches: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  launches: 0,
  incrementLaunches: () => set((state) => ({ launches: state.launches + 1 })),
  resetLaunches: () => set({ launches: 0 }),
}));
