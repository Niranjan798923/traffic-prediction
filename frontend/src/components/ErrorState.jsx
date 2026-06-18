export default function ErrorState({ message, onRetry }) {
  return (
    <div className="glass-card p-8 text-center animate-fade-in">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h3>
      <p className="text-gray-400 mb-6">{message || 'Unable to load data. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Retry
        </button>
      )}
    </div>
  );
}
