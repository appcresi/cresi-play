"use client"
import React, { useState, useEffect } from 'react';
import {
  IconStar
} from "@tabler/icons-react";
import ComicBurst from '@/components/ComicBurst';

type Lesson = {
  text: string;
  extraWords: string[];
};

type GameLevel = {
  title: string;
  lecciones: Lesson[];
};

type Word = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type Blank = {
  id: string;
  correctWord: string;
  filledWord?: string;
  filledWordId?: string;
};

const gameLevels: GameLevel[] = [
  {
    title: "Pubertad",
    lecciones: [
      {
        text: "La pubertad marca el fin de la {niñez}, y nos damos cuenta porque experimentamos grandes {cambios} tanto {físicos}, como {emocionales} y psicológicos. Y para qué se dan tantos cambios, para alcanzar la capacidad de {reproducirnos}. En las {mujeres}, los cambios más importantes son: Crecimiento de los {senos}, aparición del {vello corporal}, aumento del {sudor}, los {ovarios} comienzan a {ovular} y con eso aparecerá la {menstruación}. En los {varones}, los cambios que se dan son: {Crecimiento} de los testículos y el pene, aparición del {vello corporal}, aumento del {sudor}, cambios en la {voz}, los {testículos} empezarán a producir {espermatozoides} y con eso aparecerá la {eyaculación}.",
        extraWords: ['adolescencia', 'hormonas', 'madurez']
      },
      {
        text: "Esta es una etapa de muchos cambios {hormonales}, por lo que esto te puede afectar de manera {emocional}, quizás experimentes cambios {repentinos} de humor, o te encuentres {irritable} fácilmente, empezar a sentir {atracción} erótico-afectiva por otras personas. También comenzarás a cuestionar las {órdenes} de sus padres y desear más {libertad}.",
        extraWords: ['confusión', 'adolescentes', 'pubertad']
      },
      {
        text: "Entre los cambios físicos que nombramos aparecieron dos palabras que quizás no conocías: {eyaculación} y {menstruación}. Para hablar de {eyaculación} conviene que empecemos viendo cómo está formado el {aparato sexual masculino}. Está formado por {órganos internos} y externos. Los principales {órganos externos} son los {testículos}, el {epidídimo} y el {pene}. Los {testículos} se alojan en el {escroto}. Las estructuras internas son los {conductos deferentes} y glándulas como la {próstata}.",
        extraWords: ['sistema', 'genitales', 'fertilidad']
      },
      {
        text: "Al llegar la {adolescencia}, los {testículos} comienzan a producir {espermatozoides}, para lo cual necesitan estar a una temperatura menor a la {corporal}, por eso están alojados en el {escroto}. Cuando se produce una {estimulación sexual}, los {espermatozoides} viajan por los {conductos deferentes}. A su vez, las {vesículas seminales} y la {próstata} se contraen, expulsando el {semen} que se combina con los {espermatozoides} y viajan por la {uretra}. Al llegar al {orgasmo}, o al punto de mayor {tensión sexual}, el semen es expulsado a través del {pene} hacia afuera, produciendo la {eyaculación}.",
        extraWords: ['madurez', 'reproducción', 'testosterona']
      },
      {
        text: "La {menstruación} recibe muchos nombres como el {periodo}, la {regla}, hasta a veces por {vergüenza} escuchamos decir 'me vino' o 'me indispuse'. Como nos gusta llamar las cosas por su {nombre}, acá le diremos {menstruación}. Antes de seguir, conozcamos primero el {aparato sexual femenino}. Podemos diferenciar dos partes: una externa que es la más {visible} y otra interna que no se puede ver a simple vista.",
        extraWords: ['vagina', 'óvulo', 'ciclo']
      },
      {
        text: "En la parte externa podemos diferenciar la {vulva}, formada por los labios {internos} y {externos}. El {clítoris}, del cual hablaremos más adelante cuando veamos el tema del {placer}. Además, hay varios {orificios}, entre ellos, el orificio de la {uretra} por donde sale la {orina}, y el orificio de la {vagina} por donde sale la {menstruación}.",
        extraWords: ['hormonas', 'pubertad', 'ovulación']
      }
    ]
  },
  {
    title: "Sexualidad",
    lecciones: [
      {
        text: "La sexualidad humana de acuerdo con la Organización Mundial de la Salud (OMS) se define como: 'Un aspecto central del ser humano, presente a lo largo de su vida. Abarca al {sexo}, las {identidades} y los {papeles} de género, el {erotismo}, el {placer}, la {intimidad}, la {reproducción} y la orientación sexual.'",
        extraWords: ["genitalidad", "cromosomas", "conductas"]
      },
      {
        text: "Desde la {fecundación} entre el {óvulo} y el {espermatozoide} se va determinando nuestro {sexo}. Es una condición biológica determinada y transmitida genéticamente.",
        extraWords: ["género", "identidad", "intimidad"]
      },
      {
        text: "La {genitalidad} es el conjunto de órganos sexuales {externos} de una persona, es decir, los órganos que se encuentran en la región {pélvica} y que sirven para la {reproducción}.",
        extraWords: ["internos", "placeres", "papeles"]
      },
      {
        text: "El {género} se refiere a la manera en que la {sociedad} cree que tenemos que vernos, pensar y actuar como {niñas} y mujeres, y {niños} y hombres.",
        extraWords: ["órganos", "intimidad", "sexo"]
      },
      {
        text: "La identidad de {género} es cómo te sientes en tu {interior} y cómo expresas tu género a través de tu manera de {vestir}, de {comportarte} y de tu apariencia personal.",
        extraWords: ["sexo", "placer", "externos"]
      },
      {
        text: "La orientación {sexual} es la {atracción} romántica y/o sexual que una persona siente hacia otras personas. Hay muchas orientaciones sexuales diferentes, como la {heterosexualidad}, la {homosexualidad} y la {bisexualidad}.",
        extraWords: ["identidades", "intimidad", "género"]
      },
      {
        text: "Hemos visto que la {genitalidad} es el conjunto de órganos sexuales {externos}, la {sexualidad} es la capacidad de sentir y expresar deseo sexual, {placer} y amor, el {sexo} es una categoría biológica asignada al nacer.",
        extraWords: ["reproducción", "identidad", "papeles"]
      },
      {
        text: "El {género} es una categoría {social} y {cultural} asignada en función del sexo, la {identidad} de género es la forma en que una persona se siente y se expresa como hombre, mujer, ambos o ninguno de ellos.",
        extraWords: ["atracción", "internos", "conductas"]
      },
      {
        text: "Es importante recordar que estos conceptos no son mutuamente {excluyentes} y que cada persona es {única} y tiene derecho a ser {respetada} y {valorada} por quien es.",
        extraWords: ["internos", "externos", "atracción"]
      }
    ]
  },
  {
    title: "Planificación Familiar",
    lecciones: [
      {
        text: "A partir de la {adolescencia}, con la maduración de los {ovarios} que ya pueden liberar óvulos, y de los {testículos} que ya producen espermatozoides, existe la posibilidad de que se produzcan embarazos.",
        extraWords: ["hormonas", "óvulo", "barrera"]
      },
      {
        text: "Aunque el cuerpo ya esté preparado para un {embarazo}, también se requiere una maduración {emocional} y {psicológica} que nos permita afrontar con responsabilidad la tarea de tener una {familia}.",
        extraWords: ["temporal", "anticonceptivo", "barrera"]
      },
      {
        text: "La planificación {familiar} es cuando las personas deciden {cuándo} quieren tener hijos y cómo hacerlo de manera segura y {responsable}, cuidando la {salud} de los integrantes de la pareja.",
        extraWords: ["testículos", "hormonales", "definitivos"]
      },
      {
        text: "Hay muchos {métodos} anticonceptivos diferentes que pueden ayudar a {postergar} un embarazo. El objetivo principal de los anticonceptivos es impedir la unión del {óvulo} y el {espermatozoide}.",
        extraWords: ["genitales", "hormonales", "parches"]
      },
      {
        text: "Podemos clasificar los {anticonceptivos} en temporales o definitivos. Los anticonceptivos {temporales} son aquellos que se utilizan durante un {período} de tiempo para evitar el embarazo.",
        extraWords: ["emocionales", "ovulación", "psicológicos"]
      },
      {
        text: "Por otro lado, los anticonceptivos {definitivos} son aquellos que proporcionan una protección {permanente} generalmente a través de una {cirugía}.",
        extraWords: ["barrieras", "hormonales", "testículos"]
      },
      {
        text: "Los anticonceptivos {hormonales} contienen {hormonas} sintéticas que imitan a las hormonas {femeninas} y actúan principalmente impidiendo la {ovulación}.",
        extraWords: ["barrieras", "óvulo", "temporal"]
      },
      {
        text: "Los anticonceptivos {no hormonales} no contienen hormonas {sintéticas} y pueden funcionar creando una {barrera} física o haciendo que el ambiente vaginal sea menos {favorable}.",
        extraWords: ["emocional", "anticonceptivo", "permanente"]
      },
      {
        text: "Los anticonceptivos de {corta duración} son aquellos que se utilizan de forma {regular}, generalmente de toma {diaria}, como las pastillas anticonceptivas.",
        extraWords: ["definitivos", "psicológicos", "barrieras"]
      },
      {
        text: "En cambio, los anticonceptivos de {larga duración} pueden evitar el embarazo durante un {largo período} de tiempo sin tomar {pastillas} todos los días.",
        extraWords: ["temporal", "hormonales", "familiar"]
      }
    ]
  }
  ,
  {
    title: "Métodos anticonceptivos",
    lecciones: [
      {
        text: "Los {preservativos} son una {barrera} física que previene que el {esperma} llegue al {óvulo}. Son el único método que disminuye el riesgo de {ITS}.",
        extraWords: ["anticonceptivo", "látex", "cobre"]
      },
      {
        text: "El {diafragma} es un dispositivo de {barrera} que cubre el {cuello uterino} para evitar el contacto entre el {esperma} y el {óvulo}.",
        extraWords: ["vagina", "cérvix", "trompas"]
      },
      {
        text: "El {DIU} de {cobre} actúa como {espermicida} al liberar partículas que impiden la {fertilización} del {óvulo}.",
        extraWords: ["útero", "dispositivo", "largo"]
      },
      {
        text: "Las {pastillas} anticonceptivas contienen {hormonas} que impiden la {ovulación} y tienen una efectividad del {93%}.",
        extraWords: ["estrógeno", "progestina", "diariamente"]
      },
      {
        text: "El {anillo vaginal} es un dispositivo flexible que libera {hormonas} para impedir la {ovulación} y se cambia cada {mes}.",
        extraWords: ["flexible", "efectivo", "vagina"]
      },
      {
        text: "El {parche anticonceptivo} se adhiere a la {piel} y libera {hormonas} para prevenir la {ovulación}. Se cambia cada {semana}.",
        extraWords: ["cutáneo", "sintético", "ovulación"]
      },
      {
        text: "Las {inyecciones anticonceptivas} se administran cada {tres meses} y contienen {hormonas} que impiden la {ovulación}.",
        extraWords: ["progestina", "eficacia", "largo"]
      },
      {
        text: "El {implante subdérmico} libera {progestina} de forma continua, impidiendo la {ovulación} y espesando el {moco cervical}.",
        extraWords: ["brazo", "hormonal", "duración"]
      },
      {
        text: "El {SIU hormonal} es un dispositivo que libera {hormonas} dentro del {útero}, con una efectividad del {99%}.",
        extraWords: ["intrauterino", "modelo", "sintético"]
      },
      {
        text: "La {vasectomía} bloquea los {conductos deferentes}, impidiendo la emisión de {espermatozoides} en el {semen}.",
        extraWords: ["masculino", "quirúrgico", "permanente"]
      },
      {
        text: "La {ligadura de trompas} corta o bloquea las {trompas uterinas}, evitando el contacto entre {óvulos} y {espermatozoides}.",
        extraWords: ["femenino", "quirúrgico", "permanente"]
      }
    ]
  }
];

interface WordDragGameProps {
  lessonTitle: string;
}

const processText = (levelText: string) => {
  const blanks: Blank[] = [];
  const textParts: string[] = [];
  let currentText = '';
  let inBrackets = false;
  const correctWords: string[] = [];

  for (let i = 0; i < levelText.length; i++) {
    if (levelText[i] === '{') {
      inBrackets = true;
      textParts.push(currentText);
      currentText = '';
    } else if (levelText[i] === '}') {
      inBrackets = false;
      correctWords.push(currentText);
      blanks.push({
        id: `blank-${blanks.length}`,
        correctWord: currentText,
      });
      currentText = '';
    } else {
      currentText += levelText[i];
    }
  }
  textParts.push(currentText);

  return { blanks, textParts, correctWords };
};

const createWordsForLevel = (correctWords: string[], extraWords: string[]) => {
  const words: Word[] = [
    ...correctWords.map((word, index) => ({
      id: `correct-${index}`,
      text: word,
      isCorrect: true
    })),
    ...extraWords.map((word, index) => ({
      id: `extra-${index}`,
      text: word,
      isCorrect: false
    }))
  ];
  return words.sort(() => Math.random() - 0.5);
};


const WordDragGame: React.FC<WordDragGameProps> = ({ lessonTitle }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [textParts, setTextParts] = useState<string[]>([]);
  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [draggedBlankId, setDraggedBlankId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentLessonData, setCurrentLessonData] = useState<GameLevel | null>(null);

  // Estados para manejo táctil
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchedWord, setTouchedWord] = useState<Word | null>(null);
  const [touchedBlankId, setTouchedBlankId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const lessonData = gameLevels.find(level => level.title === lessonTitle);
    if (lessonData) {
      setCurrentLessonData(lessonData);
      initializeLevel(0, lessonData.lecciones);
    }
  }, [lessonTitle]);

  const initializeLevel = (level: number, lessons: Lesson[]) => {
    if (!lessons[level]) return;
    
    const { blanks: newBlanks, textParts: newTextParts, correctWords } = processText(lessons[level].text);
    const newWords = createWordsForLevel(correctWords, lessons[level].extraWords);
    setBlanks(newBlanks);
    setWords(newWords);
    setTextParts(newTextParts);
    setShowFeedback(false);
    setFeedbackMessage('');
    setIsLevelComplete(false);
  };

  // Funciones para manejo táctil
  const handleTouchStart = (
    e: React.TouchEvent,
    word: Word | null,
    blankId?: string
  ) => {
    e.preventDefault();
    setTouchStartTime(Date.now());
    setTouchedWord(word);
    if (blankId) {
      setTouchedBlankId(blankId);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, targetBlankId?: string) => {
    e.preventDefault();
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    // Solo procesar si el toque fue breve (para evitar scrolling)
    if (touchDuration < 500 && touchedWord) {
      if (targetBlankId) {
        handleDrop(targetBlankId);
      } else if (touchedBlankId) {
        handleDropToPool();
      }
    }

    // Limpiar estados
    setTouchedWord(null);
    setTouchedBlankId(null);
  };

  const handleDragStart = (word: Word | null, blankId?: string) => {
    setDraggedWord(word);
    if (blankId) {
      setDraggedBlankId(blankId);
    } else {
      setDraggedBlankId(null);
    }
  };

  const handleDrop = (targetBlankId: string) => {
    if (!draggedWord && !touchedWord) return;
    
    const wordToMove = draggedWord || touchedWord;
    if (!wordToMove) return;

    const targetBlank = blanks.find(blank => blank.id === targetBlankId);
    if (!targetBlank) return;

    if (targetBlank.filledWord && targetBlank.filledWordId) {
      const wordToReturn: Word = {
        id: targetBlank.filledWordId,
        text: targetBlank.filledWord,
        isCorrect: targetBlank.filledWord === targetBlank.correctWord
      };
      setWords(prevWords => [...prevWords, wordToReturn]);
    }

    if (draggedBlankId || touchedBlankId) {
      setBlanks(prevBlanks => prevBlanks.map(blank => {
        if (blank.id === (draggedBlankId || touchedBlankId)) {
          return {
            ...blank,
            filledWord: undefined,
            filledWordId: undefined
          };
        }
        return blank;
      }));
    } else {
      setWords(prevWords => prevWords.filter(word => word.id !== wordToMove.id));
    }

    setBlanks(prevBlanks => prevBlanks.map(blank => {
      if (blank.id === targetBlankId) {
        return {
          ...blank,
          filledWord: wordToMove.text,
          filledWordId: wordToMove.id
        };
      }
      return blank;
    }));

    setDraggedWord(null);
    setDraggedBlankId(null);
    setTouchedWord(null);
    setTouchedBlankId(null);
    setShowFeedback(false);
  };

  const handleDropToPool = () => {
    if (!draggedWord && !touchedWord) return;
    if (!draggedBlankId && !touchedBlankId) return;

    const wordToReturn = draggedWord || touchedWord;
    if (!wordToReturn) return;

    setWords(prevWords => [...prevWords, wordToReturn]);

    setBlanks(prevBlanks => prevBlanks.map(blank => {
      if (blank.id === (draggedBlankId || touchedBlankId)) {
        return {
          ...blank,
          filledWord: undefined,
          filledWordId: undefined
        };
      }
      return blank;
    }));

    setDraggedWord(null);
    setDraggedBlankId(null);
    setTouchedWord(null);
    setTouchedBlankId(null);
    setShowFeedback(false);
  };

  const checkAnswers = () => {
    setShowFeedback(true);
    const allBlanksFilledCorrectly = blanks.every(
      blank => blank.filledWord === blank.correctWord
    );

    if (allBlanksFilledCorrectly) {
      setFeedbackMessage('¡Correcto! ¡Muy bien!');
      setIsLevelComplete(true);
      const pointsForLevel = 100;
      setScore(prevScore => prevScore + pointsForLevel);
      
      setTimeout(() => {
        if (currentLessonData && currentLevel < currentLessonData.lecciones.length - 1) {
          handleNextLevel();
        }
      }, 2000);
    } else {
      const correctCount = blanks.filter(
        blank => blank.filledWord === blank.correctWord
      ).length;
      setFeedbackMessage(`Tienes ${correctCount} de ${blanks.length} palabras correctas. ¡Sigue intentando!`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isWordCorrect = (blank: Blank) => {
    if (!blank.filledWord) return null;
    return blank.filledWord === blank.correctWord;
  };

  const handleNextLevel = () => {
    if (currentLessonData && currentLevel < currentLessonData.lecciones.length - 1) {
      setCurrentLevel(prevLevel => {
        const newLevel = prevLevel + 1;
        initializeLevel(newLevel, currentLessonData.lecciones);
        return newLevel;
      });
    }
  };

  const resetGame = () => {
    setCurrentLevel(0);
    setScore(0);
    if (currentLessonData) {
      initializeLevel(0, currentLessonData.lecciones);
    }
  };

  if (!isClient || !currentLessonData) {
    return <div className="p-6 max-w-2xl mx-auto">Cargando...</div>;
  }

  return (
    <div className="p-1 max-w-4xl mx-auto">
        {/* Header con estilo cómic */}
        <div className="flex justify-between items-center mb-4">
          <div className="relative bg-black text-white px-6 py-3 rounded-full transform -rotate-2 text-center">
            <h2 className="text-xl font-black">{currentLessonData?.title} - Nivel {currentLevel + 1}/{currentLessonData?.lecciones.length}</h2>
            <h2>{`${score} pts`}</h2>
          </div>
        </div>

        {/* Feedback con estilo cómic */}
        {showFeedback && (
          <div className={`relative p-4 mb-6 border-4 border-black rounded-lg transform transition-all duration-300 ${
            isLevelComplete 
              ? 'bg-green-100 rotate-2' 
              : 'bg-yellow-100 -rotate-1'
          }`}>
            <div className="absolute -top-2 -left-2">
              <IconStar className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
            <p className="text-center font-bold text-lg">{feedbackMessage}</p>
          </div>
        )}

        {/* Texto con espacios en blanco estilo cómic */}
        <div className="relative bg-white border-4 border-black rounded-lg p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-lg leading-relaxed">
            {textParts.map((part, index) => (
              <React.Fragment key={index}>
                {part}
                {index < blanks.length && (
                  <span
                    draggable={!!blanks[index].filledWord}
                    onDragStart={() =>
                      blanks[index].filledWord &&
                      handleDragStart(
                        {
                          id: blanks[index].filledWordId || '',
                          text: blanks[index].filledWord || '',
                          isCorrect: blanks[index].filledWord === blanks[index].correctWord,
                        },
                        blanks[index].id
                      )
                    }
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(blanks[index].id)}
                    className={`inline-block mx-1 px-3 py-1 min-w-20 border-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
                      blanks[index].filledWord
                        ? isWordCorrect(blanks[index])
                          ? 'bg-green-100 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-move rotate-1'
                          : 'bg-red-100 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-move -rotate-1'
                        : 'border-black border-dashed text-black'
                    }`}
                  >
                    {blanks[index].filledWord || '____'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Pool de palabras estilo cómic */}
        <div
          className="relative bg-violet-100 border-4 border-black rounded-lg p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1"
          onDragOver={handleDragOver}
          onDrop={handleDropToPool}
        >
          <div className="flex flex-wrap gap-3">
            {words.map((word) => (
              <div
                key={word.id}
                draggable
                onDragStart={() => handleDragStart(word)}
                className="px-4 py-2 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-move 
                         transform transition-all duration-300 hover:scale-110 hover:-rotate-3"
              >
                <span className="font-bold">{word.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción estilo cómic */}
        <div className="flex gap-6 justify-center">
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-white border-4 border-black text-black font-black rounded-full
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition-all duration-300
                     hover:scale-105 hover:-rotate-3 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Reiniciar juego
          </button>

          {!isLevelComplete && (
            <button
              onClick={checkAnswers}
              className="px-6 py-3 bg-black text-white font-black rounded-full
                       shadow-[4px_4px_0px_0px_#FF6B6B] transform transition-all duration-300
                       hover:scale-105 hover:rotate-3 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#FF6B6B]"
            >
              Comprobar respuestas
            </button>
          )}

          {isLevelComplete && currentLevel === currentLessonData?.lecciones.length - 1 && (
            <div className="relative bg-yellow-100 border-4 border-black rounded-full px-6 py-3 transform rotate-2">
              <span className="font-black text-lg">¡Felicitaciones! Has completado todos los niveles</span>
            </div>
          )}
        </div>
    </div>
  );
};

export default WordDragGame;

