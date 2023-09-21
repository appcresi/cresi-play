import { decodeJwt, signJwt } from '@/utils/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function GET (request: NextRequest): Promise<NextResponse<unknown>> {
  const token = request.headers.get('Authorization')

  if (!token) {
    return NextResponse.next()
  }

  const decoded = decodeJwt(token)

  return NextResponse.json(decoded)
}

export async function POST (request: NextRequest): Promise<NextResponse<unknown>> {
  const requestBody = await request.json()

  const jwt = signJwt(requestBody)

  return NextResponse.json({
    token: jwt
  })
}
