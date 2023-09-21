'use client'

import { format } from 'date-fns'
import esLocale from 'date-fns/locale/es'
import { useSearchParams } from 'next/navigation'
import { Margin, usePDF } from 'react-to-pdf'
import { IconDownload } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

interface CertificateData {
  name: string
  trivia: string
  percentage: number
}

export default function TriviaCertificate (): JSX.Element {
  const [data, setData] = useState<CertificateData>()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return <p>No tienes un código válido.</p>
  }

  useEffect(() => {
    fetch('/api/certificado', {
      headers: {
        Authorization: token
      }
    }).then(async (response) => await response.json()
      .then((value) => setData(value))
    ).catch((error) => console.error(error))
  }, [])

  const { toPDF, targetRef } = usePDF({
    method: 'save',
    filename: `${data?.name?.replace(' ', '')}-${data?.trivia}-cresi.pdf`,
    page: { margin: Margin.SMALL, orientation: 'landscape' }
  })

  const date = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: esLocale })

  return (
    <>
      <div className='px-4'>
        <p className='my-4 text-2xl'>Descargá tu certificado</p>
        <p className='my-2 text-gray-600'>Nota: podrían verse incoherencias estéticas en ciertos dispositivos pero es posible descargar el certificado en cualquier caso.</p>
        <button
          type='button'
          onClick={() => toPDF()}
          className='px-4 py-2 my-6  flex gap-2 items-center rounded-full font-semibold bg-primary text-white'
        >
          Descargar
          <IconDownload />
        </button>
      </div>

      <div className='m-auto bg-primary-dark lg:w-[1100px]' ref={targetRef}>
        <section className='w-[1100px] m-auto flex flex-col items-center justify-center bg-primary-light lg:w-[95%] lg:min-h-[755px]'>
          <h1 className='my-4 text-4xl font-semibold'>Certificado de CRESI</h1>
          <h2 className='text-xl'>SE EXTIENDE ESTA CERTIFICACIÓN A</h2>
          <p className='my-4 text-6xl font-semibold text-primary'>{data?.name.toLocaleUpperCase()}</p>
          <p className='my-6 text-xl'>Por haber aprobado la trivia <b>"{data?.trivia}"</b>, con un porcentaje del {data?.percentage}% de aciertos.</p>
          <p className='mt-6 text-gray-600'>{date}</p>

          <div className='mt-24 w-full flex justify-evenly'>
            <div>
              <p className='my-2 text-lg'>Andrés Obregón</p>
              <div className='w-48 h-1 rounded-full bg-primary-dark' />
              <p className='my-1 text-gray-600'>CEO</p>
            </div>

            <div>
              <p className='my-2 text-lg'>Ticiano Morvan</p>
              <div className='w-48 h-1 rounded-full bg-primary-dark' />
              <p className='my-1 text-gray-600'>CTO</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
