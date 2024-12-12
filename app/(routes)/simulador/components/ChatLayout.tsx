import React from 'react';
const ChatLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div 
    className="flex flex-col items-center p-5 h-[80vh] bg-[#F0F0F0]"
    aria-label="Simulador de Prevención de Grooming"
  >
    <div 
      className="w-full max-w-lg bg-white rounded-lg shadow-md p-6 overflow-auto"
      role="region"
      aria-live="polite"
    >
      <div className="flex flex-col space-y-4">
        {children}
      </div>
    </div>
  </div>
);

export default ChatLayout;