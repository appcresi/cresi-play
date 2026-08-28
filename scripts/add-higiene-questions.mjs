/**
 * scripts/add-higiene-questions.mjs
 *
 * Sube las mismas 25 preguntas de higiene (ya cargadas como trivia en
 * add-higiene-trivia.mjs) a la colección `questions`, que es la que
 * alimenta la sección "Preguntas" del panel de administración y desde la
 * que se arman después otras trivias a mano.
 *
 * category: 'Salud', tag: 'Higiene', level: 1 — es una etiqueta nueva,
 * no existía en el banco de 1000 preguntas auditado antes.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué subiría, sin tocar nada:
 *        node scripts/add-higiene-questions.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/add-higiene-questions.mjs --apply
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

const CATEGORY = 'Salud';
const TAG = 'Higiene';
const LEVEL = 1;

const questions = [
  {
    question: '¿Con qué frecuencia es recomendable ducharse?',
    answer: 'Según la actividad, el clima y las necesidades de cada persona',
    options: {
      first: 'Exactamente dos veces por día',
      second: 'Una vez por semana',
      third: 'Solo después de hacer ejercicio',
    },
    resume: 'No existe una frecuencia única para todas las personas. El clima, la actividad física y la transpiración influyen en las necesidades de higiene.',
  },
  {
    question: '¿Qué es suficiente para realizar una higiene genital externa cotidiana?',
    answer: 'Agua y, si se desea, un jabón suave',
    options: {
      first: 'Perfume corporal',
      second: 'Alcohol o desinfectante',
      third: 'Desodorante íntimo',
    },
    resume: 'La higiene genital externa no requiere productos perfumados ni especiales. Una limpieza suave ayuda a mantener la zona limpia sin irritarla.',
  },
  {
    question: '¿Es necesario realizar duchas vaginales para mantener limpia la vagina?',
    answer: 'No, la vagina tiene mecanismos naturales de limpieza',
    options: {
      first: 'Sí, después de cada menstruación',
      second: 'Sí, una vez al día',
      third: 'Sí, después de mantener relaciones sexuales',
    },
    resume: 'La vagina tiene mecanismos naturales de limpieza. Las duchas vaginales pueden alterar su equilibrio y favorecer irritaciones o infecciones.',
  },
  {
    question: '¿Cómo debe realizarse la higiene del pene?',
    answer: 'Lavando suavemente la zona externa y debajo del prepucio cuando corresponda',
    options: {
      first: 'Aplicando alcohol diariamente',
      second: 'Usando abundante perfume',
      third: 'Lavándolo solamente cuando haya mal olor',
    },
    resume: 'Es importante lavar suavemente el pene. Si existe prepucio, debe retraerse suavemente, sin forzar, para limpiar debajo y luego volver a colocarlo.',
  },
  {
    question: '¿Por qué es importante secar los genitales después de lavarlos?',
    answer: 'Para evitar que permanezcan excesivamente húmedos',
    options: {
      first: 'Para eliminar completamente el olor natural',
      second: 'Para evitar que cambie el color de la piel',
      third: 'Para esterilizar la zona',
    },
    resume: 'Secar suavemente la zona ayuda a evitar que permanezca excesivamente húmeda, lo que puede favorecer irritaciones y molestias.',
  },
  {
    question: '¿Por qué es recomendable cambiar la ropa interior regularmente?',
    answer: 'Porque puede acumular sudor, secreciones y microorganismos',
    options: {
      first: 'Porque pierde su color rápidamente',
      second: 'Porque impide el crecimiento corporal',
      third: 'Porque reemplaza la necesidad de bañarse',
    },
    resume: 'La ropa interior está en contacto directo con la piel y puede acumular sudor y secreciones. Cambiarla regularmente forma parte de una buena higiene.',
  },
  {
    question: '¿Qué característica es conveniente que tenga la ropa interior?',
    answer: 'Que sea cómoda y permita una adecuada ventilación',
    options: {
      first: 'Que sea siempre muy ajustada',
      second: 'Que impida la circulación del aire',
      third: 'Que se utilice durante varios días seguidos',
    },
    resume: 'La ropa interior cómoda y transpirable puede ayudar a mantener la piel seca y reducir molestias relacionadas con la humedad y la fricción.',
  },
  {
    question: '¿Es recomendable compartir toallas personales?',
    answer: 'No, es preferible que cada persona tenga su propia toalla',
    options: {
      first: 'Sí, si pertenecen a la misma familia',
      second: 'Sí, siempre que estén húmedas',
      third: 'Sí, si se utilizan solamente para las manos',
    },
    resume: 'Las toallas pueden acumular microorganismos. Por eso es recomendable que cada persona utilice su propia toalla.',
  },
  {
    question: '¿Qué es el smegma?',
    answer: 'Una acumulación de secreciones, células de la piel y aceites naturales',
    options: {
      first: 'Un tipo de infección de transmisión sexual',
      second: 'Un producto de higiene íntima',
      third: 'Una hormona relacionada con la pubertad',
    },
    resume: 'El smegma puede acumularse alrededor de los genitales, especialmente debajo del prepucio. Una higiene suave y regular ayuda a evitar su acumulación excesiva.',
  },
  {
    question: '¿Es importante mantener una buena higiene durante la menstruación?',
    answer: 'Sí, como parte de los cuidados habituales de higiene',
    options: {
      first: 'No, porque la sangre menstrual limpia la zona',
      second: 'Solo durante el primer día',
      third: 'Únicamente cuando hay mucho sangrado',
    },
    resume: 'Durante la menstruación se recomienda mantener una higiene habitual y cambiar los productos menstruales según las indicaciones y las necesidades personales.',
  },
  {
    question: '¿Cuándo conviene cambiar una toallita menstrual descartable?',
    answer: 'Regularmente, antes de que esté completamente saturada',
    options: {
      first: 'Una sola vez durante toda la menstruación',
      second: 'Solamente cuando comienza a desprender olor',
      third: 'Después de varios días de uso continuo',
    },
    resume: 'Las toallitas deben cambiarse regularmente para mantener comodidad e higiene. El tiempo puede variar según el flujo y el producto.',
  },
  {
    question: '¿Qué debe hacerse con un tampón?',
    answer: 'Cambiarlo regularmente siguiendo las indicaciones del producto',
    options: {
      first: 'Mantenerlo durante varios días',
      second: 'Lavarlo y volver a utilizarlo',
      third: 'Cambiarlo solamente cuando termine la menstruación',
    },
    resume: 'Los tampones son productos descartables y deben cambiarse regularmente siguiendo las instrucciones del fabricante y las necesidades del flujo.',
  },
  {
    question: '¿Los productos menstruales reutilizables necesitan limpieza?',
    answer: 'Sí, deben limpiarse siguiendo las indicaciones del fabricante',
    options: {
      first: 'No necesitan ningún tipo de limpieza',
      second: 'Solo deben limpiarse una vez al año',
      third: 'Deben descartarse después de cada uso',
    },
    resume: 'Las copas y otros productos reutilizables requieren una limpieza adecuada según las instrucciones del fabricante.',
  },
  {
    question: '¿Es normal que la vulva tenga algún olor?',
    answer: 'Sí, puede tener un olor natural que varía entre personas',
    options: {
      first: 'Debe oler siempre a perfume',
      second: 'No debería tener ningún olor en absoluto',
      third: 'El olor siempre indica una infección',
    },
    resume: 'La vulva tiene un olor natural que puede variar. Un cambio fuerte o persistente acompañado de picazón, dolor o flujo inusual puede requerir una consulta médica.',
  },
  {
    question: '¿Qué parte de los genitales femeninos corresponde a la zona externa?',
    answer: 'La vulva',
    options: {
      first: 'El cuello uterino',
      second: 'El útero',
      third: 'La vagina interna',
    },
    resume: 'La vulva comprende las estructuras genitales externas. La vagina es un conducto interno que no necesita lavarse por dentro.',
  },
  {
    question: '¿Qué es recomendable hacer después de realizar ejercicio?',
    answer: 'Higienizarse y cambiarse la ropa húmeda o sudada',
    options: {
      first: 'Mantener la ropa sudada durante todo el día',
      second: 'Aplicar perfume sobre la ropa húmeda',
      third: 'Evitar beber agua durante varias horas',
    },
    resume: 'Después de hacer ejercicio conviene quitarse la ropa húmeda y realizar una higiene adecuada para reducir molestias relacionadas con el sudor.',
  },
  {
    question: '¿Es importante lavarse las manos antes y después de manipular productos menstruales?',
    answer: 'Sí, ayuda a reducir la transferencia de microorganismos',
    options: {
      first: 'Solo es necesario si las manos tienen tierra',
      second: 'Solo hay que lavarlas después',
      third: 'No es necesario si el producto es descartable',
    },
    resume: 'Lavarse las manos antes y después de manipular productos menstruales ayuda a reducir la transferencia de microorganismos.',
  },
  {
    question: '¿Cuál es una forma adecuada de limpiar la zona anal?',
    answer: 'Con agua y una limpieza suave',
    options: {
      first: 'Con alcohol',
      second: 'Con productos abrasivos',
      third: 'Con sustancias perfumadas fuertes',
    },
    resume: 'La zona anal es sensible y debe limpiarse suavemente. Los productos irritantes o abrasivos pueden causar molestias y dañar la piel.',
  },
  {
    question: '¿Es recomendable compartir máquinas de afeitar?',
    answer: 'No, las máquinas de afeitar deberían ser de uso personal',
    options: {
      first: 'Sí, si se limpian con agua',
      second: 'Sí, pero solamente entre familiares',
      third: 'Sí, siempre que no tengan mucho uso',
    },
    resume: 'Las máquinas de afeitar pueden entrar en contacto con pequeñas lesiones de la piel. Por higiene, es preferible que sean de uso personal.',
  },
  {
    question: '¿Afeitarse el vello genital es necesario para mantener una buena higiene?',
    answer: 'No, el vello genital no necesita eliminarse para mantener la higiene',
    options: {
      first: 'Sí, es obligatorio',
      second: 'Sí, especialmente durante la pubertad',
      third: 'Solo es necesario durante la menstruación',
    },
    resume: 'El vello genital es normal y no es necesario eliminarlo para mantener una buena higiene. Depilarse o no es una decisión personal.',
  },
  {
    question: '¿La higiene personal reemplaza al preservativo para prevenir ITS?',
    answer: 'No, la higiene no reemplaza los métodos de barrera',
    options: {
      first: 'Sí, si la persona se ducha antes de una relación',
      second: 'Sí, si ambos mantienen una buena higiene',
      third: 'Sí, cuando no existen síntomas',
    },
    resume: 'La higiene es importante para la salud, pero no reemplaza los métodos de barrera, como el preservativo, para reducir el riesgo de muchas ITS.',
  },
  {
    question: '¿Qué conviene hacer ante una picazón genital que persiste?',
    answer: 'Consultar con un profesional de la salud',
    options: {
      first: 'Aplicar cualquier crema disponible',
      second: 'Ignorarla durante varias semanas',
      third: 'Utilizar perfume para disimularla',
    },
    resume: 'La picazón persistente puede tener diferentes causas. Evitar la automedicación y consultar a un profesional permite identificar el origen y recibir el tratamiento adecuado.',
  },
  {
    question: '¿Qué puede significar un cambio importante y persistente en el flujo vaginal?',
    answer: 'Puede ser conveniente consultar con un profesional de la salud',
    options: {
      first: 'Siempre significa falta de higiene',
      second: 'Siempre significa una ITS',
      third: 'Siempre es una señal normal de la menstruación',
    },
    resume: 'Los cambios en cantidad, color, olor o textura del flujo pueden tener distintas causas. No necesariamente indican una ITS ni falta de higiene.',
  },
  {
    question: '¿Es necesario utilizar jabón antibacterial en los genitales todos los días?',
    answer: 'No, no es necesario para la higiene cotidiana',
    options: {
      first: 'Sí, porque elimina todos los microorganismos',
      second: 'Sí, especialmente después de hacer ejercicio',
      third: 'Solo si no se utiliza jabón común',
    },
    resume: 'No es necesario utilizar productos antibacteriales en los genitales como parte de la higiene cotidiana. Pueden irritar la piel y alterar el equilibrio natural de la zona.',
  },
  {
    question: '¿Qué conviene hacer si un producto de higiene provoca ardor o irritación?',
    answer: 'Dejar de utilizarlo y consultar si la molestia persiste',
    options: {
      first: 'Utilizar una cantidad mayor',
      second: 'Mezclarlo con perfume',
      third: 'Seguir utilizándolo hasta que la piel se acostumbre',
    },
    resume: 'Si un producto causa ardor o irritación, conviene suspender su uso. Si las molestias continúan, es recomendable consultar con un profesional de la salud.',
  },
];

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se van a crear documentos en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué subiría.\n');
  console.log(`Colección: questions — categoría "${CATEGORY}" — etiqueta "${TAG}" — nivel ${LEVEL} — ${questions.length} preguntas\n`);

  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question}`);
  });

  if (APPLY) {
    const now = new Date().toISOString();
    const batch = db.batch();
    const collectionRef = db.collection('questions');

    for (const q of questions) {
      const ref = collectionRef.doc();
      batch.set(ref, {
        question: q.question,
        options: q.options,
        answer: q.answer,
        level: LEVEL,
        category: CATEGORY,
        tag: TAG,
        resume: q.resume,
        created_at: now,
        updated_at: now,
      });
    }

    await batch.commit();
    console.log(`\n✅ ${questions.length} preguntas creadas en la colección "questions".`);
  } else {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si la lista de arriba te parece correcta, corré:');
    console.log('  node scripts/add-higiene-questions.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo el script:', err);
  process.exit(1);
});
