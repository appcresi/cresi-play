interface DefinitionDisplayProps {
  definition: string;
}

const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({ definition }) => {
  return (
    <div className="flex flex-col items-center text-sm sm:text-xs md:text-base">
      <p className="text-lg sm:text-base md:text-lg font-semibold text-violet-800 break-words">{definition}</p>
    </div>
  );
};

export default DefinitionDisplay;

