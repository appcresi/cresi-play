import React from 'react';

const ComicBurst = ({ text, className }: { text: string; className: string }) => (
  <div className={`absolute transform ${className}`}>
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path 
          d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
          fill="#FF6B6B" 
          stroke="black" 
          strokeWidth="2" 
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs">
        {text}
      </span>
    </div>
  </div>
);

type ResponseButtonsProps = { 
  options: { text: string; onClick: () => void }[];
};

const ResponseButtons: React.FC<ResponseButtonsProps> = ({ options }) => {
  const colors = ['#4ADE80', '#FF6B6B', '#FFD93D', '#87CEEB'];

  return (
    <div className="flex flex-col space-y-4 mt-8 relative px-4">
      <ComicBurst text="¡POW!" className="top-0 -right-4 rotate-12" />
      {options.map((option, index) => (
        <div key={index} className="relative group">
          {/* Sombra y fondo del botón */}
          <button
            onClick={option.onClick}
            className={`
              w-full flex items-center px-6 py-4
              bg-white rounded-lg
              border-4 border-black
              shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
              transform transition-all duration-300
              hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              relative
            `}
            style={{
              backgroundColor: colors[index % colors.length]
            }}
          >
            {/* Puntos decorativos */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border-2 border-black" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full border-2 border-black" />

            {/* Círculo con letra */}
            <div 
              className="w-10 h-10 bg-white rounded-full 
                         border-4 border-black
                         flex justify-center items-center 
                         mr-4 font-black text-xl
                         transform group-hover:rotate-12 transition-transform"
              style={{
                textShadow: '1px 1px 0 #000'
              }}
            >
              {String.fromCharCode(65 + index)}
            </div>

            {/* Texto del botón */}
            <span className="font-black text-lg text-white"
                  style={{
                    textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  }}>
              {option.text}
            </span>
          </button>
        </div>
      ))}
      <ComicBurst text="¡ZAP!" className="bottom-0 -left-4 -rotate-12" />
    </div>
  );
};

export default ResponseButtons;