import { IconHeartPlus } from '@tabler/icons-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  canAfford: boolean;
  cost: number;
  itemName?: string;
  description?: string;
}

const PurchaseModal = ({ 
  isOpen, 
  onClose, 
  onPurchase, 
  canAfford, 
  cost,
  itemName = "vida extra",
  description = "¿Comprar una vida extra?"
}: PurchaseModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{description}</h2>
        <p className="mb-4">Costo: {cost} puntos</p>
        {canAfford ? (
          <div className="flex gap-4">
            <button
              onClick={onPurchase}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <IconHeartPlus size={20} />
              Comprar
            </button>
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-red-500 mb-4">No tienes suficientes puntos para comprar {itemName}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;