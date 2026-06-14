import {
    createCellHandler,
    deleteCellHandler,
    inspectCellHandler,
    listCellsHandler,
    listDockerImagesHandler,
    pullDockerImageHandler,
    pushDockerImageHandler,
    restartCellHandler,
    startCellHandler,
    stopCellHandler
} from '@controller/cell.controller'
import { authenticationHook } from '@plugin/hook/authentication.hook'
import {
    cellCreateRequestSchema,
    cellDeleteRequestSchema,
    cellInspectRequestSchema,
    pullDockerImageRequestSchema,
    pushDockerImageRequestSchema,
    restartCellRequestSchema,
    startCellRequestSchema,
    stopCellRequestSchema
} from '@schema/api/cell/request/request.schema'
import { FastifyInstance } from 'fastify'

export const workerRoute = async (router: FastifyInstance) => {
    router.addHook('preHandler', authenticationHook)

    // cell management
    router.post('/cell', { schema: { body: cellCreateRequestSchema } }, createCellHandler)
    router.get('/cells', listCellsHandler)
    router.get('/cell/:cellUUID/inspect', { schema: { params: cellInspectRequestSchema } }, inspectCellHandler)
    router.get('/cell/:cellUUID/delete', { schema: { params: cellDeleteRequestSchema } }, deleteCellHandler)
    router.get('/cell/:cellUUID/start', { schema: { params: startCellRequestSchema } }, startCellHandler)
    router.get('/cell/:cellUUID/stop', { schema: { params: stopCellRequestSchema } }, stopCellHandler)
    router.get('/cell/:cellUUID/restart', { schema: { params: restartCellRequestSchema } }, restartCellHandler)

    // image management
    router.get('/images', listDockerImagesHandler)
    router.post('/image/pull', { schema: { body: pullDockerImageRequestSchema } }, pullDockerImageHandler)
    router.post('/image/push', { schema: { body: pushDockerImageRequestSchema } }, pushDockerImageHandler)
}
