import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/prediction', label: 'Traffic Prediction', icon: '🚗' },
  { path: '/visualization', label: 'Visualization', icon: '📊' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-dark-800/95 backdrop-blur-xl border-r border-white/10 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-xl">
              🚦
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">Smart Bangalore</h1>
              <p className="text-xs text-gray-400">Traffic Prediction</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 text-white border border-accent-cyan/30 shadow-lg shadow-accent-cyan/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-1">Powered by</p>
            <p className="text-sm font-semibold text-accent-cyan">Random Forest ML</p>
            <p className="text-xs text-gray-500 mt-1">Real-time congestion analysis</p>
          </div>
        </div>
      </aside>
    </>
  );
}
