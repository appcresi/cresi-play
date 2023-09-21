import jwt from 'jsonwebtoken'

export function signJwt (payload: Record<string, any>): string {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET')
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d',
    algorithm: 'HS256'
  })
}

export function decodeJwt (token: string): Record<string, any> {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET')
  }

  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256']
  }) as Record<string, any>
}
