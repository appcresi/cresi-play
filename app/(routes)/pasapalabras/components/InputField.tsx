import React, { useState } from 'react';
import { IconArrowNarrowRight, IconHelp, IconBounceRightFilled } from '@tabler/icons-react';

interface InputFieldProps {
  onSubmit: (value: string) => void;
  onPass: () => void;
  onHelp: () => void;
}

const InputField: React.FC<InputFieldProps> = ({ onSubmit, onPass, onHelp }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputValue);
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="text-center my-4">
      <div className="flex items-center justify-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full max-w-md"
          placeholder="Ingresa tu respuesta"
        />
      </div>
      
      {/* Contenedor de botones alineados debajo del input */}
      <div className="flex justify-center mt-2 space-x-2">
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded flex items-center justify-center"
          title="Ingresar palabra"
        >
          <IconArrowNarrowRight size={18} />
        </button>
        <button
          type="button"
          onClick={onHelp}
          className="bg-yellow-500 text-white p-2 rounded flex items-center justify-center"
          title="Ayuda cantidad de letras."
        >
          <IconHelp size={18} />
        </button>
        <button
          type="button"
          onClick={onPass}
          className="bg-gray-500 text-white p-2 rounded flex items-center justify-center"
          title="Pasar palabra."
        >
          <IconBounceRightFilled size={18} />
        </button>
      </div>

      {/* Leyenda de cantidad de caracteres */}
      <p className="mt-2 text-sm text-gray-500">
        Caracteres ingresados: {inputValue.length}
      </p>
    </form>

  );
};

export default InputField;
