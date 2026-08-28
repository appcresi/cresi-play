const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="flex flex-row items-end space-x-2 max-w-md">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-gray-400">
          B
        </div>
        <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
