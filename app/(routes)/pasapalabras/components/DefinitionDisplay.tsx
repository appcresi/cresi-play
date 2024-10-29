interface DefinitionDisplayProps {
  definition: string;
}

const DefinitionDisplay: React.FC<DefinitionDisplayProps> = ({ definition }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center max-w-[70%] w-full">
      <p className="text-sm break-words">{definition}</p> {/* Cambia text-lg a text-sm para disminuir el tamaño de letra */}
    </div>
  );
};

export default DefinitionDisplay;

