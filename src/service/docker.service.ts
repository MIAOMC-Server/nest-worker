import { AppConfigs } from '@util/appConfig.util'
import { structuredReturn } from '@util/common.util'
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
        const exist = existsSync(paths)
        if (exist) {
            path = paths
        }
    }
    return structuredReturn(!!path, 200, path ? 'Docker socket found' : 'Docker socket not found', { path })
}

class DockerService {
    private docker: Docker

    constructor() {
        const socket = AppConfigs.worker.docker.socketPath
        if (!socket) throw new Error('Docker socket path is not defined in configuration')

        this.docker = new Docker({ socketPath: socket })
        log.info(`DockerService initialized with socket: ${socket}`)
    }

    public createContainer(options: Docker.ContainerCreateOptions): Promise<Docker.Container> {
        log.info({ name: options.name, image: options.Image }, 'creating container')
        return this.docker.createContainer(options)
    }

    public async deleteContainer(containerId: string, force = false): Promise<void> {
        const container = this.docker.getContainer(containerId)
        log.info({ containerId, force }, 'removing container')
        await container.remove({ force })
    }

    public getContainer(containerId: string): Docker.Container {
        return this.docker.getContainer(containerId)
    }

    public listContainers(options?: Docker.ContainerListOptions): Promise<Docker.ContainerInfo[]> {
        return this.docker.listContainers(options)
    }

    public async startContainer(containerId: string): Promise<void> {
        const container = this.docker.getContainer(containerId)
        log.info({ containerId }, 'starting container')
        await container.start()
    }

    public async stopContainer(containerId: string, timeout?: number): Promise<void> {
        const container = this.docker.getContainer(containerId)
        log.info({ containerId, timeout }, 'stopping container')
        await container.stop({ t: timeout })
    }

    public async restartContainer(containerId: string, timeout?: number): Promise<void> {
        const container = this.docker.getContainer(containerId)
        log.info({ containerId, timeout }, 'restarting container')
        await container.restart({ t: timeout })
    }

    public async inspectContainer(containerId: string): Promise<Docker.ContainerInspectInfo> {
        const container = this.docker.getContainer(containerId)
        return container.inspect()
    }

    public async getContainerLogs(containerId: string, options?: { tail?: number; since?: number }): Promise<string> {
        const container = this.docker.getContainer(containerId)
        const logStream = await container.logs({
            stdout: true,
            stderr: true,
            tail: options?.tail ?? 100,
            since: options?.since,
            timestamps: true
        })
        return logStream.toString('utf-8')
    }
    

    public async pullImage(image: string, tag = 'latest'): Promise<void> {
        const fullImage = image.includes(':') ? image : `${image}:${tag}`
        log.info({ image: fullImage }, 'pulling image')

        const stream = await this.docker.pull(fullImage)

        return new Promise((resolve, reject) => {
            this.docker.modem.followProgress(stream, (err: Error | null, _output: unknown[]) => {
                if (err) {
                    log.error({ image: fullImage, error: err.message }, 'failed to pull image')
                    reject(err)
                } else {
                    log.info({ image: fullImage }, 'image pulled successfully')
                    resolve()
                }
            })
        })
    }

    public async listImages(options?: Docker.ListImagesOptions): Promise<Docker.ImageInfo[]> {
        return this.docker.listImages(options)
    }

    public async deleteImage(imageId: string, force = false): Promise<void> {
        const image = this.docker.getImage(imageId)
        log.info({ imageId, force }, 'removing image')
        await image.remove({ force })
    }

    public async inspectImage(imageId: string): Promise<Docker.ImageInspectInfo> {
        const image = this.docker.getImage(imageId)
        return image.inspect()
    }

    public async pruneImages(filter?: object): Promise<Docker.PruneImagesInfo> {
        log.info({ filter }, 'pruning unused images')
        return this.docker.pruneImages(filter ?? {})
    }

    public async pruneContainers(filter?: object): Promise<Docker.PruneContainersInfo> {
        log.info({ filter }, 'pruning stopped containers')
        return this.docker.pruneContainers(filter ?? {})
    }

    public async ping(): Promise<boolean> {
        try {
            await this.docker.ping()
            return true
        } catch {
            return false
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async getSystemInfo(): Promise<any> {
        return this.docker.info()
    }

    public getVersion(): Promise<Docker.DockerVersion> {
        return this.docker.version()
    }
}

export const dockerService = new DockerService()
