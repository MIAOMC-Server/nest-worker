import { workerRoute } from '@plugin/route/worker.route'
import { structuredResponse } from '@util/common.util'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export const appRouter = (app: FastifyInstance) => {
    const router = app.withTypeProvider<ZodTypeProvider>()

    router.register(
        (v1) => {
            v1.register(workerRoute, { prefix: '/worker' })
        },
        { prefix: '/api/v1' }
    )

    router.setErrorHandler(async (error: Error & { statusCode?: number; status?: number }, _request, reply) => {
        const rawCode = error.statusCode ?? error.status
        const normalizedCode = rawCode && rawCode >= 400 && rawCode < 500 ? 400 : rawCode && rawCode >= 500 ? 500 : 500
        const message = normalizedCode === 400 ? 'Bad Request' : 'Internal Server Error'

        return reply.status(normalizedCode).send(structuredResponse(false, normalizedCode as 400 | 500, message))
    })
}
