"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

type Answer = 1 | 2 | 3 | 4 | 5;

interface Question {
  id: number;
  text: string;
  block: string;
}

const TestVocacional = () => {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [showResults, setShowResults] = useState(false);

  const questions: Question[] = [
    // Bloque 1: Tipo de actividad
    { id: 1, block: 'Tipo de actividad', text: 'No me gusta trabajar con números o cálculos.' },
    { id: 2, block: 'Tipo de actividad', text: 'No me gusta leer textos largos o teóricos.' },
    { id: 3, block: 'Tipo de actividad', text: 'No me gusta escribir informes o ensayos.' },
    { id: 4, block: 'Tipo de actividad', text: 'No me gusta hablar en público o exponer.' },
    { id: 5, block: 'Tipo de actividad', text: 'No me gusta usar computadoras o programas digitales.' },
    { id: 6, block: 'Tipo de actividad', text: 'No me gusta hacer trabajos manuales o usar herramientas.' },
    { id: 7, block: 'Tipo de actividad', text: 'No me gusta pasar mucho tiempo concentrado/a en un solo tema.' },
    { id: 8, block: 'Tipo de actividad', text: 'No me gusta resolver problemas complicados.' },
    { id: 9, block: 'Tipo de actividad', text: 'No me gusta hacer experimentos o pruebas.' },
    { id: 10, block: 'Tipo de actividad', text: 'No me gusta dibujar o hacer cosas creativas.' },
    
    // Bloque 2: Entorno de trabajo
    { id: 11, block: 'Entorno de trabajo', text: 'No me gusta trabajar con otras personas en equipo.' },
    { id: 12, block: 'Entorno de trabajo', text: 'No me gusta seguir instrucciones o normas rígidas.' },
    { id: 13, block: 'Entorno de trabajo', text: 'No me gusta trabajar bajo presión o con plazos.' },
    { id: 14, block: 'Entorno de trabajo', text: 'No me gusta estar todo el día en una oficina.' },
    { id: 15, block: 'Entorno de trabajo', text: 'No me gusta estar al aire libre o moverme mucho.' },
    { id: 16, block: 'Entorno de trabajo', text: 'No me gusta atender al público o clientes.' },
    { id: 17, block: 'Entorno de trabajo', text: 'No me gusta enseñar o explicar cosas.' },
    { id: 18, block: 'Entorno de trabajo', text: 'No me gusta que me digan lo que tengo que hacer.' },
    { id: 19, block: 'Entorno de trabajo', text: 'No me gusta trabajar solo/a durante mucho tiempo.' },
    { id: 20, block: 'Entorno de trabajo', text: 'No me gusta que mi trabajo dependa de otros.' },
    
    // Bloque 3: Habilidades y desafíos
    { id: 21, block: 'Habilidades y desafíos', text: 'No me gusta improvisar o tomar decisiones rápidas.' },
    { id: 22, block: 'Habilidades y desafíos', text: 'No me gusta memorizar información.' },
    { id: 23, block: 'Habilidades y desafíos', text: 'No me gusta planificar proyectos.' },
    { id: 24, block: 'Habilidades y desafíos', text: 'No me gusta asumir responsabilidades grandes.' },
    { id: 25, block: 'Habilidades y desafíos', text: 'No me gusta competir con otras personas.' },
    { id: 26, block: 'Habilidades y desafíos', text: 'No me gusta resolver conflictos.' },
    { id: 27, block: 'Habilidades y desafíos', text: 'No me gusta organizar cosas o coordinar actividades.' },
    { id: 28, block: 'Habilidades y desafíos', text: 'No me gusta hacer presentaciones o defender ideas.' },
    { id: 29, block: 'Habilidades y desafíos', text: 'No me gusta seguir rutinas diarias.' },
    { id: 30, block: 'Habilidades y desafíos', text: 'No me gusta hacer tareas repetitivas.' },
    
    // Bloque 4: Personas y comunicación
    { id: 31, block: 'Personas y comunicación', text: 'No me gusta escuchar los problemas de otros.' },
    { id: 32, block: 'Personas y comunicación', text: 'No me gusta hablar con desconocidos.' },
    { id: 33, block: 'Personas y comunicación', text: 'No me gusta trabajar con niños o adolescentes.' },
    { id: 34, block: 'Personas y comunicación', text: 'No me gusta trabajar con personas mayores o enfermas.' },
    { id: 35, block: 'Personas y comunicación', text: 'No me gusta hablar de emociones o sentimientos.' },
    { id: 36, block: 'Personas y comunicación', text: 'No me gusta convencer o persuadir a los demás.' },
    { id: 37, block: 'Personas y comunicación', text: 'No me gusta participar en debates o discusiones.' },
    { id: 38, block: 'Personas y comunicación', text: 'No me gusta explicar ideas complejas.' },
    { id: 39, block: 'Personas y comunicación', text: 'No me gusta mediar entre personas que discuten.' },
    { id: 40, block: 'Personas y comunicación', text: 'No me gusta dar consejos o acompañar procesos personales.' },
    
    // Bloque 5: Intereses y valores
    { id: 41, block: 'Intereses y valores', text: 'No me gusta el arte ni las actividades creativas.' },
    { id: 42, block: 'Intereses y valores', text: 'No me gusta la ciencia ni la investigación.' },
    { id: 43, block: 'Intereses y valores', text: 'No me gusta la tecnología ni los avances digitales.' },
    { id: 44, block: 'Intereses y valores', text: 'No me gusta el trabajo físico o manual.' },
    { id: 45, block: 'Intereses y valores', text: 'No me gusta involucrarme en temas sociales o comunitarios.' },
    { id: 46, block: 'Intereses y valores', text: 'No me gusta pensar en negocios o dinero.' },
    { id: 47, block: 'Intereses y valores', text: 'No me gusta el trabajo político o institucional.' },
    { id: 48, block: 'Intereses y valores', text: 'No me gusta ayudar a los demás.' },
    { id: 49, block: 'Intereses y valores', text: 'No me gusta aprender cosas nuevas todo el tiempo.' },
    { id: 50, block: 'Intereses y valores', text: 'No me gusta asumir riesgos o probar cosas diferentes.' },
  ];

  const blocks = [
    'Tipo de actividad',
    'Entorno de trabajo',
    'Habilidades y desafíos',
    'Personas y comunicación',
    'Intereses y valores'
  ];

  const currentBlockQuestions = questions.filter(q => q.block === blocks[currentBlock]);
  const question = currentBlockQuestions[currentQuestion];
  const totalQuestionsAnswered = Object.keys(answers).length;
  const isAnswered = question && answers[question.id];

  const handleAnswer = (value: Answer) => {
    if (question) {
      setAnswers(prev => ({ ...prev, [question.id]: value }));
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestion < currentBlockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentBlock < blocks.length - 1) {
      setCurrentBlock(currentBlock + 1);
      setCurrentQuestion(0);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentBlock > 0) {
      setCurrentBlock(currentBlock - 1);
      setCurrentQuestion(currentBlockQuestions.length - 1);
    }
  };

  const calculateResults = () => {
    const blockScores: Record<string, number> = {};
    
    blocks.forEach(block => {
      const blockQs = questions.filter(q => q.block === block);
      const sum = blockQs.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
      blockScores[block] = Math.round((sum / (blockQs.length * 5)) * 100);
    });

    return blockScores;
  };

  const getRecommendations = () => {
    const scores = calculateResults();
    const recommendations: string[] = [];

    if (scores['Tipo de actividad'] > 60) {
      recommendations.push('Evitar áreas que requieran precisión numérica, escritura técnica o exposiciones frecuentes');
    }
    if (scores['Entorno de trabajo'] > 60) {
      recommendations.push('Buscar ambientes flexibles, creativos o independientes');
    }
    if (scores['Habilidades y desafíos'] > 60) {
      recommendations.push('Considerar roles que no requieran liderazgo o coordinación constante');
    }
    if (scores['Personas y comunicación'] > 60) {
      recommendations.push('Enfocarse en áreas con menor interacción social o emocional');
    }
    if (scores['Intereses y valores'] > 60) {
      recommendations.push('Explorar campos especializados o técnicos');
    }

    return recommendations;
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentBlock(0);
    setCurrentQuestion(0);
    setShowResults(false);
  };

  const getCareerSuggestions = () => {
    const scores = calculateResults();
    const areas: string[] = [];

    if (scores['Tipo de actividad'] < 50) areas.push('📊 Análisis de datos');
    if (scores['Entorno de trabajo'] > 50) areas.push('🎨 Diseño y Creatividad');
    if (scores['Habilidades y desafíos'] < 50) areas.push('🧠 Resolución de problemas');
    if (scores['Personas y comunicación'] < 50) areas.push('💬 Comunicación');
    if (scores['Intereses y valores'] > 50) areas.push('🌿 Trabajo práctico');

    if (areas.length === 0) {
      areas.push('🔧 Especialidades técnicas', '🎓 Investigación');
    }

    return areas;
  };

  if (showResults) {
    const scores = calculateResults();
    const recommendations = getRecommendations();
    const careers = getCareerSuggestions();

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
                ¡Tu perfil vocacional! 🎯
              </h2>
              <p className="text-gray-600">Basado en lo que preferís evitar</p>
            </div>

            <div className="space-y-6 mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Análisis por área:</h3>
              {blocks.map(block => (
                <div key={block} className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">{block}</span>
                    <span className="text-sm bg-purple-600 text-white px-3 py-1 rounded-full font-bold">
                      {scores[block]}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        scores[block] > 60 ? 'bg-red-500' :
                        scores[block] > 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${scores[block]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 mb-8">
              <h3 className="text-xl font-bold text-blue-900 mb-4">💡 Recomendaciones personalizadas:</h3>
              <ul className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="mr-3 text-blue-600 font-bold">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 mb-8">
              <h3 className="text-xl font-bold text-green-900 mb-4">🚀 Áreas vocacionales recomendadas:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {careers.map((career, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-green-300 font-semibold text-gray-800">
                    {career}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Hacer el test nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
              🧭 Test Vocacional Inverso
            </h1>
            <p className="text-gray-600 text-lg">Descubrí tu camino evitando lo que no te gusta</p>
          </div>

          {/* Progress */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Bloque {currentBlock + 1} de {blocks.length}: {blocks[currentBlock]}
              </span>
              <span className="text-sm text-gray-500">
                Pregunta {currentQuestion + 1} de {currentBlockQuestions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                style={{ width: `${(totalQuestionsAnswered / 50) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-right">{totalQuestionsAnswered}/50 completadas</p>
          </div>

          {/* Single Question */}
          {question && (
            <div className="mb-12">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-8 md:p-10">
                <p className="text-xl md:text-2xl font-bold text-gray-800 mb-12 leading-relaxed">
                  {question.text}
                </p>

                {/* Answer Options */}
                <div className="space-y-6">
                  <div className="flex justify-between items-start gap-4 mb-8">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Me gusta mucho</p>
                    </div>
                    <div className="flex-1"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2">No me gusta nada</p>
                    </div>
                  </div>

                  <div className="flex gap-2 md:gap-4 justify-center items-center">
                    {[
                      { value: 1, emoji: '😍' },
                      { value: 2, emoji: '🙂' },
                      { value: 3, emoji: '😐' },
                      { value: 4, emoji: '🙁' },
                      { value: 5, emoji: '😫' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleAnswer(option.value as Answer);
                          setTimeout(goToNextQuestion, 300);
                        }}
                        className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full transition-all transform hover:scale-110 ${
                          answers[question.id] === option.value
                            ? 'bg-purple-600 shadow-lg scale-110'
                            : 'bg-white border-2 border-gray-300 hover:border-purple-400 hover:shadow-md'
                        }`}
                      >
                        <span className="text-4xl md:text-5xl">{option.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentBlock === 0 && currentQuestion === 0}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <ChevronUp size={20} />
              Anterior
            </button>

            {currentBlock === blocks.length - 1 && currentQuestion === currentBlockQuestions.length - 1 ? (
              <button
                onClick={() => setShowResults(true)}
                disabled={totalQuestionsAnswered < 50}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Ver resultados
              </button>
            ) : (
              <button
                onClick={goToNextQuestion}
                disabled={!isAnswered}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                Siguiente
                <ChevronDown size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVocacional;