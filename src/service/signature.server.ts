import { AppConfigs } from '@util/appConfig.util'
import { createHmac } from 'crypto'

export interface SignaturePayloadShape {
    rawBody: string
    expiredAt: number
    nonce: string
    workerId: string
}

class SignatureService {
    private workerId: string
    private workerSecret: string

    constructor() {
        const { uuid, secret } = AppConfigs.worker.credentials
        if (!uuid || !secret) throw new Error('Worker credentials are not defined in configuration')

        this.workerId = uuid
        this.workerSecret = secret
    }

    public generateSignature(payload: SignaturePayloadShape): string {
        if (!payload.rawBody || !payload.expiredAt || !payload.nonce || !payload.workerId)
            throw new Error('Invalid signature payload')

        if (payload.workerId !== this.workerId) throw new Error('Worker ID does not match')

        const dataToSign = `${payload.workerId}:${payload.expiredAt}:${payload.nonce}:${payload.rawBody}`
        const createHMACResult = createHmac('sha256', this.workerSecret).update(dataToSign).digest('hex')

        return createHMACResult
    }

    public verifySignature(signature: string, payload: SignaturePayloadShape): boolean {
        try {
            const expectedSignature = this.generateSignature(payload)
            return signature === expectedSignature && payload.expiredAt > Date.now()
        } catch (error) {
            return false
        }
    }
}

export const signatureService = new SignatureService()
