type ResponseButtonsProps = { 
    options: { text: string; onClick: () => void }[];
  };
  
  const ResponseButtons: React.FC<ResponseButtonsProps> = ({ options }) => (
    <div className="flex flex-col space-y-2 mt-6">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={option.onClick}
          className="flex items-center px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition duration-200"
        >
          <div className="w-8 h-8 bg-white text-[#25D366] rounded-full flex justify-center items-center mr-4 font-bold">
            {String.fromCharCode(65 + index)} {/* Letras A, B, C, etc. */}
          </div>
          {option.text}
        </button>
      ))}
    </div>
  );
  
  export default ResponseButtons;
  