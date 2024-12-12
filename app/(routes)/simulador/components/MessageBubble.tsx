type MessageProps = {
    content: string;
    sender: 'user' | 'bot';
  };
  
  const MessageBubble: React.FC<MessageProps> = ({ content, sender }) => (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex ${sender === 'user' ? 'flex-row-reverse' : ''} items-center`}
      >
        {/* Avatar o iniciales del usuario */}
        <div
          className={`w-8 h-8 rounded-full flex justify-center items-center mr-2 font-bold ${sender === 'user' ? 'bg-[#25D366] text-white' : 'bg-[#ECE5DD] text-[#333]'}`}
        >
          {sender === 'user' ? 'U' : 'B'} {/* 'U' para usuario, 'B' para bot */}
        </div>
        <div
          className={`px-4 py-2 rounded-lg max-w-xs break-words ${
            sender === 'user'
              ? 'bg-[#25D366] text-white' // WhatsApp green for user
              : 'bg-[#ECE5DD] text-[#333]' // Light gray for bot
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
  
  export default MessageBubble;