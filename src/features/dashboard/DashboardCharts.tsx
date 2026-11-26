import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface ChartProps {
  statusCounts: {
    drafts: number;
    pending: number;
    synced: number;
    failed: number;
    conflict: number;
  };
}

export const DashboardCharts: React.FC<ChartProps> = ({ statusCounts }) => {
  const pieData = [
    { name: 'Synced', value: statusCounts.synced || 1, color: '#1FAF6B' },
    { name: 'Pending', value: statusCounts.pending || 0, color: '#FF7A1A' },
    { name: 'Drafts', value: statusCounts.drafts || 0, color: '#F5B700' },
    { name: 'Failed', value: statusCounts.failed || 0, color: '#E5484D' },
    { name: 'Conflict', value: statusCounts.conflict || 0, color: '#6D4AFF' }
  ].filter(d => d.value > 0);

  const barData = [
    { day: 'Mon', records: 4 },
    { day: 'Tue', records: 6 },
    { day: 'Wed', records: 3 },
    { day: 'Thu', records: 7 },
    { day: 'Fri', records: 5 },
    { day: 'Sat', records: 8 },
    { day: 'Today', records: statusCounts.drafts + statusCounts.pending + 2 }
  ];

  const trendData = [
    { time: '08:00', successRate: 100 },
    { time: '10:00', successRate: 100 },
    { time: '12:00', successRate: 95 },
    { time: '14:00', successRate: 70 },
    { time: '16:00', successRate: 90 },
    { time: '18:00', successRate: 100 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Records Activity Bar Chart */}
      <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col">
        <div className="bg-ocean text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
          <span>Records Created (7 Days)</span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <p className="text-[11px] text-muted mb-2 font-medium">Daily log output across deck and engine</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="day" stroke="#3B4B66" fontSize={11} tickLine={false} />
                <YAxis stroke="#3B4B66" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="records" fill="#1565C0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Breakdown Donut Chart */}
      <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col">
        <div className="bg-teal text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
          <span>Lifecycle Distribution</span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <p className="text-[11px] text-muted mb-2 font-medium">Local Dexie storage allocation by status</p>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sync Success Rate Trend Line */}
      <div className="bg-surface border border-border rounded-lg shadow-solid-sm overflow-hidden flex flex-col">
        <div className="bg-seaGreen text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
          <span>Uplink Success Trend</span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <p className="text-[11px] text-muted mb-2 font-medium">Satellite transmission acknowledgement rate</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="time" stroke="#3B4B66" fontSize={11} tickLine={false} />
                <YAxis stroke="#3B4B66" fontSize={11} domain={[60, 100]} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="successRate" stroke="#1FAF6B" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
