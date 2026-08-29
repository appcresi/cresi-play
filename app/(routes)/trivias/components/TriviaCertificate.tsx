'use client'

import { format } from 'date-fns'
import esLocale from 'date-fns/locale/es'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { IconDownload, IconAward } from '@tabler/icons-react'
import { getActivityById } from '@/lib/activities'

// @ts-ignore
import html2pdf from 'html2pdf.js'

const ACCENT = getActivityById('trivias')?.color ?? '#1976D2'

interface CertificateData {
  name: string
  trivia: string
  percentage: number
  endorsedBy?: string
}

export default function TriviaCertificate (): JSX.Element {
  const [data, setData] = useState<CertificateData>()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const targetRef = useRef<HTMLDivElement>(null)

  // El useEffect tiene que llamarse siempre, en el mismo orden, en cada
  // render — antes se llamaba DESPUÉS de un `return` condicional (si no
  // había token), lo cual viola las reglas de hooks de React. Ahora el
  // hook siempre se ejecuta; es el CONTENIDO del efecto el que decide no
  // hacer nada si falta el token.
  useEffect(() => {
    if (token === null) return

    fetch('/api/certificado', {
      headers: {
        Authorization: token
      }
    }).then(async (response) => {
      await response.json()
        .then((value) => { setData(value) })
    }
    ).catch((error) => { console.error(error) })
  }, [token])

  if (token === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Token Inválido</h2>
          <p className="text-gray-600 dark:text-gray-400">No tienes un código válido para acceder a este certificado.</p>
        </div>
      </div>
    )
  }

  const filename = typeof data !== 'undefined' ? data.name.replace(' ', '').toLowerCase().concat('-', data.trivia, '-cresi.pdf') : 'certificado-cresi.pdf'

  const handleDownloadPDF = () => {
    if (targetRef.current && html2pdf) {
      const element = targetRef.current
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      html2pdf()
        .set({
          margin: 5,
          filename: filename,
          image: { type: 'png', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'landscape' as const, unit: 'mm', format: 'a4' }
        })
        .from(element)
        .save()
    }
  }

  const date = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: esLocale })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <IconAward size={28} style={{ color: ACCENT }} />
                Tu Certificado
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">
                Descargá tu certificado en formato PDF. Podría haber pequeñas diferencias visuales según el dispositivo, pero siempre podrás descargarlo correctamente.
              </p>
            </div>

            <button
              type='button'
              onClick={handleDownloadPDF}
              className='inline-flex items-center gap-2 px-6 py-3 text-white rounded-full 
                       font-semibold hover:opacity-90 transition-colors shadow-sm'
              style={{ backgroundColor: ACCENT }}
            >
              <IconDownload size={20} />
              Descargar PDF
            </button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
          {/* Todo lo de acá adentro se captura tal cual con html2canvas para
              el PDF — por eso todo va con `style` inline en vez de clases de
              Tailwind (que html2canvas no siempre resuelve bien), y por eso
              el logo es un <img> de toda la vida en vez de next/image (evita
              el proxy /_next/image, que complica la captura). */}
          <div ref={targetRef} style={{ width: '1100px', height: '755px', background: `linear-gradient(135deg, ${ACCENT}12, ${ACCENT}05)`, padding: '32px', fontFamily: 'inherit' }}>
            {/* Marco doble — borde grueso de color + borde fino separado,
                look clásico de diploma en vez del recuadro simple de antes. */}
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              border: `3px solid ${ACCENT}`,
              borderRadius: '12px',
              padding: '10px'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                border: `1px solid ${ACCENT}55`,
                borderRadius: '8px',
                padding: '36px 56px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Header: logo + nombre de la plataforma bien visible */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/cresi-logo.webp" alt="CrESI" style={{ height: '48px', marginBottom: '14px' }} />
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: ACCENT,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    margin: '0 0 10px 0'
                  }}>
                    Plataforma de Educación Sexual Integral
                  </p>
                  <h1 style={{
                    fontSize: '30px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 10px 0',
                    textAlign: 'center'
                  }}>
                    Certificado de Finalización
                  </h1>
                  <div style={{
                    width: '80px',
                    height: '4px',
                    backgroundColor: ACCENT,
                    borderRadius: '2px'
                  }} />
                </div>

                {/* Cuerpo: nombre + descripción, centrado en el espacio
                    restante para que el layout no se apriete ni se estire
                    según cuánto texto tenga cada trivia. */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 14px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: 'center'
                  }}>
                    Se certifica que
                  </p>

                  <div style={{
                    backgroundColor: `${ACCENT}10`,
                    border: `3px solid ${ACCENT}`,
                    borderRadius: '8px',
                    padding: '18px 44px',
                    marginBottom: '22px'
                  }}>
                    <p style={{
                      fontSize: '40px',
                      fontWeight: 'bold',
                      color: ACCENT,
                      margin: 0,
                      textAlign: 'center'
                    }}>
                      {data?.name.toLocaleUpperCase()}
                    </p>
                  </div>

                  <div style={{ maxWidth: '720px', textAlign: 'center' }}>
                    <p style={{
                      fontSize: '17px',
                      color: '#374151',
                      lineHeight: '1.7',
                      margin: 0
                    }}>
                      completó exitosamente la trivia <span style={{ fontWeight: 'bold', color: ACCENT }}>&quot;{data?.trivia}&quot;</span> en{' '}
                      <span style={{ fontWeight: 'bold' }}>CrESI</span>, demostrando un{' '}
                      <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{data?.percentage}%</span> de respuestas correctas.
                    </p>

                    {data?.endorsedBy && (
                      <p style={{
                        fontSize: '12px',
                        color: '#059669',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '12px 0 0 0'
                      }}>
                        Avalada por {data.endorsedBy}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#6b7280',
                    marginTop: '20px'
                  }}>
                    <span>📅</span>
                    <p style={{ fontSize: '13px', margin: 0 }}>{date}</p>
                  </div>
                </div>

                {/* Pie: marca CrESI a la izquierda + firmas a la derecha, en
                    vez de firmas centradas solas — así "CrESI" queda escrito
                    en el certificado incluso si alguien no lee el cuerpo. */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${ACCENT}30`,
                  paddingTop: '18px'
                }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: 0 }}>CrESI</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>cresi.com.ar</p>
                  </div>

                  <div style={{ display: 'flex', gap: '72px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Andrés Obregón
                      </p>
                      <div style={{
                        width: '160px',
                        height: '2px',
                        backgroundColor: '#9ca3af',
                        margin: '10px 0 6px 0'
                      }} />
                      <p style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0
                      }}>
                        CEO
                      </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Gladys Cabral
                      </p>
                      <div style={{
                        width: '160px',
                        height: '2px',
                        backgroundColor: '#9ca3af',
                        margin: '10px 0 6px 0'
                      }} />
                      <p style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0
                      }}>
                        CTO
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: `${ACCENT}0D`, border: `1px solid ${ACCENT}30` }}>
          <p className="text-sm text-center" style={{ color: ACCENT }}>
            💡 Este certificado es válido como constancia de tu aprendizaje y puede ser compartido en redes sociales o tu portfolio.
          </p>
        </div>
      </div>
    </div>
  )
}