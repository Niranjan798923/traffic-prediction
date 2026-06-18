import { useEffect, useState } from 'react';
import { getLocations, predictTraffic } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const categoryColors = {
  Low: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', text: 'text-green-400', emoji: '🟢' },
  Medium: { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', emoji: '🟡' },
  Heavy: { bg: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-400', emoji: '🔴' },
};

function ResultCard({ label, value, unit, icon, delay = 0 }) {
  return (
    <div
      className="glass-card p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function Prediction() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    holiday: 'No',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    getLocations()
      .then(({ data }) => {
        setLocations(data.locations || []);
        if (data.locations?.length >= 2) {
          setForm((f) => ({
            ...f,
            source: data.locations[0],
            destination: data.locations[1],
          }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setPageLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source || !form.destination) {
      setFormError('Please select both source and destination');
      return;
    }
    if (form.source === form.destination) {
      setFormError('Source and destination must be different');
      return;
    }

    setLoading(true);
    setResult(null);
    setFormError(null);

    try {
      const { data } = await predictTraffic(form);
      setResult(data);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner text="Loading locations..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const catStyle = result ? categoryColors[result.traffic_category] || categoryColors.Medium : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Traffic <span className="gradient-text">Prediction</span>
        </h1>
        <p className="text-gray-400">Predict traffic congestion for any Bangalore route</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Source Location</label>
            <select name="source" value={form.source} onChange={handleChange} className="input-field" required>
              <option value="">Select source</option>
              {locations.map((loc) => (
                <option key={`src-${loc}`} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Destination Location</label>
            <select name="destination" value={form.destination} onChange={handleChange} className="input-field" required>
              <option value="">Select destination</option>
              {locations.map((loc) => (
                <option key={`dst-${loc}`} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} className="input-field" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Holiday Status</label>
            <div className="flex gap-4">
              {['No', 'Yes'].map((val) => (
                <label
                  key={val}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    form.holiday === val
                      ? 'border-accent-cyan/50 bg-accent-cyan/10 text-white'
                      : 'border-white/10 bg-dark-700/50 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="holiday"
                    value={val}
                    checked={form.holiday === val}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {val === 'Yes' ? '🎉 Holiday' : '📅 Regular Day'}
                </label>
              ))}
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {formError}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Traffic...
            </>
          ) : (
            <>🔮 Predict Traffic</>
          )}
        </button>
      </form>

      {loading && (
        <div className="glass-card p-12">
          <LoadingSpinner size="lg" text="Running ML prediction model..." />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className={`glass-card p-8 bg-gradient-to-br ${catStyle.bg} ${catStyle.border} border-2 animate-glow`}>
            <div className="text-center">
              <span className="text-5xl mb-4 block">{catStyle.emoji}</span>
              <p className="text-sm text-gray-400 mb-1">Traffic Volume</p>
              <p className="text-5xl font-bold text-white mb-2">{result.traffic_volume?.toLocaleString()}</p>
              <p className={`text-xl font-semibold ${catStyle.text}`}>
                {result.traffic_category} Traffic
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard label="Traffic Category" value={result.traffic_category} icon="🚦" delay={100} />
            <ResultCard label="Congestion Score" value={result.congestion_score} unit="/ 100" icon="📊" delay={200} />
            <ResultCard label="Est. Travel Time" value={result.estimated_travel_time} unit="min" icon="⏱️" delay={300} />
            <ResultCard label="Confidence" value={`${result.prediction_confidence}%`} icon="🎯" delay={400} />
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Route Details</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-green" />
                <span className="text-gray-300">{result.source}</span>
              </div>
              <span className="text-gray-500">→</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-pink" />
                <span className="text-gray-300">{result.destination}</span>
              </div>
              <span className="text-gray-500 ml-auto text-sm">
                {result.date} at {result.time} {result.holiday === 'Yes' ? '(Holiday)' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
