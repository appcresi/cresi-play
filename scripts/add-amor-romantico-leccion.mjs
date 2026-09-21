/**
 * scripts/add-amor-romantico-leccion.mjs
 *
 * Crea la lección "El amor romántico y las relaciones" en la colección
 * `lecciones`, con author: 'CRESI' (igual que las que se crean desde el
 * panel de administración).
 *
 * El texto se dividió en 9 partes respetando el orden y las palabras del
 * original (solo se corrigieron erratas: palabra repetida, "se dé",
 * puntuación y "Por otra parte"), con 2 preguntas de verdadero/falso por parte (una verdadera y
 * una falsa), como las lecciones existentes. No tiene imágenes todavía: el
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
 *        node scripts/add-amor-romantico-leccion.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/add-amor-romantico-leccion.mjs --apply
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
  id: 'amor-romantico-y-relaciones',
  title: 'El amor romántico y las relaciones',
  author: 'CRESI',
  lecciones: [
    {
      text: `El enamoramiento es una experiencia emocional intensa y apasionada que se produce cuando una persona se siente atraída hacia otra. Es una fase temprana de una relación en la que se experimentan sentimientos de euforia, felicidad, nerviosismo y excitación. Durante el enamoramiento, las personas pueden idealizar a su pareja, centrarse en sus cualidades positivas y minimizar sus defectos. Esta idealización puede llevar a que se sienta una conexión profunda y se desee estar cerca de la otra persona tanto como sea posible. También, podemos sentir que estamos enamorados por algunas señales físicas como palpitaciones, sudoración, nerviosismo y rubor. Esto se debe a una mayor actividad en el sistema nervioso simpático y la liberación de ciertas hormonas, como la dopamina. A veces se puede confundir el enamoramiento con el amor verdadero, que es una experiencia más duradera y estable que se desarrolla a lo largo del tiempo y que implica una conexión emocional profunda y una aceptación mutua de la pareja en su totalidad, con sus fortalezas y debilidades. Enamorarse es el primer paso para una relación amorosa a largo plazo, pero también puede ser algo temporal que no siempre dura en el tiempo.`,
      questions: [
        { question: '¿El enamoramiento es una fase temprana de una relación en la que se experimentan sentimientos de euforia, felicidad y nerviosismo?', correctAnswer: true },
        { question: '¿El enamoramiento y el amor verdadero son exactamente lo mismo?', correctAnswer: false },
      ],
    },
    {
      text: `Se da un amor romántico cuando caemos en la idealización extrema de la pareja, sin ver las debilidades o defectos de la otra persona. Caracterizado por la intensidad emocional, la pasión y la exclusividad. A menudo se asocia con el concepto de "amor verdadero" o "alma gemela". Pero, cuando este tipo de amor se convierte en un amor no correspondido o una relación tóxica, puede ser problemático. En cambio, el amor mutuo es cuando dos personas se sienten amadas y ese amor es correspondido. Existe un equilibrio de poder en las relaciones mutuas y ambas partes están dispuestas a cooperar para mantener la relación. Esto conduce a relaciones sanas y duraderas.`,
      questions: [
        { question: '¿En el amor mutuo dos personas se sienten amadas y ese amor es correspondido?', correctAnswer: true },
        { question: '¿El amor romántico se caracteriza por ver con claridad las debilidades y los defectos de la pareja?', correctAnswer: false },
      ],
    },
    {
      text: `En el amor romántico aparecen muchas veces los celos. Estos son sentimientos que pueden darse en todo tipo de relación, pero es especialmente común en las relaciones románticas. Estos pueden desencadenarse por amenazas a las relaciones o por una baja autoestima. A veces, pueden percibirse como una señal de amor y cuidado, pero en el fondo representa una señal de inseguridad y control. Resulta necesario aprender a lidiar con los celos de manera efectiva y saludable para que no destruyan la relación. El control del amor es cuando una persona trata de controlar los pensamientos, sentimientos o acciones de su pareja. Esto puede incluir actos de aislamiento, manipulación e intimidación, también puede ser un signo de abuso emocional o físico. Es importante reconocer las señales del amor controlador y buscar ayuda si es necesario para salir de una relación abusiva. Algunas señales son:`,
      questions: [
        { question: '¿Los celos pueden ser una señal de inseguridad y control aunque a veces se perciban como una señal de amor y cuidado?', correctAnswer: true },
        { question: '¿El amor controlador es siempre una muestra normal de cuidado y nunca puede ser un signo de abuso?', correctAnswer: false },
      ],
    },
    {
      text: `Que haya control excesivo de algunas de las personas de la pareja, como por ejemplo el vigilar constantemente las actividades de la pareja, como el uso del teléfono móvil o la computadora, los horarios de trabajo y las reuniones con amigos. También, puede darse una exigencia para que la pareja informe todos los detalles de sus actividades y decisiones, incluyendo cómo se visten, a dónde van y con quién se relacionan. A veces, la persona controladora busca limitar el contacto de la pareja con amigos y familiares, y hacer que dependan únicamente del controlador para su apoyo emocional. Por otra parte, este tipo de personas tiende a criticar la apariencia física de la pareja y exigir que cambie su apariencia; negarse a permitir que la pareja trabaje fuera de la casa o tomar decisiones financieras importantes; o amenazar con dejar a la pareja si no cumple con las demandas de la persona controladora. En ocasiones más extremas una persona controladora puede utilizar la violencia física o emocional, esto es una señal clara de una relación tóxica y debe ser tratada seriamente.`,
      questions: [
        { question: '¿Vigilar constantemente el teléfono, los horarios o las reuniones con amigos de la pareja es una señal de control excesivo?', correctAnswer: true },
        { question: '¿Limitar el contacto de la pareja con sus amigos y familiares es una muestra saludable de amor?', correctAnswer: false },
      ],
    },
    {
      text: `Hay que tener en cuenta que el control excesivo en una relación de pareja puede manifestarse de muchas maneras diferentes, y que cualquier forma de control que limite la libertad y autonomía de la pareja puede ser perjudicial para su bienestar emocional y mental. Si experimentas alguno de estos comportamientos o notas que alguien en una relación cercana a ti lo hace, es importante buscar ayuda y apoyo. Trabajar la comunicación en la pareja, manteniendo el respeto y la confianza es esencial para que se dé una relación sana.`,
      questions: [
        { question: '¿Cualquier forma de control que limite la libertad y la autonomía de la pareja puede ser perjudicial para su bienestar emocional y mental?', correctAnswer: true },
        { question: '¿El respeto y la confianza son innecesarios para que se dé una relación sana?', correctAnswer: false },
      ],
    },
    {
      text: `Las relaciones de pareja son una de las formas más importantes de interacción humana, pero también pueden ser una fuente de conflicto y violencia. Estos a menudo están relacionados con el género, el poder y la comunicación y pueden tomar muchas formas, incluida la violencia de género, la violencia física, psicológica y verbal. En este contexto, es importante abordar estos temas con claridad y precisión para comprender mejor la dinámica de la violencia en las relaciones para poder prevenirlas y combatirlas. La violencia de género es un tipo de violencia que se dirige específicamente a personas de un determinado género, generalmente mujeres. Este tipo de violencia puede tomar muchas formas, desde abuso físico y sexual hasta acoso y discriminación en el lugar de trabajo. Es un problema grave y generalizado a nivel mundial que tiene serias consecuencias para la salud física y mental de las personas que la padecen. La violencia de género no es culpa de la víctima y que todas las personas tienen derecho a vivir libres de violencia y de discriminación basada en el género.`,
      questions: [
        { question: '¿La violencia de género no es culpa de la víctima?', correctAnswer: true },
        { question: '¿La violencia de género se dirige por igual a personas de cualquier género, sin distinción?', correctAnswer: false },
      ],
    },
    {
      text: `Cuando hablamos de violencia física nos referimos a cualquier agresión física contra otra persona. Esto puede incluir puñetazos, patadas, empujones, asfixia o algún otro acto que cause daño físico. Cualquier persona puede ser físicamente abusiva, incluidos familiares, amistades, parejas o extraños. Pero, no siempre tiene que haber golpes para que haya violencia, porque también existe el abuso psicológico que causa daño emocional o psicológico a otra persona. Algunas de sus características son: intimidación, humillación, manipulación, aislamiento y control. Las personas que utilizan la manipulación psicológica a menudo buscan controlar a sus víctimas para obtener beneficios personales, como el poder, el dinero, el sexo o la atención. Puede ocurrir en muchas situaciones diferentes, incluyendo relaciones personales, amistades, lugares de trabajo e incluso en la propia familia.`,
      questions: [
        { question: '¿La intimidación, la humillación, la manipulación, el aislamiento y el control son características del abuso psicológico?', correctAnswer: true },
        { question: '¿Para que haya violencia siempre tiene que haber golpes?', correctAnswer: false },
      ],
    },
    {
      text: `Por otro lado tenemos el abuso verbal. Se trata del uso de las palabras despectivas o que hieren para causar daño emocional o psicológico a otra persona. Esto puede incluir insultos, menosprecios, gritos, amenazas o cualquier otra comunicación con la intención de causar daño.`,
      questions: [
        { question: '¿Los insultos, los menosprecios y los gritos pueden ser una forma de abuso verbal?', correctAnswer: true },
        { question: '¿El abuso verbal no causa daño emocional porque no hay contacto físico?', correctAnswer: false },
      ],
    },
    {
      text: `La prevención de la violencia es una tarea importante que requiere la participación de toda la sociedad. La educación y sensibilización sobre la violencia de género, la violencia física, psicológica y verbal es fundamental para prevenirla. Se deben fomentar relaciones basadas en el respeto y la igualdad. La comunicación efectiva es fundamental para prevenir el abuso en las relaciones íntimas. Es importante que las parejas aprendan a comunicarse abierta y honestamente para poder resolver los conflictos pacíficamente. Por otro lado, es necesario que las personas que sufren violencia de pareja puedan tener acceso a servicios de apoyo, como asesoramiento, apoyo médico y jurídico. Estos servicios deben estar disponibles para todos.`,
      questions: [
        { question: '¿Comunicarse de forma abierta y honesta ayuda a resolver los conflictos pacíficamente y a prevenir el abuso en las relaciones?', correctAnswer: true },
        { question: '¿La prevención de la violencia es una tarea que corresponde solamente a las personas que la sufren?', correctAnswer: false },
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
    console.log('  node scripts/add-amor-romantico-leccion.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
