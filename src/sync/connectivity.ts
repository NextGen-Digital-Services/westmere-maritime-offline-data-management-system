export type ConnectivityState = 'Online' | 'Offline' | 'Weak';

export interface ConnectivityStatus {
  state: ConnectivityState;
  latencyMs: number;
  lastChecked: Date;
  isSimulatedOffline: boolean;
  networkQuality: 'fast' | 'slow' | 'flaky';
}

type ConnectivityListener = (status: ConnectivityStatus) => void;

class ConnectivityMonitor {
  private state: ConnectivityState = 'Online';
  private latencyMs: number = 24;
  private lastChecked: Date = new Date();
  private isSimulatedOffline: boolean = false;
  private networkQuality: 'fast' | 'slow' | 'flaky' = 'fast';
  private listeners: Set<ConnectivityListener> = new Set();
  private timer: number | null = null;
  private consecutiveFailures: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkConnectivity());
      window.addEventListener('offline', () => this.handleOfflineEvent());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkConnectivity();
        }
      });
      this.startHeartbeat();
    }
  }

  public getStatus(): ConnectivityStatus {
    return {
      state: this.isSimulatedOffline ? 'Offline' : this.state,
      latencyMs: this.latencyMs,
      lastChecked: this.lastChecked,
      isSimulatedOffline: this.isSimulatedOffline,
      networkQuality: this.networkQuality
    };
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  public setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOffline = simulated;
    this.notify();
  }

  public setNetworkQuality(quality: 'fast' | 'slow' | 'flaky') {
    this.networkQuality = quality;
    this.notify();
  }

  public async checkConnectivity(): Promise<ConnectivityStatus> {
    this.lastChecked = new Date();

    if (this.isSimulatedOffline || !navigator.onLine) {
      this.state = 'Offline';
      this.consecutiveFailures++;
      this.notify();
      return this.getStatus();
    }

    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Heartbeat probe to local static ping or backend
      const res = await fetch(`/ping.json?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const duration = performance.now() - startTime;
      this.latencyMs = Math.round(duration);

      if (res.ok) {
        this.consecutiveFailures = 0;
        if (this.networkQuality === 'slow' || duration > 1500) {
          this.state = 'Weak';
        } else {
          this.state = 'Online';
        }
      } else {
        this.consecutiveFailures++;
        this.state = this.consecutiveFailures >= 2 ? 'Offline' : 'Weak';
      }
    } catch (err) {
      this.consecutiveFailures++;
      this.state = this.consecutiveFailures >= 2 ? 'Offline' : 'Weak';
      this.latencyMs = 9999;
    }

    this.notify();
    return this.getStatus();
  }

  private handleOfflineEvent() {
    this.state = 'Offline';
    this.consecutiveFailures++;
    this.notify();
  }

  private startHeartbeat() {
    if (this.timer) clearInterval(this.timer);
    // Active ping check every 12 seconds
    this.timer = window.setInterval(() => {
      this.checkConnectivity();
    }, 12000);
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(l => l(status));
  }
}

export const connectivityMonitor = new ConnectivityMonitor();
