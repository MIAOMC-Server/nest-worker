import { createCellHandler, deleteCellHandler } from '@controller/cell.controller'
import { authenticationHook } from '@plugin/hook/authentication.hook'
import { cellCreateRequestSchema, cellDeleteRequestSchema } from '@schema/api/cell/request/request.schema'
import { FastifyInstance } from 'fastify'

export const workerRoute = async (router: FastifyInstance) => {
    router.addHook('preHandler', authenticationHook)

    router.post('/cell', { schema: { body: cellCreateRequestSchema } }, createCellHandler)
    router.get('/cell/:cellUUID/delete', { schema: { params: cellDeleteRequestSchema } }, deleteCellHandler)
}
