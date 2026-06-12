import { processCellCreate, processCellDelete } from '@processor/cell.processor'
import { CellCreateRequest, CellDeleteRequest } from '@schema/api/cell/request/request.schema'
import { structuredResponse } from '@util/common.util'
import { controllerErrorHandler } from '@util/errorHandler.util'
import { FastifyReply, FastifyRequest } from 'fastify'

export const createCellHandler = async (req: FastifyRequest<{ Body: CellCreateRequest }>, reply: FastifyReply) => {
    const cellOptions = req.body?.cellOptions

    if (!cellOptions) return reply.status(400).send(structuredResponse(false, 400, 'Invalid request body', null))

    try {
        const createResult = await processCellCreate(cellOptions)
        if (!createResult.status)
            return reply
                .status(createResult.code)
                .send(structuredResponse(false, createResult.code, createResult.message, null))

        return reply.status(201).send(structuredResponse(true, 201, 'Cell created successfully', createResult.data))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to create cell')
    }
}

export const deleteCellHandler = async (req: FastifyRequest<{ Params: CellDeleteRequest }>, reply: FastifyReply) => {
    const cellUUID = req.params?.cellUUID

    if (!cellUUID) return reply.status(400).send(structuredResponse(false, 400, 'Cell UUID is required', null))

    try {
        const deleteResult = await processCellDelete(cellUUID)
        if (!deleteResult.status)
            return reply
                .status(deleteResult.code)
                .send(structuredResponse(false, deleteResult.code, deleteResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Cell deleted successfully', null))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to delete cell')
    }
}
