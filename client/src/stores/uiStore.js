import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  activeCaseTab: 'overview',
  setActiveCaseTab: (tab) => set({ activeCaseTab: tab }),

  notifications: [],
  addNotification: (type, message) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }]
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 4000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }))
}));
