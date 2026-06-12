import { structuredResponse, structuredReturn } from '@util/common.util'
import { logger } from '@util/logger.util'
import { FastifyReply } from 'fastify'

export const controllerErrorHandler = (reply: FastifyReply, error: unknown, fallbackMessage?: string) => {
    const message = fallbackMessage || 'An unexpected error occurred'
    logger.error({ error }, 'Controller error caught: %s', message)
    reply.status(500).send(structuredResponse(false, 500, message, { error: 'Internal Error' }))
}

export const serviceErrorHandler = (error: unknown, fallbackMessage?: string) => {
    const message = fallbackMessage || 'An unexpected error occurred in service'
    logger.error({ error }, 'Service error caught: %s', message)
    return structuredReturn(false, 500, message, null)
}
