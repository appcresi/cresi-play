interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen pt-20">
            {/* Contenido */}
            <div className="relative z-20">
              {children}
            </div>
    </div>
  );
};

export default ChatLayout;