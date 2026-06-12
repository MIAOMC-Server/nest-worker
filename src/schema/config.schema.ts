import { z } from 'zod'

/**
 * 应用主配置 Schema
 * 在此处拼接你的配置字段，例如：
 *
 * export const appConfigSchema = z.object({
 *     redis: z.object({ host: z.string().default('127.0.0.1'), ... }).default({}),
 *     server: z.object({ port: z.number().default(3000) }).default({}),
 * })
 */
export const appConfigSchema = z.object({
    worker: z.object({
        host: z.string().default('localhost'),
        port: z.number().default(3000),
        cors: z.array(z.string()).default([]),

        credentials: z.object({
            uuid: z.string(),
            secret: z.string()
        }),
        docker: z.object({
            type: z.enum(['socket']).default('socket'),
            socketPath: z.string().default('/var/run/docker.sock')
        })
    }),
    queen: z.object({
        url: z.string().default('https://queen.nest.miaomc.com')
    }),

    heartbeat: z.object({
        interval: z.number().default(5000),
        timeout: z.number().default(10000)
    }),

    confirmation: z.object({
        enableConfirmation: z.boolean().default(true),
        timeout: z.number().default(10000)
    })
})

/** 应用配置类型 */
export type AppConfig = z.infer<typeof appConfigSchema>

/** 默认配置 */
export const defaultConfig = (uuid: string, secret: string, socketPath: string = '/var/run/docker.sock'): AppConfig => {
    return {
        worker: {
            host: 'localhost',
            port: 3000,
            cors: [],

            credentials: {
                uuid: uuid,
                secret: secret
            },
            docker: {
                type: 'socket',
                socketPath: socketPath
            }
        },
        queen: {
            url: 'https://queen.nest.miaomc.com'
        },

        heartbeat: {
            interval: 5000,
            timeout: 10000
        },

        confirmation: {
            enableConfirmation: true,
            timeout: 10000
        }
    }
}
