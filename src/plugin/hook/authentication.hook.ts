import { SignaturePayloadShape, signatureService } from '@service/signature.server'
import { logger } from '@util/logger.util'
import { FastifyReply, FastifyRequest } from 'fastify'

interface AuthenticationHeaderShape {
    'x-miaomc-nest-worker-id': string
    'x-miaomc-nest-worker-nonce': string
    'x-miaomc-nest-worker-expired-at': string
    'x-miaomc-nest-worker-signature': string
}

const log = logger.child({ module: 'hook/authentication' })
export const authenticationHook = async (
    req: FastifyRequest<{ Headers: AuthenticationHeaderShape }>,
    reply: FastifyReply
) => {
    const signatureHeaders = req.headers as AuthenticationHeaderShape

    if (
        !signatureHeaders['x-miaomc-nest-worker-id'] ||
        !signatureHeaders['x-miaomc-nest-worker-nonce'] ||
        !signatureHeaders['x-miaomc-nest-worker-expired-at'] ||
        !signatureHeaders['x-miaomc-nest-worker-signature']
    ) {
        log.info(`${req.ip}/Missing authentication headers`)
        return reply.status(401).send({ error: 'Missing authentication headers' })
    }

    const signature = signatureHeaders['x-miaomc-nest-worker-signature']
    const expireAt = parseInt(signatureHeaders['x-miaomc-nest-worker-expired-at'])
    const currentTime = Date.now()

    if (isNaN(expireAt) || expireAt < currentTime) {
        log.info(`${req.ip}/Signature expired`)
        return reply.status(401).send({ error: 'Signature expired' })
    }

    const rawBody = req.rawBody ? (Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf-8') : req.rawBody) : ''

    const verifyPayload = {
        workerId: signatureHeaders['x-miaomc-nest-worker-id'],
        nonce: signatureHeaders['x-miaomc-nest-worker-nonce'],
        expiredAt: parseInt(signatureHeaders['x-miaomc-nest-worker-expired-at']),
        rawBody: rawBody
    } as SignaturePayloadShape

    const verifyResult = signatureService.verifySignature(signature, verifyPayload)

    if (!verifyResult) {
        log.info(`${req.ip}/Invalid signature`)
        return reply.status(401).send({ error: 'Invalid signature' })
    }
}
