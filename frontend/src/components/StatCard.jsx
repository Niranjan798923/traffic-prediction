export default function StatCard({ title, value, subtitle, icon, gradient = 'from-accent-cyan to-accent-purple' }) {
  return (
    <div className="glass-card-hover p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
