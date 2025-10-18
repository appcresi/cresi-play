import React, { useState } from "react";
import { IconVolume2, IconVolumeOff } from "@tabler/icons-react"; // Usa la librería de íconos que prefieres

interface FloatingAudioButtonProps {
  text: string; // Texto que se leerá
}

const FloatingAudioButton: React.FC<FloatingAudioButtonProps> = ({ text }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel(); // Detener la lectura
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false); // Marcar como no hablando al terminar
      window.speechSynthesis.speak(utterance); // Iniciar la lectura
      setIsSpeaking(true);
    }
  };

  return (
    <button
      onClick={handleToggleSpeech}
      className={`fixed bottom-4 left-4 p-4 rounded-full shadow-lg transition-all ${
        isSpeaking
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-gray-400 text-gray-200 cursor-not-allowed"
      }`}
      aria-label={isSpeaking ? "Detener lectura" : "Leer texto"}
    >
      {isSpeaking ? <IconVolume2 size={24} /> : <IconVolumeOff size={24} />}
    </button>
  );
};

export default FloatingAudioButton;
