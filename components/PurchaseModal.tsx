"use client"
import { IconHeartPlus } from '@tabler/icons-react';
import Swal from 'sweetalert2';

const SCORE_STORAGE_KEY = 'totalGameScore';
const LIVES_STORAGE_KEY = 'totalGameLives';
const LIFE_PURCHASE_COST = 200;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  itemName?: string;
  description?: string;
}

const PurchaseModal = ({
  isOpen,
  onClose,
  onPurchase,
  itemName = "vida extra",
  description = "¿Comprar una vida extra?"
}: PurchaseModalProps) => {
  if (!isOpen) return null;

  const currentScore = parseInt(localStorage.getItem(SCORE_STORAGE_KEY) || '0');
  const currentLives = parseInt(localStorage.getItem(LIVES_STORAGE_KEY) || '3');
  const canAfford = currentScore >= 200 && currentLives < 3;

  const handlePurchase = () => {
    if (canAfford) {
      const newScore = currentScore - 200;
      localStorage.setItem(SCORE_STORAGE_KEY, newScore.toString());
      const newLives = Math.min(currentLives + 1, 3);
      localStorage.setItem(LIVES_STORAGE_KEY, newLives.toString());
      onPurchase();
      onClose();
      Swal.fire({
              icon: "success",
              title: "¡Vida Extra Comprada!",
              text: "¡Continúa jugando!",
              showConfirmButton: false,
              timer: 1000
            });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{description}</h2>
        <div className="flex justify-between mb-4">
          <p>Costo: {LIFE_PURCHASE_COST} puntos</p>
          <p>Tus puntos: {currentScore}</p>
        </div>
        {currentLives >= 3 ? (
          <div>
            <p className="text-red-500 mb-4">
              Ya tienes el máximo de vidas
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        ) : canAfford ? (
          <div className="flex gap-4">
            <button
              onClick={handlePurchase}
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
            <p className="text-red-500 mb-4">
              No tienes suficientes puntos para comprar {itemName}
            </p>
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