"use client"; 
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ChatLayout from './ChatLayout';
import MessageBubble from './MessageBubble';
import ResponseButtons from './ResponseButtons';

const ChatSimulator: React.FC = () => {
  const [messages, setMessages] = useState<{ content: string; sender: 'user' | 'bot' }[]>([
    { content: 'Hola, ¿puedes decirme dónde vives?', sender: 'bot' },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledAnswers, setShuffledAnswers] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [isSimulatorComplete, setIsSimulatorComplete] = useState(false);

  const questions = [
    {
        question: 'Oye, eres muy genial. ¿En qué escuela estudias? Mis papás dicen que conocer nuevos amigos es bueno.',
        correctAnswer: 'No es necesario que sepas a qué escuela voy para ser amigos.',
        answers: [
            { text: 'No es necesario que sepas a qué escuela voy para ser amigos.' },
            { text: 'Estudio en la escuela del centro.' },
        ],
    },
    {
        question: 'Me gustaría ser tu mejor amigo. ¿Podemos intercambiar números para hablar por WhatsApp?',
        correctAnswer: 'Mis papás no me dejan compartir mi número de teléfono.',
        answers: [
            { text: 'Mis papás no me dejan compartir mi número de teléfono.' },
            { text: 'Claro, mi número es +54 9 11 12345678.' },
        ],
    },
    {
        question: 'Tengo un juego súper divertido online. ¿Quieres que nos hagamos amigos en el juego? Solo necesito saber tu nombre completo.',
        correctAnswer: 'Me gusta que mis amigos me llamen Tita.',
        answers: [
            { text: 'Me gusta que mis amigos me llamen Tita.' },
            { text: 'Me llamo María Pérez.' },
        ],
    },
    {
        question: 'Mi cumpleaños es el próximo mes. ¿Quieres ver una foto de mi fiesta? Seguro te gustaría ver cómo festejo.',
        correctAnswer: 'No tengo espacio en mi computadora para descargar fotos.',
        answers: [
            { text: 'No tengo espacio en mi computadora para descargar fotos.' },
            { text: 'Sí, me encantaría ver tu foto.' },
        ],
    },
    {
        question: 'Somos amigos, ¿verdad? Mis papás siempre dicen que cuente con mis amigos. ¿Dónde vives? Me gustaría visitarte.',
        correctAnswer: 'Por ahora es mejor que sigamo hablando por acá.',
        answers: [
            { text: 'Por ahora es mejor que sigamo hablando por acá.' },
            { text: 'Vivo cerca del parque.' },
        ],
    },
    {
        question: 'Tengo un secreto bien cool. Si me dices dónde estudias, te lo cuento. ¿Trato?',
        correctAnswer: 'No es necesario que te diga donde vivo, para que me cuentes un secreto.',
        answers: [
            { text: 'No es necesario que te diga donde vivo, para que me cuentes un secreto.' },
            { text: 'Bueno, cuéntame.' },
        ],
    },
    {
        question: 'Mi primo tiene una consola nueva. ¿Quieres ver una foto? Solo necesito tu Facebook para compartirla.',
        correctAnswer: 'No tengo redes sociales.',
        answers: [
            { text: 'No tengo redes sociales.' },
            { text: 'Claro, mi Facebook es mariaperez.' },
        ],
    },
    {
        question: 'Jugamos a ser mejores amigos secretos. Para eso, necesito saber todo sobre ti. ¿Cómo se llama tu mamá?',
        correctAnswer: 'No voy a compartir información personal.',
        answers: [
            { text: 'No voy a compartir información personal.' },
            { text: 'Bueno, ¿qué quieres saber?' },
        ],
    },
    {
        question: 'Mi hermana dice que es importante conocer gente nueva. ¿Podemos hacer una videollamada para ser amigos?',
        correctAnswer: 'No haré videollamadas con desconocidos',
        answers: [
            { text: 'No haré videollamadas con desconocidos.' },
            { text: 'Podría ser divertido.' },
        ],
    },
    {
        question: 'Tengo muchas fotos geniales de mis vacaciones. ¿Quieres que te las envíe? Solo tienes que decirme tu correo.',
        correctAnswer: 'No compartiré mi correo electrónico',
        answers: [
            { text: 'No compartiré mi correo electrónico.' },
            { text: 'Sí, mi correo es mariaperez@cresi.com' },
        ],
    },
    {
        question: 'Somos casi mejores amigos. Todavía no conozco a tu familia. ¿Me muestras una foto de tu familia?',
        correctAnswer: 'No tengos fotos de mi familia ahora',
        answers: [
            { text: 'No tengos fotos de mi familia ahora' },
            { text: 'Claro, te la envío.' },
        ],
    },
    {
        question: 'Estoy aburrido. Juguemos a que nos contamos todo. ¿Me dices tu edad y dónde vives?',
        correctAnswer: 'No voy a compartir información personal',
        answers: [
            { text: 'No voy a compartir información personal.' },
            { text: 'Tengo 10 años y vivo en Escobar.' },
        ],
    },
    {
        question: 'Mi tío trabaja en una empresa de videojuegos. Si me das tu información, te puedo conseguir juegos gratis.',
        correctAnswer: 'No caeré en trucos para obtener información',
        answers: [
            { text: 'No caeré en trucos para obtener información.' },
            { text: 'Genial, mi dirección es Av. Siempre Viva 151.' },
        ],
    },
    {
        question: 'Tengo un grupo secreto de WhatsApp. Para entrar, necesito que me des tu número.',
        correctAnswer: 'No puedo compartir mi número de teléfono.',
        answers: [
            { text: 'No puedo compartir mi número de teléfono.' },
            { text: 'Bueno, mi número es +54 9 11 12345678' },
        ],
    }
];

  useEffect(() => {
    const answers = questions[currentQuestionIndex]?.answers || [];
    setShuffledAnswers(shuffleArray(answers));
  }, [currentQuestionIndex]);

  const shuffleArray = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const handleResponse = (response: string) => {
    const correctAnswer = questions[currentQuestionIndex].correctAnswer;

    if (response === correctAnswer) {
      setScore(prevScore => prevScore + 10);
      Swal.fire({
        title: '¡Correcto!',
        text: `¡Has dado la respuesta correcta! +10 puntos. Puntuación total: ${score + 10}`,
        icon: 'success',
        confirmButtonText: 'Genial',
      });
    } else {
      Swal.fire({
        title: '¡Cuidado!',
        text: 'Podrías estar dando información importante a un desconocido. Mantén siempre tu privacidad.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
    }

    setMessages((prev) => [...prev, { content: response, sender: 'user' }]);

    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setMessages((prev) => [
        ...prev,
        { content: questions[nextQuestionIndex].question, sender: 'bot' },
      ]);
    } else {
      setIsSimulatorComplete(true);
      setMessages((prev) => [
        ...prev,
        { 
          content: `Gracias por completar el simulador. Recuerda: tu seguridad en línea es importante. Puntuación final: ${score + 10} puntos.`, 
          sender: 'bot' 
        },
      ]);
    }
  };

  const resetSimulator = () => {
    setMessages([{ content: 'Hola, ¿puedes decirme dónde vives?', sender: 'bot' }]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsSimulatorComplete(false);
  };

  return (
      <ChatLayout>
        {messages.map((msg, index) => (
          <MessageBubble key={index} content={msg.content} sender={msg.sender} />
        ))}
        {!isSimulatorComplete ? (
          <ResponseButtons
            options={shuffledAnswers.map((answer) => ({
              text: answer.text,
              onClick: () => handleResponse(answer.text),
            }))}
          />
        ) : (
          <div className="flex flex-col items-center">
            <p className="mb-4 text-lg font-semibold">Puntuación final: {score + 10} puntos</p>
            <button 
              onClick={resetSimulator}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Reiniciar Simulador
            </button>
          </div>
        )}
      </ChatLayout>
  );
};

export default ChatSimulator;