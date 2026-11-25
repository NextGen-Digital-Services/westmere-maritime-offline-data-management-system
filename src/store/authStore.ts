import { create } from 'zustand';
import { clientDb, type User, type UserRole, type Vessel } from '../db/clientDb';
import { SEED_USERS, SEED_VESSELS } from '../db/seedData';

interface AuthState {
  currentUser: User | null;
  currentVessel: Vessel | null;
  isAuthenticated: boolean;
  login: (email: string, vesselId?: string) => Promise<boolean>;
  logout: () => void;
  switchVessel: (vesselId: string) => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  currentVessel: null,
  isAuthenticated: false,

  initAuth: async () => {
    // Check persisted session
    const savedUserId = localStorage.getItem('seasync_active_user_id');
    const savedVesselId = localStorage.getItem('seasync_active_vessel_id') || 'vessel-1';

    let user: User | undefined;
    if (savedUserId) {
      user = await clientDb.users.get(savedUserId);
    }
    if (!user) {
      // Default to Master for immediate rich experience if none saved
      user = SEED_USERS[2]; // Captain Erik Dahl
    }

    let vessel = await clientDb.vessels.get(savedVesselId) || SEED_VESSELS[0];

    set({
      currentUser: user,
      currentVessel: vessel,
      isAuthenticated: true
    });
  },

  login: async (email: string, vesselId = 'vessel-1') => {
    let user = await clientDb.users.where('email').equalsIgnoreCase(email).first();
    if (!user) {
      // Find in seed users fallback
      user = SEED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        await clientDb.users.put(user);
      }
    }

    if (!user) return false;

    let vessel = await clientDb.vessels.get(vesselId) || SEED_VESSELS[0];

    localStorage.setItem('seasync_active_user_id', user.id);
    localStorage.setItem('seasync_active_vessel_id', vessel.id);

    set({
      currentUser: user,
      currentVessel: vessel,
      isAuthenticated: true
    });

    // Write audit log for login
    await clientDb.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      vesselId: vessel.id,
      action: 'LOGIN',
      targetEntity: 'USER',
      entityId: user.id,
      details: `User logged into device onboard ${vessel.name}`
    });

    return true;
  },

  logout: () => {
    localStorage.removeItem('seasync_active_user_id');
    set({
      currentUser: null,
      isAuthenticated: false
    });
  },

  switchVessel: async (vesselId: string) => {
    const vessel = await clientDb.vessels.get(vesselId);
    if (vessel) {
      localStorage.setItem('seasync_active_vessel_id', vessel.id);
      set({ currentVessel: vessel });
    }
  }
}));
