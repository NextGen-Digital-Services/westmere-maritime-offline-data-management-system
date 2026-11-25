import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SEED_USERS, SEED_VESSELS } from '../../db/seedData';
import { AnimatedShipWaves } from '../../components/ui/AnimatedShipWaves';
import { Anchor, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('master@seasync.demo');
  const [password, setPassword] = useState('demo123');
  const [vesselId, setVesselId] = useState('vessel-1');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = await login(email, vesselId);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials or vessel not recognized.');
    }
  };

  const handleQuickDemoLogin = async (userEmail: string) => {
    setEmail(userEmail);
    const ok = await login(userEmail, vesselId);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Animated Hero Header */}
      <div>
        <div className="bg-navy pt-8 pb-4 px-6 text-center text-white">
          <div className="inline-flex items-center space-x-2 bg-navy-light px-3 py-1 rounded-full text-xs text-teal font-semibold mb-3">
            <Anchor className="w-3.5 h-3.5" />
            <span>Built by Westmere for Shipboard Operations</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight">SeaSync</h1>
          <p className="text-sm text-canvas-muted mt-1 font-medium">Work offline. Sync everywhere.</p>
        </div>
        <AnimatedShipWaves className="h-28" />
      </div>

      {/* Login Card & Demo Fillers */}
      <div className="flex-1 flex items-center justify-center p-4 -mt-6 z-10">
        <div className="max-w-md w-full bg-canvas-card border border-canvas-border rounded-lg shadow-solid-lg p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-navy dark:text-canvas">Vessel Terminal Sign-In</h2>
            <p className="text-xs text-canvas-muted mt-1">Authenticate onboard session with local offline cache</p>
          </div>

          {error && (
            <div className="p-3 bg-coralRed-subtle border border-coralRed text-coralRed text-xs rounded font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-canvas-muted mb-1">Vessel Assignment</label>
              <select
                value={vesselId}
                onChange={e => setVesselId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-canvas border rounded font-semibold focus:outline-none focus:border-ocean"
              >
                {SEED_VESSELS.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.imoNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-canvas-muted mb-1">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-canvas-muted mb-1">Password / PIN</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={e => setRememberDevice(e.target.checked)}
                  className="rounded text-ocean focus:ring-ocean"
                />
                <span className="text-canvas-muted">Remember this bridge device</span>
              </label>
              <span className="text-teal font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Offline Encrypted</span>
              </span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-ocean hover:bg-ocean-hover text-white rounded font-bold shadow-solid transition-colors"
            >
              <span>Sign In to Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed Demo Accounts Helper Card */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-navy dark:text-canvas mb-2">
              <UserCheck className="w-3.5 h-3.5 text-teal" />
              <span>Demo Logins (Click to 1-Click Authenticate):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {SEED_USERS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u.email)}
                  className="p-2 border rounded text-left hover:border-ocean hover:bg-canvas-subtle transition-colors"
                >
                  <div className="font-bold text-navy dark:text-canvas truncate">{u.role}</div>
                  <div className="text-[10px] text-canvas-muted truncate">{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-canvas-muted">
        SeaSync Maritime Data Management &copy; {new Date().getFullYear()} Westmere. Built for Zero Network Latency.
      </footer>
    </div>
  );
};
