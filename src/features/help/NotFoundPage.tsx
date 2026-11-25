import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, RefreshCw } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-navy-light text-teal flex items-center justify-center mx-auto">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
      </div>
      <h1 className="text-2xl font-bold font-heading text-navy dark:text-canvas">404 - Waypoint Off Course</h1>
      <p className="text-xs text-canvas-muted max-w-sm">
        The requested maritime operational route or record is not available in the local navigation cache.
      </p>
      <div className="flex items-center space-x-3 pt-2">
        <Link
          to="/dashboard"
          className="flex items-center space-x-1.5 px-4 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-1.5 px-4 py-2 bg-canvas-card border rounded text-xs font-bold hover:bg-canvas-subtle"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload Local Cache</span>
        </button>
      </div>
    </div>
  );
};
