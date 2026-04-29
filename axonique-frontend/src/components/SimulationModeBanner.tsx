import { authService } from '../services/authService';
import { useSimulation } from '../context/SimulationContext';
import './SimulationModeBanner.css';

export default function SimulationModeBanner() {
  const { isSimulationMode, setSimulationMode } = useSimulation();
  const role = authService.getRole();
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';

  if (!isSimulationMode || !isAdmin) {
    return null;
  }

  return (
    <div className="simulation-banner" role="status" aria-live="polite">
      <span className="simulation-banner__label">Viewing as Customer</span>
      <button
        className="simulation-banner__exit"
        onClick={() => setSimulationMode(false)}
      >
        Exit & Return to Admin
      </button>
    </div>
  );
}
