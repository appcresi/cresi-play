/**
 * scripts/add-autoconocimiento-leccion.mjs
 *
 * Crea la lección "Autoconocimiento, autoestima y límites" en la colección
 * `lecciones`, con author: 'CRESI' (igual que las que se crean desde el
 * panel de administración).
 *
 * El texto se dividió en 11 partes respetando el orden y las palabras del
 * original, con 2 preguntas de verdadero/falso por parte (una verdadera y
 * una falsa), como las lecciones existentes. Se corrigieron erratas y una
 * oración que estaba desordenada en el párrafo de los errores ("...es
 * aceptar que se los ha cometido. Esto es fundamental porque nos permite
 * dejar atrás la vergüenza o la culpa...") y se reescribió la oración
 * sobre la autoestima alta, que mezclaba tiempos verbales. No tiene
 * imágenes todavía: el
 * campo es opcional y se puede agregar después desde el panel
 * (Lecciones -> editar -> "Elegir de infografías").
 *
 * Usa un id fijo, así que es re-corrible: si ya existe, lo actualiza en
 * vez de duplicarlo.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué subiría, sin tocar nada:
 *        node scripts/add-autoconocimiento-leccion.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/add-autoconocimiento-leccion.mjs --apply
 */

import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('❌ Faltan variables de entorno en .env.local (FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const APPLY = process.argv.includes('--apply');

const leccion = {
  id: 'autoconocimiento-autoestima-limites',
  title: 'Autoconocimiento, autoestima y límites',
  author: 'CRESI',
  lecciones: [
    {
      text: `Muchas veces cuando nos miramos a nosotros mismos nos cuesta reconocer las cosas buenas, cualidades o capacidades que tenemos. El autoconocimiento es una parte fundamental del crecimiento personal y del desarrollo de la identidad de un individuo. Se trata de un proceso que implica la exploración y la reflexión sobre uno mismo, con el objetivo de comprender mejor quién se es en realidad. Es un proceso que no ocurre de la noche a la mañana, sino que requiere tiempo, paciencia y esfuerzo, y que puede ser una tarea desafiante, pero al mismo tiempo muy gratificante.`,
      questions: [
        { question: '¿El autoconocimiento es un proceso que requiere tiempo, paciencia y esfuerzo?', correctAnswer: true },
        { question: '¿El autoconocimiento ocurre de la noche a la mañana?', correctAnswer: false },
      ],
    },
    {
      text: `Una de las primeras preguntas que se deben hacer para iniciar el proceso de autoconocimiento es: ¿quién soy? Esta pregunta es mucho más profunda de lo que parece a simple vista, ya que implica analizar aspectos como la personalidad, los valores, las creencias, las motivaciones, los intereses y las experiencias de vida que han influido en la construcción de la identidad. En el camino del autoconocimiento, es importante aprender a reconocer y aceptar tanto las habilidades y capacidades, como los gustos y las preferencias personales. A menudo, las personas tienden a compararse con los demás y a medir su propio valor en función de lo que otros hacen o tienen, sin embargo, cada individuo tiene sus propias fortalezas y debilidades que lo hacen único y especial. Es fundamental reconocer que las destrezas y habilidades personales son esenciales para desarrollar confianza y autoestima, creando así una visión más realista de nuestros talentos. Identificar estas habilidades puede requerir experimentar con diferentes actividades y áreas de interés, pero es importante tener en cuenta que también pueden surgir a través de las experiencias cotidianas y del aprendizaje de nuevos conocimientos.`,
      questions: [
        { question: '¿Cada individuo tiene sus propias fortalezas y debilidades que lo hacen único y especial?', correctAnswer: true },
        { question: '¿Es una buena forma de valorarnos medir nuestro valor en función de lo que otros hacen o tienen?', correctAnswer: false },
      ],
    },
    {
      text: `Por otro lado, reconocer los gustos y preferencias personales es importante para tomar decisiones que se ajusten a las necesidades y deseos individuales. Muchas veces las personas se sienten influenciadas por las opiniones de los demás y toman decisiones que no van de acuerdo con sus propios intereses y pasiones. Cabe recordar que el autoconocimiento también implica aceptar los resbalones y errores, y no ser demasiado duro consigo mismo cuando se comete un error o se fracasa en algo. Aprender de nuestros propios errores es esencial para nuestro crecimiento personal y profesional, aunque cometerlos pueda ser doloroso.`,
      questions: [
        { question: '¿El autoconocimiento también implica aceptar los errores y no ser demasiado duro con uno mismo cuando se fracasa en algo?', correctAnswer: true },
        { question: '¿Reconocer nuestros gustos y preferencias no sirve para tomar decisiones que se ajusten a lo que necesitamos y deseamos?', correctAnswer: false },
      ],
    },
    {
      text: `Por eso la primera etapa para aprender de tus errores es aceptar que se los ha cometido. Esto es fundamental porque nos permite dejar atrás la vergüenza o la culpa, y concentrarnos en las lecciones que podemos extraer de ellos. Después conviene reflexionar sobre lo que sucedió y por qué sucedió. Analiza los detalles y las circunstancias que llevaron al error, y pregúntate qué podrías haber hecho diferente. La reflexión te ayudará a comprender mejor las causas y los efectos del error y te permitirá estar mejor preparado para la próxima vez. Luego, hay que darse cuenta de que podemos aprender del error. El aprendizaje puede ser una habilidad que necesitas mejorar, una nueva estrategia que debes adoptar, o simplemente una mayor conciencia de una debilidad que necesitas trabajar. Luego conviene hacer un plan de acción para asegurarte de que no vuelvas a cometer el mismo error. Este puede incluir cambios en tu comportamiento, la adopción de nuevas estrategias o la búsqueda de asesoramiento o ayuda externa. Para terminar, aplica las lecciones aprendidas en tu vida cotidiana y en tu estudio, y observa cómo te ayudan a evitar errores similares en el futuro. No será una tarea fácil, pero te ayudará a crecer.`,
      questions: [
        { question: '¿La primera etapa para aprender de los errores es aceptar que se los ha cometido?', correctAnswer: true },
        { question: '¿Para aprender de un error conviene evitar pensar en qué se podría haber hecho diferente?', correctAnswer: false },
      ],
    },
    {
      text: `La autoestima es cómo nos sentimos acerca de nosotros mismos y qué tan bien nos valoramos. Es como una imagen mental que tenemos de nosotros mismos y puede ser positiva o negativa. La autoestima se forma a lo largo del tiempo. Muchas cosas pueden influir en cómo nos sentimos acerca de nuestra vida, como nuestras experiencias, la forma en que nos hablan y tratan los demás, lo que nos dicen nuestros padres y cuidadores, e incluso cómo nos tratamos a nosotros mismos. Cuando tenemos la autoestima alta, nos sentimos seguros y felices: tenemos una actitud positiva hacia nosotros y hacia los demás, nos sentimos cómodos en situaciones sociales y confiamos en nuestras habilidades. Además, podemos expresar nuestras necesidades y establecer límites saludables con los demás. En cambio, si es baja, nos sentimos inseguros, sin valorar nuestras habilidades o nuestra apariencia física. También podemos tener miedo de probar cosas nuevas y sentirnos abrumados por los desafíos.`,
      questions: [
        { question: '¿La autoestima es una imagen mental que tenemos de nosotros mismos y puede ser positiva o negativa?', correctAnswer: true },
        { question: '¿La autoestima se forma de un día para otro sin que influyan nuestras experiencias ni la forma en que nos tratan los demás?', correctAnswer: false },
      ],
    },
    {
      text: `Afortunadamente, hay muchas formas en que podemos mejorar nuestra autoestima. Primero, podemos trabajar en nuestra autocomprensión. Esto significa conocer nuestras fortalezas y debilidades, y aprender a aceptarnos y amarnos tal como somos. También podemos establecer metas y trabajar para alcanzarlas. Es importante recordar que las metas no tienen que ser grandes o complicadas. Incluso pequeñas metas pueden ayudarnos a sentirnos bien y aumentar nuestra autoestima. Además, es importante nuestro cuidado personal. Esto puede incluir hacer ejercicio, comer alimentos saludables, dormir lo suficiente y dedicar tiempo a hacer cosas que disfrutamos. Por último, es de gran ayuda tener personas en nuestro círculo social que nos apoyen y nos hagan sentir bien.`,
      questions: [
        { question: '¿Incluso las metas pequeñas pueden ayudarnos a sentirnos bien y aumentar nuestra autoestima?', correctAnswer: true },
        { question: '¿Para mejorar la autoestima, las metas tienen que ser siempre grandes y complicadas?', correctAnswer: false },
      ],
    },
    {
      text: `Ahora vamos a trabajar sobre los límites. Primero, ¿saben qué son los límites? Son como una barrera invisible que nos ayuda a establecer lo que está bien y lo que está mal, lo que nos hace sentir cómodos y lo que nos hace sentir incómodos. Los límites son importantes porque nos ayudan a protegernos a nosotros mismos y a los demás, y nos permiten tener relaciones saludables y respetuosas. Hay dos tipos de límites: los límites personales y los límites sociales. Los primeros son los que establecemos para nuestra vida, por ejemplo al decidir cuándo decir "sí" o "no" a algo que nos piden hacer. Los límites sociales son los límites que ponemos en nuestras interacciones con los demás, como respetar el espacio personal de alguien o no decir palabras ofensivas.`,
      questions: [
        { question: '¿Los límites nos ayudan a protegernos a nosotros mismos y a los demás, y a tener relaciones saludables y respetuosas?', correctAnswer: true },
        { question: '¿Decidir cuándo decir "sí" o "no" a algo que nos piden es un ejemplo de límite social?', correctAnswer: false },
      ],
    },
    {
      text: `Es necesario que aprendamos a identificar nuestros propios límites personales y sociales. Para hacer esto, es útil pensar en cómo nos sentimos cuando algo sucede. Si algo nos hace sentir incómodos o inseguros, es posible que se estén cruzando nuestros límites. También es importante escuchar nuestra voz interior y respetar nuestros propios sentimientos. Además, tenemos que respetar los límites de otras personas. Por eso no debemos presionar a alguien para hacer algo que no quiere hacer o decir, tampoco hacer cosas que puedan hacer sentir incómodas a las demás personas. Si alguien establece un límite con nosotros, debemos respetarlo y no cruzarlo. Cabe destacar que todos tenemos diferentes límites y debemos respetarlos para tener una relación sana y respetuosa.`,
      questions: [
        { question: '¿Si algo nos hace sentir incómodos o inseguros, es posible que se estén cruzando nuestros límites?', correctAnswer: true },
        { question: '¿Está bien presionar a alguien para que haga algo que no quiere hacer?', correctAnswer: false },
      ],
    },
    {
      text: `A veces puede ser difícil para nosotros establecer límites para los demás, especialmente si tenemos miedo de decepcionarlos o de no agradarles. Sin embargo, es importante recordar que establecer límites no significa ser egoístas o malos con nuestras amistades o personas queridas. Al contrario, establecer límites saludables nos permite ser personas más auténticas y honestas en nuestras relaciones, lo que puede fortalecerlas a largo plazo.`,
      questions: [
        { question: '¿Establecer límites saludables nos permite ser personas más auténticas y honestas en nuestras relaciones?', correctAnswer: true },
        { question: '¿Establecer límites significa ser egoístas o malos con nuestras amistades o personas queridas?', correctAnswer: false },
      ],
    },
    {
      text: `Para mejorar en la identificación y respeto de límites, es necesario que aprendamos a comunicarnos de manera efectiva con los demás. Por ese motivo, debemos actuar con honestidad sobre lo que queremos y lo que no queremos, sin juzgar a los demás. Cuando estés hablando de algo que te gusta o no te gusta, trata de ser lo más específico posible. En lugar de decir "no me gusta", di "no me gusta la forma en que hablas conmigo cuando estás enojado/a". Mientras más detalles puedas dar, mejor te podrá comprender la otra persona. También puede servir mucho utilizar el "yo" en lugar de "tú". En lugar de culpar a la otra persona por algo que no te gusta, trata de hablar desde tu propia perspectiva utilizando la palabra "yo". Por ejemplo, en lugar de decir "tú siempre me interrumpes cuando hablo", di "A mí me causa frustración cuando me interrumpes cuando hablo". De esta manera, la otra persona es más propensa a escucharte y entender cómo te sientes.`,
      questions: [
        { question: '¿Ser lo más específico posible ayuda a que la otra persona nos comprenda mejor cuando hablamos de algo que nos gusta o no nos gusta?', correctAnswer: true },
        { question: '¿Es mejor culpar a la otra persona que hablar desde nuestra propia perspectiva usando la palabra "yo"?', correctAnswer: false },
      ],
    },
    {
      text: `Por otra parte, a veces podemos caer en la tentación de decir lo que creemos que la otra persona quiere escuchar, en lugar de lo que realmente pensamos o sentimos. Sin embargo, esto puede llevar a una falta de autenticidad en nuestras relaciones. Actúa con honestidad y comparte tus verdaderos pensamientos y sentimientos. Esto puede ser difícil al principio, pero te ayudará a establecer relaciones más profundas y significativas. Sumado a esto, cuando estás hablando con alguien sobre algo que te gusta o no te gusta, asegúrate de escuchar activamente. Presta atención a sus perspectivas y trata de entender su punto de vista, lo que te ayudará a tener una conversación más equilibrada y a llegar a una solución que sea satisfactoria para ambas partes. Por último, cuando estás comunicando lo que te gusta o no te gusta, trata de buscar soluciones juntos en lugar de culpar a la otra persona o simplemente quejarte. Por ejemplo, si no te gusta que la otra persona siempre llegue tarde, podrías decir "me causa frustración cuando llegas tarde. ¿Podrías tratar de llegar a tiempo la próxima vez o avisarme si vas a llegar tarde?".`,
      questions: [
        { question: '¿Al comunicar lo que nos gusta o no nos gusta conviene escuchar activamente el punto de vista de la otra persona?', correctAnswer: true },
        { question: '¿Conviene decir lo que creemos que la otra persona quiere escuchar en lugar de lo que realmente pensamos o sentimos?', correctAnswer: false },
      ],
    },
  ],
};

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se va a crear/actualizar el documento en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué subiría.\n');

  const ref = db.collection('lecciones').doc(leccion.id);
  const existing = await ref.get();
  const status = existing.exists ? '🔁 YA EXISTE, se actualizaría' : '✅ se va a crear';
  const totalQuestions = leccion.lecciones.reduce((sum, part) => sum + part.questions.length, 0);
  console.log(`${status} — "${leccion.title}" (${leccion.lecciones.length} partes, ${totalQuestions} preguntas)`);

  if (APPLY) {
    const now = new Date().toISOString();
    await ref.set(
      {
        title: leccion.title,
        author: leccion.author,
        lecciones: leccion.lecciones,
        updated_at: now,
        ...(existing.exists ? {} : { created_at: now }),
      },
      { merge: true }
    );
    console.log('\n✅ Listo.');
  } else {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si te parece correcto, corré:');
    console.log('  node scripts/add-autoconocimiento-leccion.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
