import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { getVisualizationData } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];
const HEATMAP_COLORS = ['#0a1628', '#0e3a5c', '#1565a0', '#1e88c7', '#06b6d4', '#f59e0b', '#ef4444'];

function getHeatColor(value, maxVal) {
  if (!value || maxVal === 0) return HEATMAP_COLORS[0];
  const ratio = value / maxVal;
  const idx = Math.min(Math.floor(ratio * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1);
  return HEATMAP_COLORS[idx];
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm">
      <p className="text-gray-300 font-medium">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-accent-cyan">
          {p.name || p.dataKey}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

function HeatmapChart({ data }) {
  if (!data?.length) return null;

  const sources = [...new Set(data.map((d) => d.source))];
  const destinations = [...new Set(data.map((d) => d.destination))];
  const maxVol = Math.max(...data.map((d) => d.volume));

  const lookup = {};
  data.forEach((d) => {
    lookup[`${d.source}|${d.destination}`] = d.volume;
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex">
          <div className="w-28 shrink-0" />
          {destinations.map((dst) => (
            <div key={dst} className="w-20 shrink-0 text-center text-[10px] text-gray-400 pb-2 truncate px-1" title={dst}>
              {dst.split(' ')[0]}
            </div>
          ))}
        </div>
        {sources.map((src) => (
          <div key={src} className="flex items-center mb-1">
            <div className="w-28 shrink-0 text-xs text-gray-400 truncate pr-2" title={src}>{src}</div>
            {destinations.map((dst) => {
              const vol = lookup[`${src}|${dst}`] || 0;
              return (
                <div
                  key={`${src}-${dst}`}
                  className="w-20 h-8 shrink-0 mx-0.5 rounded flex items-center justify-center text-[10px] font-medium transition-transform hover:scale-110 cursor-default"
                  style={{ backgroundColor: getHeatColor(vol, maxVol), color: vol > maxVol * 0.5 ? '#fff' : '#94a3b8' }}
                  title={`${src} → ${dst}: ${vol}`}
                >
                  {vol > 0 ? Math.round(vol) : ''}
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <span className="text-xs text-gray-500">Low</span>
          {HEATMAP_COLORS.map((c, i) => (
            <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-xs text-gray-500">High</span>
        </div>
      </div>
    </div>
  );
}

export default function Visualization() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: vizData } = await getVisualizationData();
      setData(vizData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load visualization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner text="Loading visualizations..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Traffic <span className="gradient-text">Visualization</span>
        </h1>
        <p className="text-gray-400">Interactive analytics from real Bangalore traffic dataset</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">1. Traffic by Hour</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.traffic_by_hour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="hour_label" stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avg_volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg Volume" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">2. Traffic by Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.traffic_by_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="avg_volume" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} name="Avg Volume" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">3. Congestion by Area</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.congestion_by_area?.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis type="number" stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="area" stroke="#64748b" fontSize={10} width={100} tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avg_volume" fill="#ec4899" radius={[0, 4, 4, 0]} name="Avg Volume" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">4. Traffic Distribution Histogram</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="range" stroke="#64748b" fontSize={9} tick={{ fill: '#94a3b8' }} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">5. Route Popularity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.route_popularity}
                dataKey="count"
                nameKey="route"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ route, percent }) => `${route.split(' → ').map(s => s.split(' ')[0]).join('→')} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={9}
              >
                {data.route_popularity?.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="glass-card px-4 py-3 text-sm max-w-xs">
                      <p className="text-gray-300">{payload[0].name}</p>
                      <p className="text-accent-cyan">{payload[0].value} trips</p>
                    </div>
                  ) : null
                }
              />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">6. Traffic Heatmap</h2>
          <HeatmapChart data={data.heatmap} />
        </div>
      </div>
    </div>
  );
}
