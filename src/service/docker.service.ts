import { AppConfigs } from '@util/appConfig.util'
import { structuredReturn } from '@util/common.util'
import { serviceErrorHandler } from '@util/errorHandler.util'
import { logger } from '@util/logger.util'
import Docker from 'dockerode'
import { existsSync } from 'fs'

const log = logger.child({ module: 'docker/service' })

export const findDockerSocket = () => {
    const unixPaths = [
        '/var/run/docker.sock',
        '/run/docker.sock',
        `${process.env.HOME}/.docker/run/docker.sock`,
        `${process.env.HOME}/.docker/desktop/docker.sock`
    ]

    let path: string | undefined

    for (const paths of unixPaths) {
        if (existsSync(paths)) {
            return structuredReturn(true, 200, 'Docker socket found', { path: paths })
        }
    }
    return structuredReturn(false, 200, 'Docker socket not found', { path: undefined })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceReturn<T = any> = { status: boolean; code: number; message: string; data: T | null }

class DockerService {
    private docker: Docker

    private registryNotEmpty: boolean = false
    private registryEndpoint: string | undefined = undefined
    private registryUsername: string | undefined = undefined
    private registryPassword: string | undefined = undefined

    constructor() {
        const socket = AppConfigs.worker.docker.socketPath
        if (!socket) throw new Error('Docker socket path is not defined in configuration')

        this.docker = new Docker({ socketPath: socket })
        log.info(`DockerService initialized with socket: ${socket}`)

        if (
            AppConfigs.worker.docker.registry.endpoint ||
            AppConfigs.worker.docker.registry.username ||
            AppConfigs.worker.docker.registry.password
        ) {
            this.registryNotEmpty = true
            this.registryEndpoint = AppConfigs.worker.docker.registry.endpoint
            this.registryUsername = AppConfigs.worker.docker.registry.username
            this.registryPassword = AppConfigs.worker.docker.registry.password
        }
    }

    public async createCell(options: Docker.ContainerCreateOptions): Promise<ServiceReturn<Docker.Container>> {
        try {
            log.info({ name: options.name, image: options.Image }, 'creating cell')
            const cell = await this.docker.createContainer(options)
            return structuredReturn(true, 200, 'cell created', cell)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to create cell')
        }
    }

    public async deleteCell(cellId: string, force = false): Promise<ServiceReturn> {
        try {
            const cell = this.docker.getContainer(cellId)
            log.info({ cellId, force }, 'removing cell')
            await cell.remove({ force })
            return structuredReturn(true, 200, 'cell removed', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to remove cell')
        }
    }

    public getCell(cellId: string): Docker.Container {
        return this.docker.getContainer(cellId)
    }

    public async listCells(options?: Docker.ContainerListOptions): Promise<ServiceReturn<Docker.ContainerInfo[]>> {
        try {
            const cells = await this.docker.listContainers(options)
            return structuredReturn(true, 200, 'cells listed', cells)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to list cells')
        }
    }

    public async startCell(cellId: string): Promise<ServiceReturn> {
        try {
            const cell = this.docker.getContainer(cellId)
            log.info({ cellId }, 'starting cell')
            await cell.start()
            return structuredReturn(true, 200, 'cell started', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to start cell')
        }
    }

    public async stopCell(cellId: string, timeout?: number): Promise<ServiceReturn> {
        try {
            const cell = this.docker.getContainer(cellId)
            log.info({ cellId, timeout }, 'stopping cell')
            await cell.stop({ t: timeout })
            return structuredReturn(true, 200, 'cell stopped', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to stop cell')
        }
    }

    public async restartCell(cellId: string, timeout?: number): Promise<ServiceReturn> {
        try {
            const cell = this.docker.getContainer(cellId)
            log.info({ cellId, timeout }, 'restarting cell')
            await cell.restart({ t: timeout })
            return structuredReturn(true, 200, 'cell restarted', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to restart cell')
        }
    }

    public async inspectCell(cellId: string): Promise<ServiceReturn<Docker.ContainerInspectInfo>> {
        try {
            const cell = this.docker.getContainer(cellId)
            const info = await cell.inspect()
            return structuredReturn(true, 200, 'cell inspected', info)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to inspect cell')
        }
    }

    public async getCellLogs(
        cellId: string,
        options?: { tail?: number; since?: number }
    ): Promise<ServiceReturn<string>> {
        try {
            const cell = this.docker.getContainer(cellId)
            const logStream = await cell.logs({
                stdout: true,
                stderr: true,
                tail: options?.tail ?? 100,
                since: options?.since,
                timestamps: true
            })
            return structuredReturn(true, 200, 'cell logs retrieved', logStream.toString('utf-8'))
        } catch (err) {
            return serviceErrorHandler(err, 'failed to get cell logs')
        }
    }

    public async pullImage(image: string, tag = 'latest'): Promise<ServiceReturn> {
        const fullImage = image.includes(':') ? image : `${image}:${tag}`
        try {
            log.info({ image: fullImage }, 'pulling image')
            const stream = await this.docker.pull(fullImage)

            await new Promise<void>((resolve, reject) => {
                this.docker.modem.followProgress(stream, (err: Error | null) => {
                    if (err) reject(err)
                    else resolve()
                })
            })

            log.info({ image: fullImage }, 'image pulled successfully')
            return structuredReturn(true, 200, 'image pulled', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to pull image')
        }
    }

    public async listImages(options?: Docker.ListImagesOptions): Promise<ServiceReturn<Docker.ImageInfo[]>> {
        try {
            const images = await this.docker.listImages(options)
            return structuredReturn(true, 200, 'images listed', images)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to list images')
        }
    }

    public async deleteImage(imageId: string, force = false): Promise<ServiceReturn> {
        try {
            const image = this.docker.getImage(imageId)
            log.info({ imageId, force }, 'removing image')
            await image.remove({ force })
            return structuredReturn(true, 200, 'image removed', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to remove image')
        }
    }

    public async inspectImage(imageId: string): Promise<ServiceReturn<Docker.ImageInspectInfo>> {
        try {
            const image = this.docker.getImage(imageId)
            const info = await image.inspect()
            return structuredReturn(true, 200, 'image inspected', info)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to inspect image')
        }
    }

    public async pruneImages(filter?: object): Promise<ServiceReturn<Docker.PruneImagesInfo>> {
        try {
            log.info({ filter }, 'pruning unused images')
            const result = await this.docker.pruneImages(filter ?? {})
            return structuredReturn(true, 200, 'images pruned', result)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to prune images')
        }
    }

    public async pushImage(imageHash: string): Promise<ServiceReturn> {
        if (!this.registryNotEmpty) {
            log.warn('registry credentials are not fully set, skipping push')
            return structuredReturn(false, 400, 'registry credentials are not fully set', null)
        }

        try {
            const target = this.docker.getImage(imageHash)
            const stream = await target.push({
                authconfig: {
                    username: this.registryUsername,
                    password: this.registryPassword,
                    serveraddress: this.registryEndpoint
                }
            })

            await new Promise<void>((resolve, reject) => {
                this.docker.modem.followProgress(stream, (err: Error | null) => {
                    if (err) reject(err)
                    else resolve()
                })
            })

            log.info({ imageHash }, 'image pushed successfully')
            return structuredReturn(true, 200, 'image pushed successfully', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to push image')
        }
    }

    public async pruneCells(filter?: object): Promise<ServiceReturn<Docker.PruneContainersInfo>> {
        try {
            log.info({ filter }, 'pruning stopped cells')
            const result = await this.docker.pruneContainers(filter ?? {})
            return structuredReturn(true, 200, 'cells pruned', result)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to prune cells')
        }
    }

    public async ping(): Promise<ServiceReturn<boolean>> {
        try {
            await this.docker.ping()
            return structuredReturn(true, 200, 'docker daemon is reachable', true)
        } catch (err) {
            return serviceErrorHandler(err, 'docker daemon is not reachable')
        }
    }

    public async getSystemInfo(): Promise<ServiceReturn> {
        try {
            const info = await this.docker.info()
            return structuredReturn(true, 200, 'system info retrieved', info)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to get system info')
        }
    }

    public async getVersion(): Promise<ServiceReturn<Docker.DockerVersion>> {
        try {
            const version = await this.docker.version()
            return structuredReturn(true, 200, 'version retrieved', version)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to get docker version')
        }
    }
}

export const dockerService = new DockerService()
