import { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface SimulationContextValue {
  isSimulationMode: boolean;
  setSimulationMode: (enabled: boolean) => void;
  toggleSimulationMode: () => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

const STORAGE_KEY = 'axonique_simulation_mode';

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const role = authService.getRole();
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw === 'true';
  });

  const setSimulationMode = (enabled: boolean) => {
    const safeValue = isAdmin ? enabled : false;
    setIsSimulationMode(safeValue);
    sessionStorage.setItem(STORAGE_KEY, String(safeValue));
    if (safeValue) {
      navigate('/', { replace: true });
      return;
    }
    navigate('/admin/dashboard', { replace: true });
  };

  const toggleSimulationMode = () => setSimulationMode(!isSimulationMode);

  const value = useMemo(() => ({
    isSimulationMode: isAdmin ? isSimulationMode : false,
    setSimulationMode,
    toggleSimulationMode,
  }), [isAdmin, isSimulationMode]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
