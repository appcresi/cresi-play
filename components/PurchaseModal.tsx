"use client"
import { IconHeartPlus, IconX } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import UserDataManager from '@/lib/userDataManager';

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

  const userData = UserDataManager.loadUserData();
  const currentScore = userData.game.totalScore;
  const currentLives = userData.game.totalLives;
  const canAfford = currentScore >= LIFE_PURCHASE_COST && currentLives < 3;

  const handlePurchase = () => {
    if (!canAfford) return;

    const updatedUserData = { ...userData };
    updatedUserData.game.totalScore = currentScore - LIFE_PURCHASE_COST;
    updatedUserData.game.totalLives = Math.min(currentLives + 1, 3);

    UserDataManager.saveUserData(updatedUserData);
    onPurchase();
    onClose();

    toast.success('¡Vida extra comprada! Continuá jugando.', { duration: 2000 });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          aria-label="Cerrar"
        >
          <IconX size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <IconHeartPlus size={28} className="text-red-500" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{description}</h2>
            <p className="text-gray-500 text-sm">
              Cuesta {LIFE_PURCHASE_COST} puntos · tenés {currentScore}
            </p>
          </div>

          {currentLives >= 3 ? (
            <div className="w-full pt-1">
              <p className="text-amber-600 text-sm mb-4">Ya tenés el máximo de vidas.</p>
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          ) : canAfford ? (
            <div className="flex gap-3 w-full pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700
                         text-white font-semibold rounded-full transition"
              >
                <IconHeartPlus size={18} />
                Comprar
              </button>
            </div>
          ) : (
            <div className="w-full pt-1">
              <p className="text-red-500 text-sm mb-4">
                No tenés suficientes puntos para comprar {itemName}.
              </p>
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;