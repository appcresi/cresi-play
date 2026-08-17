import { type Metadata } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseFirestore'

// Antes esto era estático: TODAS las trivias (pueden ser cientos)
// compartían el mismo título/descripción, así que Google las veía como
// contenido duplicado entre sí. Ahora se arma por trivia, con su nombre
// real — cada una puede indexarse y posicionar por separado.
const FALLBACK_METADATA: Metadata = {
  title: 'Aprendé jugando con nuestras trivias | CrESI',
  description: 'Jugá a nuestras trivias y aprendé sobre distintos temas con una trivia interactiva y dinámica de preguntas y respuestas.'
}

export async function generateMetadata ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const snap = await getDoc(doc(db, 'trivia', id))
    if (!snap.exists()) return FALLBACK_METADATA

    const data = snap.data() as { name?: string, questions?: unknown[] }
    const name = data.name ?? 'Trivia'
    const questionCount = Array.isArray(data.questions) ? data.questions.length : undefined
    const title = `${name} | Trivia CrESI`
    const description = `Jugá la trivia "${name}"${typeof questionCount === 'number' ? ` de ${questionCount} preguntas` : ''} sobre Educación Sexual Integral, gratis y sin registrarte.`

    return {
      title,
      description,
      openGraph: {
        type: 'website',
        locale: 'es_AR',
        url: `https://jugar.cresi.com.ar/trivias/${id}`,
        siteName: 'CrESI',
        title,
        description,
        images: [{ url: '/illustration-1.jpg', width: 1200, height: 630, alt: name }]
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/illustration-1.jpg']
      },
      alternates: {
        canonical: `https://jugar.cresi.com.ar/trivias/${id}`
      }
    }
  } catch (err) {
    console.error('❌ No se pudo generar metadata para la trivia', id, err)
    return FALLBACK_METADATA
  }
}

export default function TriviaLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return children as JSX.Element
}
