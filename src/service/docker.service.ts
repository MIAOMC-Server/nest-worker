import { AppConfigs } from '@util/appConfig.util'
import { structuredReturn } from '@util/common.util'
import { serviceErrorHandler } from '@util/errorHandler.util'
import { logger } from '@util/logger.util'
import Docker from 'dockerode'
import { existsSync } from 'fs'
import { createInterface } from 'readline/promises'

const CELL_ID_PREFIX = 'nest_'

const log = logger.child({ module: 'docker/service' })

export const findDockerSocket = () => {
    const unixPaths = [
        '/var/run/docker.sock',
        '/run/docker.sock',
        `${process.env.HOME}/.docker/run/docker.sock`,
        `${process.env.HOME}/.docker/desktop/docker.sock`
    ]

    for (const paths of unixPaths) {
        if (existsSync(paths)) {
            return structuredReturn(true, 200, 'Docker socket found', { path: paths })
        }
    }
    return structuredReturn(false, 200, 'Docker socket not found', { path: undefined })
}

class DockerService {
    private docker: Docker

    private registryNotEmpty: boolean = false
    private registryEndpoint: string | undefined = undefined
    private registryUsername: string | undefined = undefined
    private registryPassword: string | undefined = undefined

    private resolveCellId(cellId: string): string {
        return cellId.startsWith(CELL_ID_PREFIX) ? cellId : `${CELL_ID_PREFIX}${cellId}`
    }

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

    public async createCell(options: Docker.ContainerCreateOptions) {
        try {
            const name = options.name ? this.resolveCellId(options.name) : undefined
            const resolvedOptions = { ...options, name }
            log.info({ name, image: options.Image }, 'creating cell')
            const cell = await this.docker.createContainer(resolvedOptions)

            return structuredReturn(true, 200, 'cell created', cell)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to create cell')
        }
    }

    public async deleteCell(cellId: string, force = false) {
        try {
            const resolvedId = this.resolveCellId(cellId)
            const cell = this.docker.getContainer(resolvedId)
            log.info({ cellId: resolvedId, force }, 'removing cell')
            await cell.remove({ force })
            return structuredReturn(true, 200, 'cell removed', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to remove cell')
        }
    }

    public getCell(cellId: string): Docker.Container {
        return this.docker.getContainer(this.resolveCellId(cellId))
    }

    public async listCells(options: Docker.ContainerListOptions = {}) {
        try {
            const existingFilters = typeof options.filters === 'object' ? options.filters : {}

            const mergedOptions: Docker.ContainerListOptions = {
                ...options,
                filters: {
                    ...existingFilters,
                    label: [...(existingFilters.label ?? []), 'miaomc.nest.cell=true']
                }
            }

            const cells = await this.docker.listContainers(mergedOptions)
            return structuredReturn(true, 200, 'cells listed', cells)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to list cells')
        }
    }

    public async startCell(cellId: string) {
        try {
            const resolvedId = this.resolveCellId(cellId)
            const cell = this.docker.getContainer(resolvedId)
            log.info({ cellId: resolvedId }, 'starting cell')
            await cell.start()
            return structuredReturn(true, 200, 'cell started', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to start cell')
        }
    }

    public async stopCell(cellId: string, timeout?: number) {
        try {
            const resolvedId = this.resolveCellId(cellId)
            const cell = this.docker.getContainer(resolvedId)
            log.info({ cellId: resolvedId, timeout }, 'stopping cell')
            await cell.stop({ t: timeout })
            return structuredReturn(true, 200, 'cell stopped', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to stop cell')
        }
    }

    public async restartCell(cellId: string, timeout?: number) {
        try {
            const resolvedId = this.resolveCellId(cellId)
            const cell = this.docker.getContainer(resolvedId)
            log.info({ cellId: resolvedId, timeout }, 'restarting cell')
            await cell.restart({ t: timeout })
            return structuredReturn(true, 200, 'cell restarted', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to restart cell')
        }
    }

    public async inspectCell(cellId: string) {
        try {
            const resolvedId = this.resolveCellId(cellId)
            const cell = this.docker.getContainer(resolvedId)
            const info = await cell.inspect()
            return structuredReturn(true, 200, 'cell inspected', info)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to inspect cell')
        }
    }

    public async getCellLogs(cellId: string, options?: { tail?: number; since?: number }) {
        try {
            const resolvedId = this.resolveCellId(cellId)
            const cell = this.docker.getContainer(resolvedId)
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

    public async pullImage(image: string, tag = 'latest') {
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

    public async listImages(options?: Docker.ListImagesOptions) {
        try {
            const images = await this.docker.listImages(options)
            return structuredReturn(true, 200, 'images listed', images)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to list images')
        }
    }

    public async deleteImage(imageId: string, force = false) {
        try {
            const image = this.docker.getImage(imageId)
            log.info({ imageId, force }, 'removing image')
            await image.remove({ force })
            return structuredReturn(true, 200, 'image removed', null)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to remove image')
        }
    }

    public async inspectImage(imageId: string) {
        try {
            const image = this.docker.getImage(imageId)
            const info = await image.inspect()
            return structuredReturn(true, 200, 'image inspected', info)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to inspect image')
        }
    }

    public async pruneImages(filter?: object) {
        try {
            log.info({ filter }, 'pruning unused images')
            const result = await this.docker.pruneImages(filter ?? {})
            return structuredReturn(true, 200, 'images pruned', result)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to prune images')
        }
    }

    public async pushImage(imageHash: string) {
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

    public async pruneCells(filter?: object) {
        try {
            log.info({ filter }, 'pruning stopped cells')
            const result = await this.docker.pruneContainers(filter ?? {})
            return structuredReturn(true, 200, 'cells pruned', result)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to prune cells')
        }
    }

    public async ping() {
        try {
            await this.docker.ping()
            return structuredReturn(true, 200, 'docker daemon is reachable', true)
        } catch (err) {
            return serviceErrorHandler(err, 'docker daemon is not reachable')
        }
    }

    public async getSystemInfo() {
        try {
            const info = await this.docker.info()
            return structuredReturn(true, 200, 'system info retrieved', info)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to get system info')
        }
    }

    public async getVersion() {
        try {
            const version = await this.docker.version()
            return structuredReturn(true, 200, 'version retrieved', version)
        } catch (err) {
            return serviceErrorHandler(err, 'failed to get docker version')
        }
    }

    public async dockerEventStream() {
        const mergedOptions: Docker.GetEventsOptions = {
            filters: {
                type: ['container'],
                event: ['start', 'die', 'stop', 'destroy', 'health_status', 'oom'],
                label: ['miaomc.nest.cell=true']
            }
        }

        return this.docker.getEvents(mergedOptions)
    }
}

export const dockerService = new DockerService()

type DockerCellState = 'created' | 'running' | 'exited' | 'paused' | 'dead' | 'restarting' | 'removing' | 'unknown'

export const getCellStatus = async () => {
    let status = {
        created: 0,
        running: 0,
        exited: 0,
        paused: 0,
        dead: 0,
        restarting: 0,
        removing: 0,
        unknown: 0
    } satisfies Record<DockerCellState, number>

    let cellList: Array<Record<string, string>> = []

    let statusCount = {
        cells: 0,
        counter: status,
        cellList
    }

    const listCellsResult = await dockerService.listCells()
    if (!listCellsResult.status) return structuredReturn(false, 500, 'docker is unavailable', listCellsResult.data)

    const cells = listCellsResult.data
    if (!cells || cells.length === 0) return structuredReturn(true, 200, 'no cells found', statusCount)

    statusCount.cells = cells.length

    for (const cell of cells) {
        const cellState = cell.State.toLowerCase()
        const cellUUID =
            cell.Labels?.['miaomc.nest.cell.uuid'] ||
            (cell.Names?.[0] || '').replace(/^\//, '').replace(CELL_ID_PREFIX, '')

        const cellStatus = { uuid: cellUUID, state: cellState }
        statusCount.cellList.push(cellStatus)

        if (cellState in status) {
            statusCount.counter[cellState as DockerCellState]++
        } else {
            statusCount.counter.unknown++
        }
    }

    return structuredReturn(true, 200, 'cell status retrieved', statusCount)
}

export let dockerListenerStarted = false
export let dockerListenerStarting = false

export const listenDockerEvents = async () => {
    // 1. 防止重复建立流：同时检查 started 和 starting 状态
    if (dockerListenerStarting || dockerListenerStarted) return

    dockerListenerStarting = true

    let readline: ReturnType<typeof createInterface> | undefined = undefined
    let stream: NodeJS.ReadableStream | undefined = undefined

    const removeListeners = () => {
        dockerListenerStarted = false
        dockerListenerStarting = false

        readline?.close()
        stream?.removeAllListeners()
    }

    try {
        stream = await dockerService.dockerEventStream()
        readline = createInterface({ input: stream })

        // 2. 状态纠正：确保流成功建立后再标记为已启动
        dockerListenerStarted = true
        dockerListenerStarting = false

        readline.on('line', (line) => {
            try {
                void resolveDockerEvent('line', line)
            } catch (err) {
                log.error(`Error processing Docker event line: \n${err}`)
            }
        })

        readline.on('error', (err) => {
            log.error(`Error reading Docker event stream: \n${err}`)
            void resolveDockerEvent('error', String(err))
            removeListeners()
        })

        readline.on('close', () => {
            void resolveDockerEvent('close')
            removeListeners()
        })
    } catch (err) {
        removeListeners()
        log.error(`Error listening to Docker events: \n${err}`)
    }
}

export const resolveDockerEvent = (_eventType: string, _event?: string) => {
    // TODO: 这里可以根据事件类型和状态来处理不同的逻辑，例如更新数据库状态、发送通知等
    // WARN: 注意使用 resolveJSON 来转换 JSON 类型
}
