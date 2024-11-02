interface DefinitionDisplayProps {
  definition: string;
}

const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({ definition }) => {
  return (
    <div className="flex flex-col items-center">
      <p className="text-xl font-semibold text-violet-800 break-words">{definition}</p>
    </div>


  );
};

export default DefinitionDisplay;

