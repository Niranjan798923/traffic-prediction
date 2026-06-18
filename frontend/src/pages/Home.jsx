import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import { getStatistics } from '../api/client';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const GRADIENT_COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm">
      <p className="text-gray-300 font-medium">{label}</p>
      <p className="text-accent-cyan">{payload[0].value?.toLocaleString()} avg volume</p>
    </div>
  );
};

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getStatistics();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  const features = [
    { icon: '🤖', title: 'ML-Powered Predictions', desc: 'Random Forest model trained on 15,000+ Bangalore traffic records' },
    { icon: '⚡', title: 'Real-Time Analysis', desc: 'Instant congestion scoring and travel time estimation' },
    { icon: '📍', title: '30+ Locations', desc: 'Coverage across major Bangalore corridors and tech hubs' },
    { icon: '📈', title: 'Interactive Analytics', desc: 'Deep dive into traffic patterns with rich visualizations' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Smart Bangalore <span className="gradient-text">Traffic Dashboard</span>
        </h1>
        <p className="text-gray-400">AI-powered traffic congestion prediction for Bangalore city</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Dataset Records"
          value={stats.dataset_records?.toLocaleString()}
          subtitle="Historical traffic data points"
          icon="📊"
          gradient="from-accent-cyan to-blue-500"
        />
        <StatCard
          title="Model Accuracy"
          value={`${(stats.model_accuracy * 100).toFixed(1)}%`}
          subtitle={`R² Score: ${stats.model_accuracy?.toFixed(4)}`}
          icon="🎯"
          gradient="from-accent-green to-emerald-500"
        />
        <StatCard
          title="Routes Covered"
          value={stats.routes_covered?.toLocaleString()}
          subtitle="Unique source-destination pairs"
          icon="🛣️"
          gradient="from-accent-purple to-violet-500"
        />
        <StatCard
          title="Historical Predictions"
          value={stats.historical_predictions?.toLocaleString()}
          subtitle="Predictions made this session"
          icon="🔮"
          gradient="from-accent-pink to-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Peak Traffic Hours</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.peak_hours}>
              <defs>
                <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="hour_label" stroke="#64748b" fontSize={11} tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" fontSize={11} tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avg_volume" stroke="#06b6d4" fill="url(#hourGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Traffic Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.traffic_distribution}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
              >
                {stats.traffic_distribution?.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="glass-card px-4 py-3 text-sm">
                      <p className="text-gray-300">{payload[0].name}</p>
                      <p className="text-accent-cyan">{payload[0].value?.toLocaleString()} records</p>
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {stats.traffic_distribution?.map((d, i) => (
              <div key={d.category} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-gray-400">{d.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Top Congested Areas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.top_congested_areas} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
            <XAxis type="number" stroke="#64748b" fontSize={11} tick={{ fill: '#94a3b8' }} />
            <YAxis type="category" dataKey="area" stroke="#64748b" fontSize={11} width={120} tick={{ fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg_volume" radius={[0, 6, 6, 0]}>
              {stats.top_congested_areas?.map((_, i) => (
                <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Platform <span className="gradient-text">Features</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card-hover p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Model Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-xl bg-dark-700/50">
            <p className="text-sm text-gray-400 mb-1">MAE</p>
            <p className="text-2xl font-bold text-accent-cyan">{stats.mae?.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Mean Absolute Error</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-dark-700/50">
            <p className="text-sm text-gray-400 mb-1">RMSE</p>
            <p className="text-2xl font-bold text-accent-purple">{stats.rmse?.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Root Mean Square Error</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-dark-700/50">
            <p className="text-sm text-gray-400 mb-1">R² Score</p>
            <p className="text-2xl font-bold text-accent-green">{stats.model_accuracy?.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Coefficient of Determination</p>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 border-t border-white/10">
        <p className="text-gray-500 text-sm">
          Smart Bangalore Traffic Prediction System &copy; {new Date().getFullYear()}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Built with React, Flask, and Scikit-Learn Random Forest
        </p>
      </footer>
    </div>
  );
}
