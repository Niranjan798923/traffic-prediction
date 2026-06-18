export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-accent-cyan/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-cyan animate-spin" />
      </div>
      {text && <p className="text-gray-400 text-sm animate-pulse">{text}</p>}
    </div>
  );
}
