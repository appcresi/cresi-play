import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total }) => {
  return (
    <div className="my-4">
      <div className="bg-gray-200 rounded-full">
        <div
          className="bg-blue-500 rounded-full h-2"
          style={{ width: `${(progress / total) * 100}%` }}
        />
      </div>
      <p className="text-center">{progress} de {total} palabras</p>
    </div>
  );
};

export default ProgressBar;