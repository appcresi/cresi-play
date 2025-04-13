import { useState } from "react";
import { IconSearch } from '@tabler/icons-react';

interface StorySearchProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

const StorySearch = ({ onSearch, initialValue = "" }: StorySearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onSearch(newValue);
  };

  return (
    <div className="mb-8 max-w-2xl mx-auto">
      <div className="bg-white border-4 border-black rounded-xl p-4 flex gap-4 items-center transform -rotate-1"
        style={{ boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)' }}>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar historias..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`
              w-full
              p-3
              bg-white
              border-4 border-black
              rounded-lg
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              transition-all duration-200
              placeholder:text-gray-500
              focus:outline-none
              focus:translate-x-1 
              focus:translate-y-1
              focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              focus:border-blue-500
              font-comic
              text-lg
            `}
          />
          <IconSearch 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={24}
          />
        </div>
      </div>
    </div>
  );
};

export default StorySearch;