import {
    processCellCreate,
    processCellDelete,
    processCellList,
    processInspectCell,
    processListDockerImages,
    processPullDockerImages,
    processPushDockerImage,
    processRestartCell,
    processStartCell,
    processStopCell
} from '@processor/cell.processor'
import {
    CellCreateRequest,
    CellDeleteRequest,
    CellInspectRequest,
    PullDockerImageRequest,
    PushDockerImageRequest,
    StartCellRequest,
    StopCellRequest
} from '@schema/api/cell/request/request.schema'
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

export const listCellsHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const listResult = await processCellList()
        if (!listResult.status)
            return reply
                .status(listResult.code)
                .send(structuredResponse(false, listResult.code, listResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Cells listed successfully', listResult.data))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to list cells')
    }
}

export const inspectCellHandler = async (req: FastifyRequest<{ Params: CellInspectRequest }>, reply: FastifyReply) => {
    const cellUUID = req.params?.cellUUID

    if (!cellUUID) return reply.status(400).send(structuredResponse(false, 400, 'Cell UUID is required', null))

    try {
        const inspectResult = await processInspectCell(cellUUID)
        if (!inspectResult.status)
            return reply
                .status(inspectResult.code)
                .send(structuredResponse(false, inspectResult.code, inspectResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Cell inspected successfully', inspectResult.data))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to inspect cell')
    }
}

export const pullDockerImageHandler = async (
    req: FastifyRequest<{ Body: PullDockerImageRequest }>,
    reply: FastifyReply
) => {
    const imageHash = req.body?.imageHash

    if (!imageHash) return reply.status(400).send(structuredResponse(false, 400, 'Image hash is required', null))

    try {
        const pullResult = await processPullDockerImages(imageHash)
        if (!pullResult.status)
            return reply
                .status(pullResult.code)
                .send(structuredResponse(false, pullResult.code, pullResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Image pull initiated successfully', null))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to pull docker image')
    }
}

export const pushDockerImageHandler = async (
    req: FastifyRequest<{ Body: PushDockerImageRequest }>,
    reply: FastifyReply
) => {
    const imageHash = req.body?.imageHash

    if (!imageHash) return reply.status(400).send(structuredResponse(false, 400, 'Image hash is required', null))

    try {
        const pushResult = await processPushDockerImage(imageHash)
        if (!pushResult.status)
            return reply
                .status(pushResult.code)
                .send(structuredResponse(false, pushResult.code, pushResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Image push initiated successfully', null))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to push docker image')
    }
}

export const listDockerImagesHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const listResult = await processListDockerImages()
        if (!listResult.status)
            return reply
                .status(listResult.code)
                .send(structuredResponse(false, listResult.code, listResult.message, null))

        return reply
            .status(200)
            .send(structuredResponse(true, 200, 'Docker images listed successfully', listResult.data))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to list docker images')
    }
}

export const restartCellHandler = async (req: FastifyRequest<{ Params: CellInspectRequest }>, reply: FastifyReply) => {
    const cellUUID = req.params?.cellUUID

    if (!cellUUID) return reply.status(400).send(structuredResponse(false, 400, 'Cell UUID is required', null))

    try {
        const restartResult = await processRestartCell(cellUUID)
        if (!restartResult.status)
            return reply
                .status(restartResult.code)
                .send(structuredResponse(false, restartResult.code, restartResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Cell restart initiated successfully', null))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to restart cell')
    }
}

export const stopCellHandler = async (req: FastifyRequest<{ Params: StopCellRequest }>, reply: FastifyReply) => {
    const cellUUID = req.params?.cellUUID

    if (!cellUUID) return reply.status(400).send(structuredResponse(false, 400, 'Cell UUID is required', null))

    try {
        const stopResult = await processStopCell(cellUUID)
        if (!stopResult.status)
            return reply
                .status(stopResult.code)
                .send(structuredResponse(false, stopResult.code, stopResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Cell stop initiated successfully', null))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to stop cell')
    }
}

export const startCellHandler = async (req: FastifyRequest<{ Params: StartCellRequest }>, reply: FastifyReply) => {
    const cellUUID = req.params?.cellUUID

    if (!cellUUID) return reply.status(400).send(structuredResponse(false, 400, 'Cell UUID is required', null))

    try {
        const startResult = await processStartCell(cellUUID)
        if (!startResult.status)
            return reply
                .status(startResult.code)
                .send(structuredResponse(false, startResult.code, startResult.message, null))

        return reply.status(200).send(structuredResponse(true, 200, 'Cell started successfully', null))
    } catch (error) {
        controllerErrorHandler(reply, error, 'Failed to start cell')
    }
}
