import { createCellHandler, deleteCellHandler } from '@controller/cell.controller'
import { authenticationHook } from '@plugin/hook/authentication.hook'
import { FastifyInstance } from 'fastify'

export const workerRoute = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticationHook)

    app.post('/cell', createCellHandler)
    app.get('/cell/:cellUUID/delete', deleteCellHandler)
}
