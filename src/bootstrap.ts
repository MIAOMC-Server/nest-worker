import cors from '@fastify/cors'
import { StartupLoop } from '@service/loop.service'
import { readConfig } from '@util/appConfig.util'
import { logger } from '@util/logger.util'
import Fastify from 'fastify'

const loggerConfig = (funcName: string) => logger.child({ module: `bootstrap/${funcName}` })

export const bootstrap = async () => {
    const log = loggerConfig('bootstrap')
    const config = readConfig()

    log.info('config loaded successfully')
    log.info('starting fastify server...')

    const app = Fastify({
        logger: true,
        trustProxy: true
    })

    const resolvedOrigins = config.worker.cors.length > 0 ? config.worker.cors : '*'

    app.register(cors, { origin: resolvedOrigins })
    app.listen({ port: config.worker.port, host: config.worker.host })

    // 启动任务循环
    void StartupLoop()
}
