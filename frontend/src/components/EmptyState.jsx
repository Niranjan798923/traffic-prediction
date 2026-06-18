export default function EmptyState({ icon = '📭', title, message }) {
  return (
    <div className="glass-card p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
