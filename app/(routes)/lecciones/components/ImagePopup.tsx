import { useState } from "react";

type ImagePopupProps = {
  imageUrl: string;
  onClose: () => void;
};

const ImagePopup = ({ imageUrl, onClose }: ImagePopupProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="relative bg-white border-8 border-black rounded-xl p-4 transform rotate-1" style={{ boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)' }}>
        <button
          className="absolute -top-6 -right-6 bg-red-400 w-12 h-12 rounded-full border-4 border-black font-comic text-xl font-bold transform rotate-12 hover:scale-110 transition-transform"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
          onClick={onClose}
        >
          ×
        </button>
        <img 
          src={imageUrl} 
          alt="Enlarged view" 
          className="max-w-[80vw] max-h-[80vh] rounded-lg border-4 border-black"
        />
      </div>
    </div>
  );
};