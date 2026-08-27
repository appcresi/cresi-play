export type LoveLanguageKey = 'A' | 'B' | 'C' | 'D' | 'E';

export interface LoveLanguageOption {
  letter: LoveLanguageKey;
  text: string;
}

export interface LoveLanguageQuestion {
  id: number;
  text: string;
  options: LoveLanguageOption[];
}

// Adaptación del "Cuestionario para Adolescentes de los 5 Lenguajes del
// Amor" (Gary Chapman): el original presenta 30 pares de frases (2
// opciones) por lenguaje. Acá cada pregunta pasa a tener 4 alternativas —
// una por cada lenguaje salvo uno — para que la elección quede más
// definida. Con 20 preguntas y un lenguaje excluido por pregunta en
// rotación (A, B, C, D, E, A, B, C, D, E...), cada lenguaje termina
// aaparaciendo en 16 de las 20 preguntas: queda parejo entre todos.
export const QUESTIONS: LoveLanguageQuestion[] = [
  {
    id: 1,
    text: 'Tuviste un mal día. ¿Qué te gustaría que hiciera alguien que te quiere?',
    options: [
      { letter: 'B', text: 'Que se siente a tu lado y te preste toda su atención, sin el celular de por medio.' },
      { letter: 'C', text: 'Que te sorprenda con algo pequeño que sepa que te gusta.' },
      { letter: 'D', text: 'Que te ayude con algo que tenías pendiente, sin que se lo pidas.' },
      { letter: 'E', text: 'Que te dé un abrazo fuerte.' },
    ],
  },
  {
    id: 2,
    text: '¿Qué te hace sentir más querido/a de tu familia o de tu pareja?',
    options: [
      { letter: 'A', text: 'Que te digan lo orgullosos que están de vos.' },
      { letter: 'C', text: 'Que te regalen algo que realmente te guste, aunque no sea una fecha especial.' },
      { letter: 'D', text: 'Que se ocupen de algo tuyo sin que se los pidas.' },
      { letter: 'E', text: 'Un abrazo o un gesto de cariño físico.' },
    ],
  },
  {
    id: 3,
    text: 'Tenés un examen importante mañana. ¿Qué te ayudaría más a sentirte acompañado/a?',
    options: [
      { letter: 'A', text: 'Que te digan "vos podés, confío en vos".' },
      { letter: 'B', text: 'Que se queden un rato estudiando o charlando con vos.' },
      { letter: 'D', text: 'Que te ayuden a repasar o te preparen algo para comer.' },
      { letter: 'E', text: 'Un abrazo antes de irte a dormir.' },
    ],
  },
  {
    id: 4,
    text: 'Es tu cumpleaños. ¿Qué te haría más feliz?',
    options: [
      { letter: 'A', text: 'Que te escriban algo lindo, un mensaje o una carta.' },
      { letter: 'B', text: 'Pasar tiempo juntos haciendo algo que te guste.' },
      { letter: 'C', text: 'Recibir un regalo que hayan pensado especialmente para vos.' },
      { letter: 'E', text: 'Que te den un abrazo grande al saludarte.' },
    ],
  },
  {
    id: 5,
    text: '¿Qué preferís que haga alguien que te quiere cuando tenés mucha tarea o trabajo encima?',
    options: [
      { letter: 'A', text: 'Que te diga que confía en que vas a poder con todo.' },
      { letter: 'B', text: 'Que se quede haciéndote compañía mientras trabajás.' },
      { letter: 'C', text: 'Que te traiga algo rico para picar mientras estudiás.' },
      { letter: 'D', text: 'Que se ocupe de algo tuyo para que tengas más tiempo libre.' },
    ],
  },
  {
    id: 6,
    text: 'Después de discutir con alguien, ¿qué gesto te haría sentir que todo está bien de nuevo?',
    options: [
      { letter: 'B', text: 'Que busque un momento para hablar y estar con vos.' },
      { letter: 'C', text: 'Que te traiga algo como forma de decir "perdón".' },
      { letter: 'D', text: 'Que haga algo por vos sin que se lo pidas.' },
      { letter: 'E', text: 'Un abrazo o que te tome de la mano.' },
    ],
  },
  {
    id: 7,
    text: '¿Qué te gusta más recibir de tus amigos cuando lograste algo importante?',
    options: [
      { letter: 'A', text: 'Que te digan lo orgullosos que están de vos.' },
      { letter: 'C', text: 'Que te regalen algo para festejar.' },
      { letter: 'D', text: 'Que te ayuden a organizar algo para celebrar.' },
      { letter: 'E', text: 'Que te den un abrazo o choquen los cinco con vos.' },
    ],
  },
  {
    id: 8,
    text: 'Estás pasando un momento difícil. ¿Qué necesitás más de la gente que te quiere?',
    options: [
      { letter: 'A', text: 'Que te digan palabras que te den ánimo.' },
      { letter: 'B', text: 'Que se queden a tu lado, sin necesidad de hablar de más.' },
      { letter: 'D', text: 'Que se hagan cargo de algo para aliviarte.' },
      { letter: 'E', text: 'Un abrazo que te haga sentir contenido/a.' },
    ],
  },
  {
    id: 9,
    text: '¿Qué te haría sentir más especial en una fecha importante para vos?',
    options: [
      { letter: 'A', text: 'Un mensaje o una carta con palabras lindas.' },
      { letter: 'B', text: 'Que separen tiempo para estar con vos, sin apuro.' },
      { letter: 'C', text: 'Un regalo que muestre que te conocen bien.' },
      { letter: 'E', text: 'Un beso, un abrazo o que te tomen de la mano.' },
    ],
  },
  {
    id: 10,
    text: '¿Qué gesto de tus padres o familiares valorás más en el día a día?',
    options: [
      { letter: 'A', text: 'Que te digan que están orgullosos de cómo sos.' },
      { letter: 'B', text: 'Que compartan un rato con vos, aunque sea corto.' },
      { letter: 'C', text: 'Que te traigan algo que sepan que te gusta.' },
      { letter: 'D', text: 'Que se ocupen de cosas para hacerte la vida más fácil.' },
    ],
  },
  {
    id: 11,
    text: 'Si tu pareja o alguien que te gusta quisiera demostrarte cariño, ¿qué preferirías?',
    options: [
      { letter: 'B', text: 'Que planee un momento para estar los dos solos.' },
      { letter: 'C', text: 'Que te regale algo pensado especialmente para vos.' },
      { letter: 'D', text: 'Que te ayude con algo que te está costando.' },
      { letter: 'E', text: 'Que te abrace o te tome de la mano.' },
    ],
  },
  {
    id: 12,
    text: '¿Qué te hace sentir más acompañado/a cuando estás nervioso/a por algo?',
    options: [
      { letter: 'A', text: 'Que te digan que confían en vos y en cómo te va a ir.' },
      { letter: 'C', text: 'Que te den algo simbólico para la buena suerte.' },
      { letter: 'D', text: 'Que te ayuden a prepararte para lo que viene.' },
      { letter: 'E', text: 'Que te den la mano o un abrazo antes de encarar.' },
    ],
  },
  {
    id: 13,
    text: '¿Qué esperás de un amigo o amiga cuando tuviste un mal momento?',
    options: [
      { letter: 'A', text: 'Que te diga algo que te haga sentir mejor.' },
      { letter: 'B', text: 'Que se quede con vos el tiempo que haga falta.' },
      { letter: 'D', text: 'Que te ayude a resolver lo que te pasó.' },
      { letter: 'E', text: 'Un abrazo bien fuerte.' },
    ],
  },
  {
    id: 14,
    text: '¿Qué te gustaría que hicieran por vos en un día común, sin ninguna razón especial?',
    options: [
      { letter: 'A', text: 'Que te digan algo lindo sin motivo.' },
      { letter: 'B', text: 'Que quieran pasar un rato con vos.' },
      { letter: 'C', text: 'Que te traigan algo chiquito, solo porque sí.' },
      { letter: 'E', text: 'Un abrazo o un gesto de cariño de la nada.' },
    ],
  },
  {
    id: 15,
    text: 'Necesitás ayuda con algo (una tarea, organizar algo). ¿Qué preferís?',
    options: [
      { letter: 'A', text: 'Que te digan que confían en que lo vas a lograr.' },
      { letter: 'B', text: 'Que se queden haciéndote compañía mientras lo hacés.' },
      { letter: 'C', text: 'Que te traigan algo para hacer el momento más llevadero.' },
      { letter: 'D', text: 'Que directamente te ayuden a hacerlo.' },
    ],
  },
  {
    id: 16,
    text: '¿Qué te haría sentir más querido/a un fin de semana cualquiera?',
    options: [
      { letter: 'B', text: 'Que separen un tiempo para estar con vos, sin distracciones.' },
      { letter: 'C', text: 'Que te sorprendan con algo pequeño.' },
      { letter: 'D', text: 'Que se encarguen de algo para que vos tengas un rato libre.' },
      { letter: 'E', text: 'Que busquen momentos de cercanía física, como un abrazo.' },
    ],
  },
  {
    id: 17,
    text: 'Lográs algo que te costó mucho. ¿Qué te gustaría escuchar o recibir?',
    options: [
      { letter: 'A', text: 'Que te digan lo bien que lo hiciste.' },
      { letter: 'C', text: 'Un regalo o un detalle para festejarlo.' },
      { letter: 'D', text: 'Que te ayuden con algo, como forma de festejarlo con vos.' },
      { letter: 'E', text: 'Un abrazo de felicitación.' },
    ],
  },
  {
    id: 18,
    text: '¿Qué gesto te hace sentir que alguien realmente te escucha?',
    options: [
      { letter: 'A', text: 'Que te diga palabras que muestren que entendió lo que sentís.' },
      { letter: 'B', text: 'Que te preste toda su atención mientras hablás.' },
      { letter: 'D', text: 'Que después haga algo concreto por vos, relacionado con lo que le contaste.' },
      { letter: 'E', text: 'Que te toque el hombro o te abrace mientras hablás.' },
    ],
  },
  {
    id: 19,
    text: '¿Qué te gustaría que hiciera alguien que te quiere antes de un momento importante para vos?',
    options: [
      { letter: 'A', text: 'Que te diga algo que te dé confianza.' },
      { letter: 'B', text: 'Que se quede con vos hasta último momento.' },
      { letter: 'C', text: 'Que te dé algo como amuleto o recuerdo.' },
      { letter: 'E', text: 'Que te dé un abrazo antes de irte.' },
    ],
  },
  {
    id: 20,
    text: '¿Qué valorás más de las personas que te rodean en tu día a día?',
    options: [
      { letter: 'A', text: 'Que te digan cosas lindas o te reconozcan.' },
      { letter: 'B', text: 'Que te dediquen tiempo de calidad.' },
      { letter: 'C', text: 'Que tengan detalles con vos.' },
      { letter: 'D', text: 'Que te ayuden con cosas sin que se lo pidas.' },
    ],
  },
];

// Barajamos las opciones de cada pregunta (no las preguntas en sí) para
// que un mismo lenguaje no aparezca siempre primero — si no, alguien
// podría acostumbrarse a "la primera opción es palabras de afirmación" en
// vez de leer las cuatro. Fisher-Yates, copia nueva cada vez que se llama.
export function shuffleQuestions(): LoveLanguageQuestion[] {
  return QUESTIONS.map((question) => {
    const options = [...question.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { ...question, options };
  });
}

export const LANGUAGES: Record<LoveLanguageKey, {
  name: string;
  icon: string;
  color: string;
  description: string;
  askTips: string[];
  giveTips: string[];
}> = {
  A: {
    name: 'Palabras de Afirmación',
    icon: '💬',
    color: 'from-blue-500 to-cyan-500',
    description:
      'Las palabras tienen un peso especial para vos: un "te quiero", un "estoy orgulloso de vos" o un simple "lo hiciste muy bien" te llegan más que ' +
      'cualquier otro gesto. No es que necesites que te digan cosas todo el tiempo — es que esas palabras, cuando son sinceras, te hacen sentir visto/a ' +
      'y valorado/a de una forma que otros gestos no terminan de igualar.',
    askTips: [
      'Contale a alguien que querés qué palabras te hacen sentir bien — no siempre se dan cuenta solos.',
      'Si te cuesta pedirlo directamente, probá contar un ejemplo: "cuando tal persona me dijo tal cosa, me hizo re bien".',
    ],
    giveTips: [
      'Animate a decir en voz alta lo que valorás de alguien, no solo pensarlo.',
      'Un mensaje de texto sincero puede significar tanto como una charla larga.',
      'Sé específico/a: "hiciste muy bien esto" dice más que un "sos genial" genérico.',
    ],
  },
  B: {
    name: 'Tiempo de Calidad',
    icon: '⏳',
    color: 'from-purple-500 to-pink-500',
    description:
      'Para vos, el cariño se mide en presencia real: que alguien esté con vos sin tener la cabeza en otro lado. No hace falta que sea mucho tiempo — ' +
      'una charla de diez minutos sin celulares de por medio puede valer más que toda una tarde en la que nadie te prestó atención de verdad.',
    askTips: [
      'Proponé un momento concreto ("¿hablamos un rato sin pantallas?") en vez de esperar que pase solo.',
      'Decí cuando sentís que alguien no te está prestando atención de verdad, en vez de guardártelo.',
    ],
    giveTips: [
      'Guardá el celular cuando alguien te está hablando — se nota, y se agradece.',
      'Los momentos cortos cuentan tanto como los largos: lo que importa es la atención, no la duración.',
      'Preguntá cómo estuvo el día de alguien y quedate a escuchar la respuesta completa.',
    ],
  },
  C: {
    name: 'Dar y Recibir Regalos',
    icon: '🎁',
    color: 'from-amber-500 to-orange-500',
    description:
      'No tiene que ver con lo material: lo que te llega es que alguien haya pensado en vos en un momento en el que no tenía por qué hacerlo. Un ' +
      'detalle chico y bien pensado — algo que te guste, que te recuerde a algo, que te haga acordar a esa persona — te hace sentir tenido/a en cuenta.',
    askTips: [
      'Si es tu lenguaje, no te sientas raro/a por valorarlo — es una forma tan válida de sentir cariño como cualquier otra.',
      'Contá qué tipo de detalles te gustan (no siempre tiene que ver con el precio).',
    ],
    giveTips: [
      'Guardá algo que te comentaron que les gusta, para el momento en que lo necesites.',
      'El detalle no tiene que ser caro — lo que importa es que muestre que pensaste en esa persona.',
      'Un regalo hecho por vos (una nota, algo armado a mano) suele valer más que uno comprado.',
    ],
  },
  D: {
    name: 'Actos de Servicio',
    icon: '🤝',
    color: 'from-green-500 to-emerald-500',
    description:
      'Sentís el cariño en las acciones, más que en las palabras: que alguien se ocupe de algo por vos, que te ayude sin que se lo pidas, que note lo ' +
      'que necesitás y lo resuelva. Para vos, hacer algo por alguien ES una forma de decir "te quiero".',
    askTips: [
      'Contá qué tipo de ayuda realmente te alivia — no todas las ayudas se sienten igual de bien.',
      'Está bien pedir ayuda directamente: no hace falta esperar a que alguien lo note solo.',
    ],
    giveTips: [
      'Agradecé cuando alguien hace algo por vos, aunque parezca chico — para esa persona puede haber sido un gesto grande.',
      'Fijate qué tarea le está pesando a alguien que querés, y hacela vos sin que te lo pida.',
      'Ojo con un extremo: hacer todo por otra persona sin que lo pida también puede sentirse invasivo — preguntá si hace falta.',
    ],
  },
  E: {
    name: 'Contacto Físico',
    icon: '🤗',
    color: 'from-red-500 to-rose-500',
    description:
      'El cariño se siente en el cuerpo: un abrazo, tomarse de la mano, sentarse cerca de alguien. Para vos, la cercanía física dice cosas que las ' +
      'palabras no siempre logran transmitir. Una aclaración importante: este lenguaje, como cualquier gesto físico, solo tiene sentido si las dos ' +
      'personas lo quieren — nunca es una obligación, ni siquiera con alguien que te quiere mucho.',
    askTips: [
      'Contale a la gente que querés qué gestos te hacen sentir bien: un abrazo, un choque de manos, lo que sea.',
      'Tenés todo el derecho de decir que no a un gesto físico, aunque venga de alguien que te quiere.',
    ],
    giveTips: [
      'Preguntá o fijate si a la otra persona le gusta el contacto físico antes de asumirlo — no a todos les llega igual.',
      'Un abrazo o un gesto simple pueden decir mucho sin palabras, en el momento justo.',
      'Respetar cuando alguien no quiere contacto físico es tan importante como ofrecerlo.',
    ],
  },
};
