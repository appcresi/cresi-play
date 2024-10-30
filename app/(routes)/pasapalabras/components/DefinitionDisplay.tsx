interface DefinitionDisplayProps {
  definition: string;
}

const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({ definition }) => {
  return (
    <div className="text-center bg-white  p-6 border-2 border-violet-600 rounded-lg mt-4">
      <p className="text-xl font-semibold text-violet-800 break-words">{definition}</p>
    </div>


  );
};

export default DefinitionDisplay;

