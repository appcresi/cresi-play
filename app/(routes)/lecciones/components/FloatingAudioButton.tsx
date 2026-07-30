import React, { useState } from "react";
import { IconVolume2, IconVolumeOff } from "@tabler/icons-react";
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('lecciones')?.color ?? '#1976D2';

interface FloatingAudioButtonProps {
  text: string;
}

const FloatingAudioButton: React.FC<FloatingAudioButtonProps> = ({ text }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Antes el botón se veía gris con cursor "no disponible" cuando NO
  // estaba leyendo — justo el estado en el que tocarlo SÍ hace algo
  // (arranca la lectura). El botón nunca estuvo realmente deshabilitado,
  // solo se veía así por error. Ahora el estado "listo para leer" se ve
  // claramente clickeable, y el estado "leyendo" se distingue con un
  // color de alerta suave (para indicar "tocá de nuevo para detener").
  return (
    <button
      onClick={handleToggleSpeech}
      className="fixed bottom-4 left-4 p-4 rounded-full shadow-lg transition-all hover:scale-105"
      style={{
        backgroundColor: isSpeaking ? '#DC2626' : ACCENT,
        color: 'white',
      }}
      aria-label={isSpeaking ? "Detener lectura" : "Leer texto en voz alta"}
      title={isSpeaking ? "Detener lectura" : "Leer texto en voz alta"}
    >
      {isSpeaking ? <IconVolume2 size={24} /> : <IconVolumeOff size={24} />}
    </button>
  );
};

export default FloatingAudioButton;