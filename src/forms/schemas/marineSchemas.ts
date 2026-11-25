import { type FormTemplate } from '../types';

export const MARINE_TEMPLATES: Record<string, FormTemplate> = {
  noon_report: {
    id: 'noon_report',
    title: 'Noon Report',
    description: 'Daily 12:00 UTC maritime telemetry, positional fix, distance run, and remaining fuel/water soundings.',
    category: 'Navigation',
    icon: 'Compass',
    sections: [
      {
        title: 'Voyage & Position Fix',
        fields: [
          { id: 'reportDate', label: 'Report Date', type: 'date', required: true, colSpan: 1 },
          { id: 'voyageNumber', label: 'Voyage Number', type: 'text', placeholder: 'e.g. VOY-2026-14', required: true, colSpan: 1 },
          { id: 'coordinates', label: 'Noon Coordinates (Lat / Long)', type: 'coordinates', required: true, colSpan: 2 },
          { id: 'course', label: 'True Course', type: 'number', unit: 'deg', min: 0, max: 360, required: true, colSpan: 1 },
          { id: 'speedOverGround', label: 'Speed Over Ground (SOG)', type: 'number', unit: 'kts', step: 0.1, required: true, colSpan: 1 },
          { id: 'distanceRun24h', label: 'Distance Run (Last 24h)', type: 'number', unit: 'NM', step: 0.1, required: true, colSpan: 1 },
          { id: 'distanceToGo', label: 'Distance to Next Waypoint', type: 'number', unit: 'NM', colSpan: 1 }
        ]
      },
      {
        title: 'Meteo & Sea State',
        fields: [
          {
            id: 'weatherCondition',
            label: 'Weather & Visibility',
            type: 'select',
            required: true,
            options: [
              { label: 'Clear Sky (Vis > 10 NM)', value: 'Clear Sky' },
              { label: 'Partly Cloudy (Vis 5-10 NM)', value: 'Partly Cloudy' },
              { label: 'Overcast / Moderate Swell', value: 'Overcast' },
              { label: 'Dense Fog (Vis < 0.5 NM)', value: 'Fog' },
              { label: 'Gale / Heavy Rain', value: 'Gale' }
            ],
            colSpan: 1
          },
          { id: 'windForceBeaufort', label: 'Wind Force (Beaufort Scale)', type: 'number', unit: 'BF', min: 0, max: 12, required: true, colSpan: 1 },
          {
            id: 'seaState',
            label: 'Sea State',
            type: 'select',
            required: true,
            options: [
              { label: 'Calm (Glassy) 0m', value: 'Calm 0' },
              { label: 'Smooth (Wave 0.1-0.5m)', value: 'Smooth 2' },
              { label: 'Slight (Wave 0.5-1.25m)', value: 'Slight 3' },
              { label: 'Moderate (Wave 1.25-2.5m)', value: 'Moderate 4' },
              { label: 'Rough (Wave 2.5-4m)', value: 'Rough 5' },
              { label: 'Very Rough (Wave 4-6m)', value: 'Very Rough 6' },
              { label: 'High / Phenomenal (>6m)', value: 'High 7' }
            ],
            colSpan: 2
          }
        ]
      },
      {
        title: 'Remaining On Board (ROB) Soundings',
        fields: [
          { id: 'robHfoMetricTons', label: 'ROB VLSFO / HFO', type: 'number', unit: 'MT', step: 0.1, required: true, colSpan: 1 },
          { id: 'robMdoMetricTons', label: 'ROB LSMGO / MDO', type: 'number', unit: 'MT', step: 0.1, required: true, colSpan: 1 },
          { id: 'robFreshWaterTons', label: 'ROB Fresh Water', type: 'number', unit: 'Tons', step: 1, required: true, colSpan: 1 },
          { id: 'robLubOilLiters', label: 'ROB Main Engine Cylinder Oil', type: 'number', unit: 'Liters', step: 50, colSpan: 1 },
          { id: 'remarks', label: 'Master / Officer Remarks', type: 'textarea', placeholder: 'Noteworthy occurrences, propeller slip, ballast transfers...', colSpan: 2 },
          { id: 'officerSignature', label: 'Watch Officer Digital Sign-off', type: 'signature', required: true, colSpan: 2 }
        ]
      }
    ]
  },

  daily_ops: {
    id: 'daily_ops',
    title: 'Daily Operations Log',
    description: '24-hour master watch log, ballast distribution, security condition, and deck activities.',
    category: 'Navigation',
    icon: 'BookOpen',
    sections: [
      {
        title: 'Watch & Condition',
        fields: [
          { id: 'opsDate', label: 'Log Date', type: 'date', required: true, colSpan: 1 },
          { id: 'currentVoyageNumber', label: 'Voyage ID', type: 'text', required: true, colSpan: 1 },
          {
            id: 'navStatus',
            label: 'Navigational Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Underway Using Engine', value: 'Underway Using Engine' },
              { label: 'At Anchor', value: 'At Anchor' },
              { label: 'Moored Alongside Berth', value: 'Moored Alongside' },
              { label: 'Drifting / Awaiting Orders', value: 'Drifting' }
            ],
            colSpan: 1
          },
          {
            id: 'securityLevel',
            label: 'ISPS Security Level',
            type: 'select',
            required: true,
            options: [
              { label: 'MARSEC Level 1 (Normal)', value: 'MARSEC Level 1' },
              { label: 'MARSEC Level 2 (Heightened)', value: 'MARSEC Level 2' },
              { label: 'MARSEC Level 3 (Exceptional)', value: 'MARSEC Level 3' }
            ],
            colSpan: 1
          },
          { id: 'bridgeWatchOfficers', label: 'Watch Officers on Duty', type: 'text', placeholder: 'e.g. Chief Mate Lindholm / 2nd Mate Santos', required: true, colSpan: 2 },
          { id: 'pilotOnBoard', label: 'Maritime Pilot on Bridge', type: 'checkbox', colSpan: 1 },
          { id: 'ballastCondition', label: 'Ballast Tank Condition Summary', type: 'text', placeholder: 'e.g. Departure Ballast (6,200 MT)', colSpan: 2 },
          { id: 'remarks', label: 'Deck Operations Summary', type: 'textarea', colSpan: 2 }
        ]
      }
    ]
  },

  bunker_report: {
    id: 'bunker_report',
    title: 'Bunker / Fuel Consumption Report',
    description: 'Fuel oil and diesel transfer reconciliation, density, flow meter readings, and surveyor sample verification.',
    category: 'Engineering',
    icon: 'Fuel',
    sections: [
      {
        title: 'Bunkering Operations & Verification',
        fields: [
          { id: 'bunkerBargeName', label: 'Bunkering Barge / Terminal Name', type: 'text', required: true, colSpan: 1 },
          {
            id: 'fuelGrade',
            label: 'Bunker Grade',
            type: 'select',
            required: true,
            options: [
              { label: 'VLSFO 0.5% Max Sulfur', value: 'VLSFO 0.5% S' },
              { label: 'ULSFO 0.1% Max Sulfur (ECA Compliant)', value: 'ULSFO 0.1% S' },
              { label: 'LSMGO 0.1% Sulfur', value: 'LSMGO 0.1% S' },
              { label: 'Bio-Fuel B30 Blend', value: 'Bio-Fuel B30' }
            ],
            colSpan: 1
          },
          { id: 'receivedQuantityMt', label: 'Quantity Received (Bdn MT)', type: 'number', unit: 'MT', step: 0.1, required: true, colSpan: 1 },
          { id: 'densityAt15C', label: 'Density at 15°C', type: 'number', unit: 'kg/m³', step: 0.0001, required: true, colSpan: 1 },
          { id: 'viscosityCst', label: 'Kinematic Viscosity (at 50°C)', type: 'number', unit: 'cSt', colSpan: 1 },
          { id: 'flashPointC', label: 'Flash Point', type: 'number', unit: '°C', min: 60, colSpan: 1 },
          { id: 'sampleSeals', label: 'Marpol Sample Seal Numbers', type: 'text', placeholder: 'e.g. BDN-9845-A1, BDN-9845-A2', required: true, colSpan: 2 },
          { id: 'bunkerSurveyor', label: 'Independent Surveyor Company', type: 'text', placeholder: 'e.g. SGS / Bureau Veritas', colSpan: 2 }
        ]
      }
    ]
  },

  engine_log: {
    id: 'engine_log',
    title: 'Engine Room Log',
    description: 'Propulsion machinery telemetry, exhaust temps, generator electrical loads, and auxiliary system status.',
    category: 'Engineering',
    icon: 'Gauge',
    sections: [
      {
        title: 'Main Propulsion & Turbocharger',
        fields: [
          { id: 'mainEngineRpm', label: 'Main Engine Shaft RPM', type: 'number', unit: 'RPM', step: 0.1, required: true, colSpan: 1 },
          { id: 'meShaftPowerKw', label: 'Shaft Power Output', type: 'number', unit: 'kW', step: 10, colSpan: 1 },
          { id: 'turbochargerRpm', label: 'Turbocharger RPM', type: 'number', unit: 'RPM', colSpan: 1 },
          { id: 'scavengeAirPressureBar', label: 'Scavenge Air Pressure', type: 'number', unit: 'bar', step: 0.01, colSpan: 1 },
          { id: 'cylExhaustTempAvgC', label: 'Average Cylinder Exhaust Temp', type: 'number', unit: '°C', colSpan: 1 },
          { id: 'coolingWaterJacketTempC', label: 'Jacket Cooling Water Outlet', type: 'number', unit: '°C', colSpan: 1 }
        ]
      },
      {
        title: 'Auxiliary Power Generation',
        fields: [
          { id: 'gen1LoadKw', label: 'Diesel Generator #1 Output', type: 'number', unit: 'kW', colSpan: 1 },
          { id: 'gen2LoadKw', label: 'Diesel Generator #2 Output', type: 'number', unit: 'kW', colSpan: 1 },
          { id: 'heavyFuelDailyConsumptionMt', label: 'Daily Fuel Consumption', type: 'number', unit: 'MT/day', step: 0.1, required: true, colSpan: 2 }
        ]
      }
    ]
  },

  port_report: {
    id: 'port_report',
    title: 'Port Arrival / Departure Report',
    description: 'Harbour entry/exit telemetry, pilotage, draft measurements forward/aft, and berth all-fast times.',
    category: 'Navigation',
    icon: 'Anchor',
    sections: [
      {
        title: 'Port Movements',
        fields: [
          { id: 'portName', label: 'Port Name & UN/LOCODE', type: 'text', placeholder: 'e.g. Rotterdam (NL RTM)', required: true, colSpan: 1 },
          { id: 'berthNumber', label: 'Terminal / Berth Quay #', type: 'text', required: true, colSpan: 1 },
          { id: 'pilotBoardedTime', label: 'Pilot On-Board Time (UTC)', type: 'text', placeholder: '14:30 UTC', required: true, colSpan: 1 },
          { id: 'allFastTime', label: 'All Fast Moored Time (UTC)', type: 'text', placeholder: '16:45 UTC', required: true, colSpan: 1 },
          { id: 'draftForwardM', label: 'Arrival Draft Forward', type: 'number', unit: 'm', step: 0.01, required: true, colSpan: 1 },
          { id: 'draftAftM', label: 'Arrival Draft Aft', type: 'number', unit: 'm', step: 0.01, required: true, colSpan: 1 },
          { id: 'tugsEmployed', label: 'Number of Tugs Employed', type: 'number', min: 0, max: 6, colSpan: 1 },
          { id: 'portAgentName', label: 'Nominated Port Agency', type: 'text', colSpan: 1 }
        ]
      }
    ]
  },

  cargo_ops: {
    id: 'cargo_ops',
    title: 'Cargo Operations Report',
    description: 'Loading and discharging log, hatch covers status, lashing surveys, and crane productivity tracking.',
    category: 'Commercial',
    icon: 'Package',
    sections: [
      {
        title: 'Cargo Handling Details',
        fields: [
          { id: 'cargoType', label: 'Cargo Type / Commodity', type: 'text', required: true, colSpan: 1 },
          { id: 'dischargedUnits', label: 'Units Discharged', type: 'number', min: 0, required: true, colSpan: 1 },
          { id: 'loadedUnits', label: 'Units Loaded', type: 'number', min: 0, required: true, colSpan: 1 },
          { id: 'damagedUnits', label: 'Damaged / Discrepancy Units', type: 'number', min: 0, colSpan: 1 },
          { id: 'craneStoppagesMinutes', label: 'Crane Idle Time / Stoppages', type: 'number', unit: 'mins', colSpan: 1 },
          { id: 'lashingInspectionsPassed', label: 'Lashing & Twistlock Inspection Passed', type: 'checkbox', colSpan: 1 },
          { id: 'supervisingStevedore', label: 'Chief Stevedore / Terminal Supervisor', type: 'text', colSpan: 2 }
        ]
      }
    ]
  },

  safety_drill: {
    id: 'safety_drill',
    title: 'Safety Drill Report',
    description: 'SOLAS mandatory onboard safety drills: Fire, Abandon Ship, Enclosed Space Entry, and Oil Spill.',
    category: 'Safety',
    icon: 'ShieldAlert',
    sections: [
      {
        title: 'Drill Execution & Muster',
        fields: [
          {
            id: 'drillType',
            label: 'Drill Category',
            type: 'select',
            required: true,
            options: [
              { label: 'Fire Drill (Engine Room)', value: 'Fire Drill (Engine Room)' },
              { label: 'Abandon Ship Drill', value: 'Abandon Ship Drill' },
              { label: 'Enclosed Space Entry & Rescue', value: 'Enclosed Space Rescue' },
              { label: 'SOPEP Marine Oil Pollution Response', value: 'SOPEP Oil Pollution' },
              { label: 'Man Overboard (MOB) Boat Drill', value: 'Man Overboard' }
            ],
            colSpan: 1
          },
          { id: 'musterStation', label: 'Muster Station Location', type: 'text', required: true, colSpan: 1 },
          { id: 'durationMinutes', label: 'Total Drill Duration', type: 'number', unit: 'minutes', min: 5, required: true, colSpan: 1 },
          { id: 'crewPresentCount', label: 'Crew Members Mustered', type: 'number', min: 1, required: true, colSpan: 1 },
          { id: 'scbaSetsTested', label: 'SCBA Breathing Apparatus Tested', type: 'number', min: 0, colSpan: 1 },
          { id: 'gasDetectorReadings', label: 'Multi-Gas Meter Calibrated Readings', type: 'text', placeholder: 'O2: 20.9%, H2S: 0ppm, LEL: 0%, CO: 0ppm', colSpan: 2 },
          { id: 'drillOutcome', label: 'Drill Critique & Debrief Comments', type: 'textarea', required: true, colSpan: 2 }
        ]
      }
    ]
  },

  incident_report: {
    id: 'incident_report',
    title: 'Incident / Near-Miss Report',
    description: 'ISM Code compliant near-miss, injury, environmental or machinery breakdown root-cause log.',
    category: 'Safety',
    icon: 'AlertTriangle',
    sections: [
      {
        title: 'Incident Classification',
        fields: [
          {
            id: 'incidentCategory',
            label: 'Incident Classification',
            type: 'select',
            required: true,
            options: [
              { label: 'Near-Miss Hazard Observation', value: 'Near-Miss' },
              { label: 'First Aid Medical Injury', value: 'First Aid' },
              { label: 'Machinery Breakdown / Blackout', value: 'Machinery Breakdown' },
              { label: 'Mooring / Line Handling Hazard', value: 'Mooring / Line Handling' },
              { label: 'Cargo / Chemical Spill', value: 'Chemical Spill' }
            ],
            colSpan: 1
          },
          {
            id: 'riskSeverity',
            label: 'Risk Severity Matrix',
            type: 'select',
            required: true,
            options: [
              { label: 'Low (Minor observation, no injury)', value: 'Low' },
              { label: 'Medium (High potential, immediate fix)', value: 'Medium' },
              { label: 'High (Lost time injury or major outage)', value: 'High' },
              { label: 'Critical (Severe threat to vessel/crew)', value: 'Critical' }
            ],
            colSpan: 1
          },
          { id: 'locationOnBoard', label: 'Exact Location Onboard', type: 'text', required: true, colSpan: 2 },
          { id: 'summary', label: 'Description of Sequence of Events', type: 'textarea', required: true, colSpan: 2 },
          { id: 'immediateActionTaken', label: 'Immediate Corrective Action Taken', type: 'textarea', required: true, colSpan: 2 }
        ]
      }
    ]
  },

  work_order: {
    id: 'work_order',
    title: 'Maintenance / Work Order',
    description: 'Planned maintenance system (PMS) job record, spare parts inventory deduction, and sign-off.',
    category: 'Engineering',
    icon: 'Wrench',
    sections: [
      {
        title: 'Maintenance Specifications',
        fields: [
          { id: 'equipmentTag', label: 'Equipment Tag / PMS Code', type: 'text', placeholder: 'e.g. ME-BLR-01', required: true, colSpan: 1 },
          { id: 'machinerySystem', label: 'Machinery Subsystem', type: 'text', required: true, colSpan: 1 },
          {
            id: 'priority',
            label: 'Job Priority',
            type: 'select',
            required: true,
            options: [
              { label: 'Routine PMS Inspection', value: 'Routine' },
              { label: 'High Priority Overhaul', value: 'High' },
              { label: 'Emergency Breakdown Repair', value: 'Emergency' }
            ],
            colSpan: 1
          },
          { id: 'hoursWorked', label: 'Technician Labor Hours', type: 'number', unit: 'hrs', step: 0.5, colSpan: 1 },
          { id: 'sparesConsumed', label: 'Spare Parts Consumed (Part No. & Qty)', type: 'textarea', placeholder: 'e.g. Filter cartridge #2x, O-ring gasket set', colSpan: 2 },
          { id: 'testedUnderPressure', label: 'Tested Under Working Pressure', type: 'checkbox', colSpan: 1 },
          { id: 'signOffChiefEngineer', label: 'Chief Engineer Authorizing Officer', type: 'text', required: true, colSpan: 2 }
        ]
      }
    ]
  },

  crew_change: {
    id: 'crew_change',
    title: 'Crew Change Report',
    description: 'STCW endorsements, passport, seaman book records, fit-for-duty medicals, and shipboard familiarization.',
    category: 'Crew',
    icon: 'Users',
    sections: [
      {
        title: 'Seafarer Documentation',
        fields: [
          { id: 'signingOnName', label: 'Full Seafarer Name', type: 'text', required: true, colSpan: 1 },
          {
            id: 'rank',
            label: 'Shipboard Rank / Position',
            type: 'select',
            required: true,
            options: [
              { label: 'Master / Captain', value: 'Master' },
              { label: 'Chief Officer', value: 'Chief Officer' },
              { label: 'Second Officer', value: 'Second Officer' },
              { label: 'Chief Engineer', value: 'Chief Engineer' },
              { label: 'Second Engineer', value: 'Second Engineer' },
              { label: 'Bosun', value: 'Bosun' },
              { label: 'Able Seaman (AB)', value: 'Able Seaman' },
              { label: 'Chief Cook', value: 'Chief Cook' }
            ],
            colSpan: 1
          },
          { id: 'nationality', label: 'Nationality', type: 'text', required: true, colSpan: 1 },
          { id: 'seamanBookNumber', label: 'Seaman Discharge Book Number', type: 'text', required: true, colSpan: 1 },
          { id: 'fitForDutyCertificateValid', label: 'Valid STCW ENG1 Medical Certificate on File', type: 'checkbox', colSpan: 1 },
          { id: 'familiarizationChecklistCompleted', label: 'SOLAS Shipboard Safety Familiarization Checklist Completed', type: 'checkbox', colSpan: 1 }
        ]
      }
    ]
  }
};
