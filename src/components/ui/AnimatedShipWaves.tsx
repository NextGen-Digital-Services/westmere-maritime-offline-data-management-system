import React from 'react';

export const AnimatedShipWaves: React.FC<{ className?: string }> = ({ className = 'h-48' }) => {
  return (
    <div className={`relative w-full overflow-hidden bg-navy ${className}`}>
      {/* Background Star / Sky Elements */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-8 left-1/4 w-1.5 h-1.5 bg-teal rounded-full"></div>
        <div className="absolute top-5 right-20 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-12 right-1/3 w-1.5 h-1.5 bg-signalOrange rounded-full"></div>
      </div>

      <svg
        viewBox="0 0 800 240"
        className="absolute bottom-0 w-full h-full preserve-3d"
        preserveAspectRatio="none"
      >
        <defs>
          <style>{`
            @keyframes waveAnim1 {
              0% { transform: translateX(0); }
              50% { transform: translateX(-40px); }
              100% { transform: translateX(0); }
            }
            @keyframes waveAnim2 {
              0% { transform: translateX(-30px); }
              50% { transform: translateX(10px); }
              100% { transform: translateX(-30px); }
            }
            @keyframes shipPitch {
              0% { transform: translateY(0px) rotate(0deg); }
              25% { transform: translateY(-4px) rotate(1.5deg); }
              50% { transform: translateY(2px) rotate(-1deg); }
              75% { transform: translateY(-3px) rotate(0.8deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }
            .wave-deep { animation: waveAnim1 8s ease-in-out infinite; }
            .wave-light { animation: waveAnim2 6s ease-in-out infinite; }
            .ship-group { animation: shipPitch 5s ease-in-out infinite; transform-origin: 320px 140px; }
          `}</style>
        </defs>

        {/* Back Wave (Deep Ocean) */}
        <path
          className="wave-deep"
          d="M0,170 C150,150 250,190 400,165 C550,140 680,185 850,165 L850,240 L0,240 Z"
          fill="#0D47A1"
        />

        {/* Vessel Illustration */}
        <g className="ship-group">
          {/* Hull */}
          <polygon points="260,145 420,145 395,178 285,178" fill="#1565C0" />
          <polygon points="275,145 410,145 400,158 280,158" fill="#E5484D" />
          {/* Superstructure Bridge */}
          <rect x="330" y="105" width="55" height="40" rx="3" fill="#FFFFFF" />
          {/* Bridge Windows */}
          <rect x="336" y="112" width="10" height="7" rx="1" fill="#0A2540" />
          <rect x="352" y="112" width="10" height="7" rx="1" fill="#0A2540" />
          <rect x="368" y="112" width="10" height="7" rx="1" fill="#0A2540" />
          {/* Cargo Containers */}
          <rect x="290" y="125" width="18" height="20" rx="1" fill="#00A7A7" />
          <rect x="310" y="125" width="18" height="20" rx="1" fill="#FF7A1A" />
          <rect x="290" y="105" width="18" height="19" rx="1" fill="#F5B700" />
          {/* Radar Mast & Beacon */}
          <line x1="365" y1="105" x2="365" y2="82" stroke="#FFFFFF" stroke-width="3" />
          <circle cx="365" cy="80" r="4" fill="#00A7A7" />
          <circle cx="365" cy="80" r="8" fill="#00A7A7" opacity="0.3" />
        </g>

        {/* Front Wave (Teal Ocean) */}
        <path
          className="wave-light"
          d="M-50,180 C120,160 280,205 450,175 C600,150 720,195 900,175 L900,240 L-50,240 Z"
          fill="#00A7A7"
          opacity="0.9"
        />

        {/* Crest Highlights */}
        <path
          d="M0,210 C200,195 380,225 600,205 C720,195 800,215 900,210 L900,240 L0,240 Z"
          fill="#0A2540"
        />
      </svg>
    </div>
  );
};
