import type { CustomResponse } from '@/types/response'
import type { Trivia } from '@/types/trivia'
import { API_URL } from '@/utils/helpers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<unknown> | Response> {
  const id = params.id

  const response = await fetch(API_URL.concat(`/trivias/${id}`), { next: { revalidate: 3600 } })

  if (response.ok) {
    const body = await response.json() as CustomResponse<Trivia>
    return NextResponse.json({ data: body.data })
  }

  return NextResponse.error()
}
