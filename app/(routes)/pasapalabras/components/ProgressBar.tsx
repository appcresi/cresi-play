import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total }) => {
  return (
    <div className="flex flex-col items-center">
      <p className="font-medium text-lg">Palabras</p>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className='flex items-center justify-center absolute inset-0 text-2xl font-semibold'>
          {progress}/{total}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;