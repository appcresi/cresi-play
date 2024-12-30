interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen pt-20">
      {/* Puntos decorativos en las esquinas */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#FFD93D] rounded-full border-4 border-black" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#FF6B6B] rounded-full border-4 border-black" />
          
          <div className="bg-white border-8 border-black rounded-2xl 
                         shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                         min-h-[calc(100vh-120px)] p-6 md:p-8
                         transform hover:rotate-0 transition-transform duration-300
                         relative z-10">
            {/* Líneas decorativas en las esquinas */}
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-black" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-black" />
            
            {/* Contenido */}
            <div className="relative z-20">
              {children}
            </div>
          </div>
    </div>
  );
};

export default ChatLayout;