import { CellCreateRequest } from '@schema/api/cell/request/request.schema'
import { dockerService } from '@service/docker.service'
import { serviceErrorHandler } from '@util/errorHandler.util'
import type Docker from 'dockerode'

export const processCellCreate = async (cellOptions: CellCreateRequest['cellOptions']) => {
    try {
        const resolvedEnv = cellOptions.environment
            ? Object.entries(cellOptions.environment).map(([key, value]) => `${key}=${value}`)
            : []

        resolvedEnv.unshift(`MIAOMC_NEST_CELL_SECRET=${cellOptions.cellSecret}`)
        resolvedEnv.unshift(`MIAOMC_NEST_CELL_UUID=${cellOptions.cellUUID}`)

        const resolvedMinimumResource: Docker.ContainerCreateOptions['HostConfig'] = cellOptions.resource.minimum
            ? {
                  MemoryReservation: cellOptions.resource.minimum.memoryMb * 1024 * 1024
              }
            : undefined

        const resolvedMaximumResource: Docker.ContainerCreateOptions['HostConfig'] = {
            Memory: cellOptions.resource.maximum.memoryMb * 1024 * 1024,
            NanoCpus: cellOptions.resource.maximum.cpuCores * 1e9
        }

        const resolvedResource: Docker.ContainerCreateOptions['HostConfig'] = {
            ...resolvedMinimumResource,
            ...resolvedMaximumResource,
            CpuShares: cellOptions.resource.cpuShares
        }

        const resolvedLabel = {
            ...cellOptions.label,
            'miaomc.nest.cell': 'true',
            'miaomc.nest.cell.uuid': cellOptions.cellUUID
        }

        const createOptions = {
            name: cellOptions.cellUUID,
            Image: cellOptions.imageHash,
            Env: resolvedEnv,
            Cmd: cellOptions.command,
            Labels: resolvedLabel,
            HostConfig: resolvedResource
        } as Docker.ContainerCreateOptions

        const createResult = await dockerService.createCell(createOptions)
        return createResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to create cell')
    }
}

export const processCellDelete = async (cellUUID: string) => {
    try {
        //TODO: 后续向 Queen 发送 删除 的 confirmation 请求，确认后删除，否则不处理
        const deleteResult = await dockerService.deleteCell(cellUUID, true)
        return deleteResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to delete cell')
    }
}

export const processCellList = async () => {
    try {
        const listOptions: Docker.ContainerListOptions = {
            filters: {
                label: ['miaomc.nest.cell=true']
            },
            all: true
        }

        const listResult = await dockerService.listCells(listOptions)
        return listResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to list cells')
    }
}

export const processInspectCell = async (cellUUID: string) => {
    try {
        const cellDetail = await dockerService.inspectCell(cellUUID)
        return cellDetail
    } catch (err) {
        return serviceErrorHandler(err, 'failed to inspect cell')
    }
}

export const processPullDockerImages = async (imageHash: string) => {
    try {
        const pullResult = await dockerService.pullImage(imageHash)
        return pullResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to pull docker images')
    }
}

export const processPushDockerImage = async (imageHash: string) => {
    try {
        const syncResult = await dockerService.pushImage(imageHash)
        return syncResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to sync docker images')
    }
}

export const processListDockerImages = async () => {
    try {
        const listResult = await dockerService.listImages()
        return listResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to list docker images')
    }
}

export const processRestartCell = async (cellUUID: string) => {
    try {
        // TODO: 后续向 Queen 发送 重启 的 confirmation 请求，确认后重启，否则不处理
        const restartResult = await dockerService.restartCell(cellUUID)
        return restartResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to restart cell')
    }
}

export const processStopCell = async (cellUUID: string) => {
    try {
        // TODO: 后续向 Queen 发送 停止 的 confirmation 请求，确认后停止，否则不处理
        const stopResult = await dockerService.stopCell(cellUUID)
        return stopResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to stop cell')
    }
}

export const processStartCell = async (cellUUID: string) => {
    try {
        const startResult = await dockerService.startCell(cellUUID)
        return startResult
    } catch (err) {
        return serviceErrorHandler(err, 'failed to start cell')
    }
}
