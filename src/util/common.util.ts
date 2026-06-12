import { randomBytes } from 'crypto'

export const generateHex = (length: number): string => {
    return randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
}

export const structuredReturn = <T>(status: boolean, code: number, message: string, data?: T) => {
    return {
        status,
        code,
        message,
        data
    }
}
