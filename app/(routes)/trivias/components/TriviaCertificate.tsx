'use client'

import { format } from 'date-fns'
import esLocale from 'date-fns/locale/es'
import { useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import { IconDownload, IconAward } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

// @ts-ignore
import html2pdf from 'html2pdf.js'

interface CertificateData {
  name: string
  trivia: string
  percentage: number
}

export default function TriviaCertificate (): JSX.Element {
  const [data, setData] = useState<CertificateData>()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const targetRef = useRef<HTMLDivElement>(null)

  if (token === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Token Inválido</h2>
          <p className="text-gray-600">No tienes un código válido para acceder a este certificado.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <IconAward size={28} className="text-blue-600" />
                Tu Certificado
              </h1>
              <p className="text-gray-600 text-sm max-w-2xl">
                Descargá tu certificado en formato PDF. Podría haber pequeñas diferencias visuales según el dispositivo, pero siempre podrás descargarlo correctamente.
              </p>
            </div>
            
            <button
              type='button'
              onClick={handleDownloadPDF}
              className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg 
                       font-medium hover:bg-blue-700 transition-colors shadow-sm'
            >
              <IconDownload size={20} />
              Descargar PDF
            </button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div ref={targetRef} style={{ width: '1100px', height: '755px', backgroundColor: '#f0f4ff', padding: '48px' }}>
            <div style={{ 
              width: '100%', 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '3px solid #3b82f6',
              borderRadius: '8px',
              padding: '40px'
            }}>
              {/* Header Badge */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '40px', color: 'white' }}>🏆</span>
                </div>
              </div>

              {/* Title */}
              <h1 style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#1f2937',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Certificado de Completación
              </h1>
              
              <div style={{
                width: '100px',
                height: '4px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px',
                marginBottom: '32px'
              }}></div>

              {/* Subtitle */}
              <h2 style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '32px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center'
              }}>
                Se extiende esta certificación a
              </h2>

              {/* Name */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '3px solid #3b82f6',
                borderRadius: '8px',
                padding: '24px 48px',
                marginBottom: '32px'
              }}>
                <p style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  {data?.name.toLocaleUpperCase()}
                </p>
              </div>

              {/* Description */}
              <div style={{ maxWidth: '700px', textAlign: 'center', marginBottom: '32px' }}>
                <p style={{
                  fontSize: '18px',
                  color: '#374151',
                  lineHeight: '1.75',
                  margin: 0
                }}>
                  Por haber completado exitosamente la trivia <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>&quot;{data?.trivia}&quot;</span>, 
                  demostrando un <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{data?.percentage}%</span> de respuestas correctas.
                </p>
              </div>

              {/* Date */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#6b7280',
                marginBottom: '48px'
              }}>
                <span>📅</span>
                <p style={{ fontSize: '14px', margin: 0 }}>{date}</p>
              </div>

              {/* Signatures */}
              <div style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '96px',
                marginTop: 'auto'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    marginBottom: '12px',
                    margin: 0
                  }}>
                    Andrés Obregón
                  </p>
                  <div style={{ 
                    width: '192px', 
                    height: '2px', 
                    backgroundColor: '#9ca3af',
                    margin: '12px 0 8px 0'
                  }} />
                  <p style={{ 
                    fontSize: '12px', 
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
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    marginBottom: '12px',
                    margin: 0
                  }}>
                    Gladys Cabral
                  </p>
                  <div style={{ 
                    width: '192px', 
                    height: '2px', 
                    backgroundColor: '#9ca3af',
                    margin: '12px 0 8px 0'
                  }} />
                  <p style={{ 
                    fontSize: '12px', 
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

        {/* Footer Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 text-center">
            💡 Este certificado es válido como constancia de tu aprendizaje y puede ser compartido en redes sociales o tu portfolio.
          </p>
        </div>
      </div>
    </div>
  )
}