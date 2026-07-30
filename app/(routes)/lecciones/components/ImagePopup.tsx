type ImagePopupProps = {
  imageUrl: string;
  onClose: () => void;
};

const ImagePopup = ({ imageUrl, onClose }: ImagePopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-2xl border border-gray-100 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-3 -right-3 bg-white w-9 h-9 rounded-full border border-gray-200 shadow-md
                   flex items-center justify-center text-gray-600 text-xl font-bold hover:bg-gray-50 transition-colors"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt="Imagen ampliada"
          className="max-w-[80vw] max-h-[80vh] rounded-lg"
        />
      </div>
    </div>
  );
};

export default ImagePopup;