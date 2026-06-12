import { dockerService } from '@service/docker.service'
import type Docker from 'dockerode'

import { CellCreateRequest } from '@schema/api/cell/request/request.schema'
import { serviceErrorHandler } from '@util/errorHandler.util'
import { string } from 'zod'

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

        const createOptions = {
            name: cellOptions.cellUUID,
            Image: cellOptions.imageHash,
            Env: resolvedEnv,
            Cmd: cellOptions.command,
            Labels: cellOptions.label,
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
