import React from 'react';

type MessageProps = {
  content: string;
  sender: 'user' | 'bot';
};

const ComicSpike = ({ className }: { className: string }) => (
  <div className={`absolute w-4 h-4 ${className}`}>
    <svg viewBox="0 0 16 16" className="w-full h-full">
      <path
        d="M0 0 L16 8 L0 16 Z"
        fill="currentColor"
        stroke="black"
        strokeWidth="1"
      />
    </svg>
  </div>
);

const MessageBubble: React.FC<MessageProps> = ({ content, sender }) => {
  const isUser = sender === 'user';
  const colors = {
    user: {
      bg: '#4ADE80',
      text: 'white',
      avatarBg: '#FF6B6B'
    },
    bot: {
      bg: '#FFE5E5',
      text: 'black',
      avatarBg: '#FFD93D'
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : ''} items-end relative`}>
        {/* Avatar con estilo cómic */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full border-4 border-black 
                       flex justify-center items-center font-black text-lg
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       transform hover:scale-110 transition-all duration-300
                       ${isUser ? 'bg-[#FF6B6B]' : 'bg-[#FFD93D]'} 
                       text-white`}
            style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
            }}
          >
            {isUser ? 'U' : 'B'}
          </div>
        </div>

        {/* Burbuja de mensaje con estilo cómic */}
        <div className={`relative mx-4 max-w-xs`}>
          <div
            className={`relative px-6 py-3 rounded-lg
                       border-4 border-black
                       shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                       transform hover:scale-105 hover:rotate-1 transition-all duration-300
                       ${isUser ? 'bg-[#4ADE80]' : 'bg-[#FFE5E5]'}`}
          >
            {/* Pico de la burbuja */}
            <ComicSpike 
              className={`${
                isUser 
                  ? '-right-7 rotate-0' 
                  : '-left-7 rotate-180'
              } bottom-4 text-[${isUser ? '#4ADE80' : '#FFE5E5'}]`}
            />
            
            {/* Texto del mensaje */}
            <p className={`font-bold text-lg break-words
                          ${isUser ? 'text-white' : 'text-black'}`}>
              {content}
            </p>

            {/* Efecto de puntos decorativos */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border-2 border-black" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full border-2 border-black" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;