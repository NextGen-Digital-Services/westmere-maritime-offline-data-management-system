import { clientDb, type User, type Vessel, type RecordItem, type SyncLog, type NotificationItem, type AppSettings, type AttachmentMeta, type AttachmentBlobChunk } from './clientDb';
import { serverMockDb, type ServerRecord } from './serverMockDb';

export const SEED_VESSELS: Vessel[] = [
  {
    id: 'vessel-1',
    name: 'MV Westmere Voyager',
    imoNumber: 'IMO 9845231',
    flag: 'Panama (PA)',
    type: 'Container Ship',
    callSign: '3FOE4',
    dwt: 68000,
    yearBuilt: 2021,
    isActive: true
  },
  {
    id: 'vessel-2',
    name: 'MV Atlantic Pioneer',
    imoNumber: 'IMO 9734120',
    flag: 'Liberia (LR)',
    type: 'Bulk Carrier',
    callSign: 'ELQW7',
    dwt: 82000,
    yearBuilt: 2018,
    isActive: true
  },
  {
    id: 'vessel-3',
    name: 'MV Pacific Horizon',
    imoNumber: 'IMO 9912048',
    flag: 'Singapore (SG)',
    type: 'Chemical Tanker',
    callSign: '9V8341',
    dwt: 49000,
    yearBuilt: 2023,
    isActive: true
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'user-crew',
    email: 'crew@seasync.demo',
    name: 'Able Seaman John Reyes',
    role: 'Crew',
    vesselId: 'vessel-1',
    lastLoginAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'user-officer',
    email: 'officer@seasync.demo',
    name: 'Chief Officer Sarah Lindholm',
    role: 'Officer',
    vesselId: 'vessel-1',
    lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'user-master',
    email: 'master@seasync.demo',
    name: 'Captain Erik Dahl',
    role: 'Master',
    vesselId: 'vessel-1',
    lastLoginAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'user-admin',
    email: 'admin@seasync.demo',
    name: 'Fleet Ops Director Marcus Vance',
    role: 'Shore Admin',
    vesselId: 'vessel-1',
    lastLoginAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'global-settings',
  serverUrl: 'https://api.seasync.westmere.io/v1',
  syncIntervalSeconds: 30,
  wifiOnly: false,
  storageAlertThresholdPercent: 80,
  theme: 'light',
  language: 'en'
};

export async function initializeDatabaseSeed() {
  const userCount = await clientDb.users.count();
  if (userCount > 0) return; // Already seeded

  // 1. Seed Vessels
  await clientDb.vessels.bulkAdd(SEED_VESSELS);

  // 2. Seed Users
  await clientDb.users.bulkAdd(SEED_USERS);

  // 3. Seed Settings
  await clientDb.settings.put(DEFAULT_SETTINGS);

  // 4. Seed Realistic Operational Records (25 items)
  const now = Date.now();
  const seedRecords: RecordItem[] = [
    {
      id: 'rec-001',
      title: 'Noon Report - North Sea Transit (Day 4)',
      formType: 'noon_report',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * 5).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * 5).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * 5 + 12000).toISOString(),
      data: {
        reportDate: new Date(now - 86400000 * 5).toISOString().split('T')[0],
        latitude: '54.2150 N',
        longitude: '003.4510 E',
        course: 242,
        speedOverGround: 14.8,
        distanceRun24h: 355.2,
        weatherCondition: 'Overcast, Moderate Swell',
        windForceBeaufort: 5,
        seaState: 'State 4 (Rough)',
        robHfoMetricTons: 642.5,
        robMdoMetricTons: 88.2,
        robFreshWaterTons: 145.0,
        remarks: 'All main propulsion parameters within optimal ranges. Fuel flow meters calibrated.'
      }
    },
    {
      id: 'rec-002',
      title: 'Bunker Operations - Rotterdam Eemhaven',
      formType: 'bunker_report',
      vesselId: 'vessel-1',
      createdBy: 'user-master',
      authorName: 'Captain Erik Dahl',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * 4).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * 4).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * 4 + 15000).toISOString(),
      data: {
        bunkerBargeName: 'Barge VT Dordrecht',
        fuelGrade: 'VLSFO 0.5% S',
        densityAt15C: 0.9412,
        receivedQuantityMt: 450.0,
        viscosityCst: 280,
        flashPointC: 72,
        bunkerStartTime: '08:00',
        bunkerEndTime: '14:30',
        sampleSeals: 'BDN-9845-A1, BDN-9845-A2',
        bunkerSurveyor: 'SGS Maritime Marine Surveyors'
      }
    },
    {
      id: 'rec-003',
      title: 'Daily Operations Log - English Channel Crossing',
      formType: 'daily_ops',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * 3).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * 3).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * 3 + 8000).toISOString(),
      data: {
        opsDate: new Date(now - 86400000 * 3).toISOString().split('T')[0],
        currentVoyageNumber: 'VOY-2026-08',
        bridgeWatchOfficers: 'Lindholm, Reyes',
        navStatus: 'Underway Using Engine',
        securityLevel: 'MARSEC Level 1',
        pilotOnBoard: false,
        ballastCondition: 'Departure Ballast (6,200 MT)'
      }
    },
    {
      id: 'rec-004',
      title: 'Engine Room 24h Telemetry Log',
      formType: 'engine_log',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * 2).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * 2).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * 2 + 11000).toISOString(),
      data: {
        mainEngineRpm: 88.4,
        meShaftPowerKw: 14200,
        turbochargerRpm: 12400,
        scavengeAirPressureBar: 2.45,
        cylExhaustTempAvgC: 382,
        lubOilInletTempC: 45.2,
        coolingWaterJacketTempC: 84.1,
        gen1LoadKw: 650,
        gen2LoadKw: 720,
        heavyFuelDailyConsumptionMt: 28.6
      }
    },
    {
      id: 'rec-005',
      title: 'Safety Drill - Enclosed Space Entry & Rescue',
      formType: 'safety_drill',
      vesselId: 'vessel-1',
      createdBy: 'user-master',
      authorName: 'Captain Erik Dahl',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * 2).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * 2).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * 2 + 7000).toISOString(),
      data: {
        drillType: 'Enclosed Space Rescue',
        musterStation: 'Cargo Hold No. 3 Hatch Coaming',
        durationMinutes: 28,
        crewPresentCount: 19,
        scbaSetsTested: 3,
        gasDetectorReadings: 'O2: 20.9%, H2S: 0ppm, LEL: 0%, CO: 0ppm',
        drillOutcome: 'Satisfactory - Rescue stretcher rigged and extracted victim in under 7 minutes.'
      }
    },
    {
      id: 'rec-006',
      title: 'Port Arrival Report - Port of Antwerp',
      formType: 'port_report',
      vesselId: 'vessel-1',
      createdBy: 'user-master',
      authorName: 'Captain Erik Dahl',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * 1).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * 1).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * 1 + 9000).toISOString(),
      data: {
        portName: 'Antwerp (BE ANR)',
        berthNumber: 'Quay 1742',
        pilotBoardedTime: '11:15 UTC',
        allFastTime: '13:40 UTC',
        draftForwardM: 10.45,
        draftAftM: 11.20,
        tugsEmployed: 2,
        portAgentName: 'Wilhelmsen Ship Services Belgium'
      }
    },
    {
      id: 'rec-007',
      title: 'Cargo Operations - Hold #2 & #4 Discharging',
      formType: 'cargo_ops',
      vesselId: 'vessel-1',
      createdBy: 'user-crew',
      authorName: 'Able Seaman John Reyes',
      status: 'Pending Sync',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 7200000).toISOString(),
      clientUpdatedAt: new Date(now - 7200000).toISOString(),
      data: {
        cargoType: 'ISO 20ft & 40ft High Cube Containers',
        dischargedUnits: 342,
        loadedUnits: 180,
        damagedUnits: 0,
        craneStoppagesMinutes: 15,
        lashingInspectionsPassed: true,
        supervisingStevedore: 'DP World Terminal Lead'
      }
    },
    {
      id: 'rec-008',
      title: 'Maintenance Work Order - Aux Boiler Burner Overhaul',
      formType: 'work_order',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Pending Sync',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 5400000).toISOString(),
      clientUpdatedAt: new Date(now - 5400000).toISOString(),
      data: {
        equipmentTag: 'ME-BLR-01',
        machinerySystem: 'Steam Generation & Heating',
        priority: 'High',
        sparesConsumed: 'Atomizer tip nozzle #4, Electrode set, Flame scanner seal ring',
        hoursWorked: 5.5,
        testedUnderPressure: true,
        signOffChiefEngineer: 'Eng. K. Van Dijk'
      }
    },
    {
      id: 'rec-009',
      title: 'Incident / Near-Miss - Mooring Line Whiplash Risk',
      formType: 'incident_report',
      vesselId: 'vessel-1',
      createdBy: 'user-crew',
      authorName: 'Able Seaman John Reyes',
      status: 'Pending Sync',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 3600000).toISOString(),
      clientUpdatedAt: new Date(now - 3600000).toISOString(),
      data: {
        incidentCategory: 'Mooring / Line Handling',
        riskSeverity: 'Medium (High Potential)',
        locationOnBoard: 'Poop Deck Stern Winch #2',
        summary: 'Spring line surged against fairlead during tug wash. Crew member stepped out of snapback zone just prior.',
        immediateActionTaken: 'Line slacked slightly, snapback hazard area repainted with non-skid yellow border.'
      }
    },
    {
      id: 'rec-010',
      title: 'Crew Change Report - 2nd Engineer Sign-On',
      formType: 'crew_change',
      vesselId: 'vessel-1',
      createdBy: 'user-master',
      authorName: 'Captain Erik Dahl',
      status: 'Pending Sync',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 1800000).toISOString(),
      clientUpdatedAt: new Date(now - 1800000).toISOString(),
      data: {
        signingOnName: 'Mateo Rossi',
        rank: 'Second Engineer',
        nationality: 'Italian',
        seamanBookNumber: 'IT-98214-B',
        fitForDutyCertificateValid: true,
        familiarizationChecklistCompleted: true
      }
    },
    {
      id: 'rec-011',
      title: 'Noon Report - Bay of Biscay Inbound (Draft)',
      formType: 'noon_report',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Draft',
      version: 1,
      isDraft: true,
      isLocked: false,
      clientCreatedAt: new Date(now - 900000).toISOString(),
      clientUpdatedAt: new Date(now - 300000).toISOString(),
      data: {
        reportDate: new Date().toISOString().split('T')[0],
        latitude: '46.1280 N',
        longitude: '007.8920 W',
        course: 198,
        speedOverGround: 15.2,
        robHfoMetricTons: 590.0,
        remarks: 'Autosaved draft during watch handover. Awaiting final engine sounding.'
      }
    },
    {
      id: 'rec-012',
      title: 'Daily Operations Log - In Port Cargo Watch (Draft)',
      formType: 'daily_ops',
      vesselId: 'vessel-1',
      createdBy: 'user-crew',
      authorName: 'Able Seaman John Reyes',
      status: 'Draft',
      version: 1,
      isDraft: true,
      isLocked: false,
      clientCreatedAt: new Date(now - 600000).toISOString(),
      clientUpdatedAt: new Date(now - 120000).toISOString(),
      data: {
        opsDate: new Date().toISOString().split('T')[0],
        navStatus: 'Moored Alongside',
        remarks: 'Cargo lashing inspection in progress on Bay 14 to 22.'
      }
    },
    {
      id: 'rec-013',
      title: 'Fuel Bunker Reconciliation - Failed Validation',
      formType: 'bunker_report',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Failed',
      version: 1,
      isDraft: false,
      isLocked: false,
      clientCreatedAt: new Date(now - 14400000).toISOString(),
      clientUpdatedAt: new Date(now - 14400000).toISOString(),
      lastSyncError: 'Payload rejected: Missing certified Bunker Delivery Note (BDN) surveyor seal.',
      data: {
        bunkerBargeName: 'Barge VT Dordrecht',
        fuelGrade: 'VLSFO 0.5%',
        receivedQuantityMt: 450.0,
        sampleSeals: ''
      }
    },
    {
      id: 'rec-014',
      title: 'Engine Room Cylinder Pressure Balance',
      formType: 'engine_log',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Failed',
      version: 1,
      isDraft: false,
      isLocked: false,
      clientCreatedAt: new Date(now - 28800000).toISOString(),
      clientUpdatedAt: new Date(now - 28800000).toISOString(),
      lastSyncError: 'Network timeout: Uplink severed during chunk transmission.',
      data: {
        mainEngineRpm: 89.1,
        gen1LoadKw: 680,
        remarks: 'Transmitted while vessel entered satellite shadow cone.'
      }
    },
    {
      id: 'rec-015',
      title: 'Noon Report - Version Conflict Notice',
      formType: 'noon_report',
      vesselId: 'vessel-1',
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Conflict',
      version: 2,
      isDraft: false,
      isLocked: false,
      clientCreatedAt: new Date(now - 43200000).toISOString(),
      clientUpdatedAt: new Date(now - 10800000).toISOString(),
      serverUpdatedAt: new Date(now - 7200000).toISOString(),
      data: {
        reportDate: new Date(now - 43200000).toISOString().split('T')[0],
        latitude: '49.1240 N',
        longitude: '004.8920 W',
        course: 210,
        speedOverGround: 14.2,
        robHfoMetricTons: 610.0,
        remarks: 'Client updated ROB from soundings; shore desk updated distance based on AIS telemetry.'
      }
    }
  ];

  // Add 10 additional historical synced records for fleet richness
  for (let i = 16; i <= 25; i++) {
    const daysAgo = i - 10;
    seedRecords.push({
      id: `rec-0${i}`,
      title: `Voyage Log Record #${1000 + i} - Historic Archive`,
      formType: i % 2 === 0 ? 'noon_report' : 'daily_ops',
      vesselId: i % 3 === 0 ? 'vessel-2' : (i % 3 === 1 ? 'vessel-1' : 'vessel-3'),
      createdBy: 'user-officer',
      authorName: 'Chief Officer Sarah Lindholm',
      status: 'Synced',
      version: 1,
      isDraft: false,
      isLocked: true,
      clientCreatedAt: new Date(now - 86400000 * daysAgo).toISOString(),
      clientUpdatedAt: new Date(now - 86400000 * daysAgo).toISOString(),
      serverUpdatedAt: new Date(now - 86400000 * daysAgo + 10000).toISOString(),
      data: {
        reportDate: new Date(now - 86400000 * daysAgo).toISOString().split('T')[0],
        distanceRun24h: 360 + (i * 2),
        speedOverGround: 14.5,
        weatherCondition: 'Good visibility, calm sea'
      }
    });
  }

  await clientDb.records.bulkAdd(seedRecords);

  // 5. Populate serverMockDb with the synced server records and one conflict
  const serverRecords: ServerRecord[] = seedRecords
    .filter(r => r.status === 'Synced' || r.status === 'Conflict')
    .map(r => ({
      id: r.id,
      title: r.title,
      formType: r.formType,
      vesselId: r.vesselId,
      createdBy: r.createdBy,
      authorName: r.authorName,
      status: 'Synced',
      data: r.id === 'rec-015' 
        ? { ...r.data, speedOverGround: 15.6, remarks: 'SHORE OVERRIDE: AIS calculated speed is 15.6 kts.' }
        : r.data,
      version: r.id === 'rec-015' ? 3 : r.version,
      serverCreatedAt: r.clientCreatedAt,
      serverUpdatedAt: r.serverUpdatedAt || new Date().toISOString()
    }));

  await serverMockDb.serverRecords.bulkAdd(serverRecords);

  // 6. Seed Sample Attachments (Tiny valid Blobs)
  const samplePdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xd0, 0xd4, 0xc5, 0xd8, 0x0a, 
    0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 
    0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 
    0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a
  ]);
  const sampleBlob = new Blob([samplePdfBytes], { type: 'application/pdf' });

  const seedAttachment: AttachmentMeta = {
    id: 'att-001',
    recordId: 'rec-002',
    fileName: 'Bunker_Delivery_Note_BDN_9845.pdf',
    fileType: 'application/pdf',
    fileSize: sampleBlob.size,
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploadedBy: 'user-master',
    vesselId: 'vessel-1',
    status: 'Synced',
    uploadedChunks: 1,
    totalChunks: 1,
    uploadProgress: 100,
    createdAt: new Date(now - 86400000 * 4).toISOString(),
    updatedAt: new Date(now - 86400000 * 4).toISOString()
  };

  const seedBlobChunk: AttachmentBlobChunk = {
    id: 'att-001_chunk_0',
    attachmentId: 'att-001',
    chunkIndex: 0,
    totalChunks: 1,
    chunkBlob: sampleBlob
  };

  await clientDb.attachments.put(seedAttachment);
  await clientDb.attachmentBlobs.put(seedBlobChunk);

  // 7. Seed Past Sync Logs
  const seedSyncLogs: SyncLog[] = [
    {
      id: 'synclog-1',
      timestamp: new Date(now - 86400000 * 3).toISOString(),
      durationMs: 1420,
      recordsPushed: 6,
      recordsPulled: 2,
      attachmentsPushed: 1,
      status: 'SUCCESS'
    },
    {
      id: 'synclog-2',
      timestamp: new Date(now - 86400000 * 1).toISOString(),
      durationMs: 890,
      recordsPushed: 4,
      recordsPulled: 1,
      attachmentsPushed: 0,
      status: 'SUCCESS'
    },
    {
      id: 'synclog-3',
      timestamp: new Date(now - 14400000).toISOString(),
      durationMs: 2450,
      recordsPushed: 0,
      recordsPulled: 0,
      attachmentsPushed: 0,
      status: 'FAILED',
      errorDetails: 'Satellite uplink dropped during TLS handshake'
    }
  ];
  await clientDb.syncLogs.bulkAdd(seedSyncLogs);

  // 8. Seed Notifications
  const seedNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'Storage Capacity Healthy',
      message: 'IndexedDB persistent storage allocation verified. 2.4 MB in use.',
      type: 'info',
      isRead: true,
      createdAt: new Date(now - 86400000).toISOString()
    },
    {
      id: 'notif-2',
      title: 'Version Conflict Detected',
      message: 'Record #rec-015 Noon Report was modified on shore while offline.',
      type: 'warning',
      isRead: false,
      link: '/conflicts',
      createdAt: new Date(now - 7200000).toISOString()
    },
    {
      id: 'notif-3',
      title: 'Sync Queue Pending',
      message: '4 operational logs waiting for satellite connection.',
      type: 'info',
      isRead: false,
      link: '/sync',
      createdAt: new Date(now - 1800000).toISOString()
    }
  ];
  await clientDb.notifications.bulkAdd(seedNotifications);
}
