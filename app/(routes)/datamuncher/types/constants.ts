import { Level } from './types';

export const GRID_SIZE = 13;
export const INITIAL_PLAYER = { x: 1, y: 1 };
export const INITIAL_GHOSTS = [
  { x: 5, y: 5 },
  { x: 6, y: 1 },
  { x: 1, y: 7 }
];
export const INITIAL_LIVES = 3;
export const INITIAL_QUIZ_POSITIONS = [
  { x: 8, y: 4 },
  { x: 10, y: 10 },
  { x: 3, y: 10 },
  { x: 1, y: 10 },
  { x: 6, y: 2 }
];

export const LEVELS: Level[] = [
  {
    id: 1,
    background: 'from-purple-600 to-blue-800',
    boardBackground: 'from-blue-900 to-purple-900',
    ghostSpeed: 500,
    quizRequired: 3,
    timeLimit: 250,
    questions: [
      { question: "¿El preservativo es efectivo para prevenir el VIH?", answer: true, points: 10 },
      { question: "¿El preservativo solo se debe usar una vez?", answer: true, points: 10 },
      { question: "¿El preservativo puede reutilizarse si se lava?", answer: false, points: 10 },
      { question: "¿El preservativo protege contra todas las infecciones de transmisión sexual?", answer: false, points: 10 },
      { question: "¿Es importante verificar la fecha de caducidad del preservativo?", answer: true, points: 10 }
    ],
    walls: [[3, 3], [3, 4], [3, 5], [5, 3], [5, 4], [5, 5]]
  },
  {
    id: 2,
    background: 'from-red-600 to-orange-800',
    boardBackground: 'from-red-900 to-orange-900',
    ghostSpeed: 400,
    quizRequired: 3,
    timeLimit: 200,
    questions: [
      { question: "¿Los preservativos femeninos también son efectivos para prevenir ITS?", answer: true, points: 10 },
      { question: "¿Es seguro guardar preservativos en la billetera por largos periodos?", answer: false, points: 10 },
      { question: "¿Se deben usar lubricantes a base de agua con preservativos de látex?", answer: true, points: 10 },
      { question: "¿El preservativo puede romperse si se usa incorrectamente?", answer: true, points: 10 },
      { question: "¿Se puede usar un preservativo con cualquier tipo de lubricante?", answer: false, points: 10 }
    ],
    walls: [[3, 3], [3, 4], [3, 5], [5, 3], [5, 4], [5, 5]]
  },
  {
    id: 3,
    background: 'from-green-600 to-teal-800',
    boardBackground: 'from-green-900 to-teal-900',
    ghostSpeed: 300,
    quizRequired: 3,
    timeLimit: 195,
    questions: [
      { question: "¿Los preservativos están disponibles en varios tamaños?", answer: true, points: 10 },
      { question: "¿El preservativo masculino es el único método de barrera?", answer: false, points: 10 },
      { question: "¿El uso correcto del preservativo reduce el riesgo de embarazo no deseado?", answer: true, points: 10 },
      { question: "¿Los preservativos tienen un lado correcto para desenrollar?", answer: true, points: 10 },
      { question: "¿Es necesario apretar la punta del preservativo para ponerselo?", answer: true, points: 10 }
    ],
    walls: [[4, 4], [4, 5], [4, 6], [6, 4], [6, 5], [6, 6]]
  },
  {
    id: 4,
    background: 'from-blue-600 to-indigo-800',
    boardBackground: 'from-blue-900 to-indigo-900',
    ghostSpeed: 250,
    quizRequired: 3,
    timeLimit: 190,
    questions: [
      { question: "¿Los preservativos de látex pueden causar alergias?", answer: true, points: 15 },
      { question: "¿El preservativo debe colocarse antes de cualquier contacto sexual?", answer: true, points: 15 },
      { question: "¿Se puede usar más de un preservativo a la vez para mayor protección?", answer: false, points: 15 },
      { question: "¿El preservativo femenino puede colocarse horas antes del acto sexual?", answer: true, points: 15 },
      { question: "¿Es importante revisar la integridad del empaque antes de usar un preservativo?", answer: true, points: 15 }
    ],
    walls: [[5, 5], [5, 6], [5, 7], [7, 5], [7, 6], [7, 7]]
  },
  {
    id: 5,
    background: 'from-yellow-600 to-orange-800',
    boardBackground: 'from-yellow-900 to-orange-900',
    ghostSpeed: 200,
    quizRequired: 3,
    timeLimit: 185,
    questions: [
      { question: "¿Los preservativos pueden ser usados en relaciones orales?", answer: true, points: 15 },
      { question: "¿El calor extremo puede dañar los preservativos?", answer: true, points: 15 },
      { question: "¿Los preservativos de poliuretano son una opción para personas alérgicas al látex?", answer: true, points: 15 },
      { question: "¿Es seguro abrir el empaque del preservativo con los dientes?", answer: false, points: 15 },
      { question: "¿El preservativo protege completamente contra el VPH?", answer: false, points: 15 }
    ],
    walls: [[6, 6], [6, 7], [6, 8], [8, 6], [8, 7], [8, 8]]
  },
  {
    id: 6,
    background: 'from-pink-600 to-red-800',
    boardBackground: 'from-pink-900 to-red-900',
    ghostSpeed: 180,
    quizRequired: 3,
    timeLimit: 180,
    questions: [
      { question: "¿Los preservativos están disponibles gratuitamente en centros de salud?", answer: true, points: 15 },
      { question: "¿Los preservativos tienen sabor para prácticas orales?", answer: true, points: 15 },
      { question: "¿Un preservativo roto aún protege contra el VIH?", answer: false, points: 15 },
      { question: "¿El preservativo debe cubrir completamente el pene?", answer: true, points: 15 },
      { question: "¿Es necesario lavar los genitales después de usar un preservativo?", answer: false, points: 15 }
    ],
    walls: [[7, 7], [7, 8], [7, 9], [9, 7], [9, 8], [9, 9]]
  },
  {
    id: 7,
    background: 'from-teal-600 to-blue-800',
    boardBackground: 'from-teal-900 to-blue-900',
    ghostSpeed: 160,
    quizRequired: 3,
    timeLimit: 180,
    questions: [
      { question: "¿Se deben almacenar los preservativos en un lugar fresco y seco?", answer: true, points: 15 },
      { question: "¿El preservativo puede prevenir infecciones de transmisión sexual y embarazos?", answer: true, points: 15 },
      { question: "¿Es seguro usar preservativos expirados si no están dañados?", answer: false, points: 15 },
      { question: "¿El preservativo femenino puede ser usado junto con el masculino?", answer: false, points: 15 },
      { question: "¿Es necesario verificar que el preservativo esté aprobado por estándares de calidad?", answer: true, points: 15 }
    ],
    walls: [[8, 8], [8, 9], [8, 10], [10, 8], [10, 9], [10, 10]]
  },
];
