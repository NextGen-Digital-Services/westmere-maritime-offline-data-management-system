import { useState, useEffect } from 'react';
import { connectivityMonitor, type ConnectivityStatus } from '../sync/connectivity';

export function useConnectivity(): ConnectivityStatus {
  const [status, setStatus] = useState<ConnectivityStatus>(connectivityMonitor.getStatus());

  useEffect(() => {
    return connectivityMonitor.subscribe(setStatus);
  }, []);

  return status;
}
