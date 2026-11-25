import React, { useState, useEffect } from 'react';
import { Navigation, Copy, Check } from 'lucide-react';

interface CoordinatesFieldProps {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const CoordinatesField: React.FC<CoordinatesFieldProps> = ({
  value = '',
  onChange,
  disabled = false
}) => {
  const [lat, setLat] = useState('51.9244');
  const [latHem, setLatHem] = useState<'N' | 'S'>('N');
  const [lon, setLon] = useState('004.4777');
  const [lonHem, setLonHem] = useState<'E' | 'W'>('E');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (value) {
      const parts = value.split(',');
      if (parts.length === 2) {
        const pLat = parts[0].trim();
        const pLon = parts[1].trim();
        if (pLat.endsWith('N') || pLat.endsWith('S')) {
          setLatHem(pLat.slice(-1) as 'N' | 'S');
          setLat(pLat.slice(0, -1).trim());
        }
        if (pLon.endsWith('E') || pLon.endsWith('W')) {
          setLonHem(pLon.slice(-1) as 'E' | 'W');
          setLon(pLon.slice(0, -1).trim());
        }
      }
    }
  }, [value]);

  const updateCoord = (newLat: string, newLatHem: 'N' | 'S', newLon: string, newLonHem: 'E' | 'W') => {
    setLat(newLat);
    setLatHem(newLatHem);
    setLon(newLon);
    setLonHem(newLonHem);
    onChange(`${newLat} ${newLatHem}, ${newLon} ${newLonHem}`);
  };

  const handleCopy = () => {
    const formatted = `${lat} ${latHem}, ${lon} ${lonHem}`;
    navigator.clipboard?.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Latitude */}
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-canvas-muted w-8">LAT:</span>
          <input
            type="text"
            disabled={disabled}
            value={lat}
            onChange={e => updateCoord(e.target.value, latHem, lon, lonHem)}
            placeholder="51.9244"
            className="flex-1 px-3 py-1.5 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean disabled:opacity-60 font-mono"
          />
          <select
            disabled={disabled}
            value={latHem}
            onChange={e => updateCoord(lat, e.target.value as 'N' | 'S', lon, lonHem)}
            className="px-2 py-1.5 text-sm bg-canvas border rounded font-bold font-mono focus:outline-none"
          >
            <option value="N">N</option>
            <option value="S">S</option>
          </select>
        </div>

        {/* Longitude */}
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-canvas-muted w-8">LON:</span>
          <input
            type="text"
            disabled={disabled}
            value={lon}
            onChange={e => updateCoord(lat, latHem, e.target.value, lonHem)}
            placeholder="004.4777"
            className="flex-1 px-3 py-1.5 text-sm bg-canvas border rounded focus:outline-none focus:border-ocean disabled:opacity-60 font-mono"
          />
          <select
            disabled={disabled}
            value={lonHem}
            onChange={e => updateCoord(lat, latHem, lon, e.target.value as 'E' | 'W')}
            className="px-2 py-1.5 text-sm bg-canvas border rounded font-bold font-mono focus:outline-none"
          >
            <option value="E">E</option>
            <option value="W">W</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-canvas-muted">
        <div className="flex items-center space-x-1 font-mono text-ocean font-medium">
          <Navigation className="w-3.5 h-3.5 text-teal" />
          <span>{lat} {latHem}, {lon} {lonHem}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 text-canvas-muted hover:text-canvas transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-seaGreen" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
