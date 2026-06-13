import z from 'zod'

export const cellCreateRequestSchema = z.object({
    cellOptions: z.object({
        cellUUID: z.uuid(),
        cellSecret: z.string(),
        label: z.record(z.string(), z.string()).optional(),
        resource: z.object({
            minimum: z
                .object({
                    memoryMb: z.number().nonnegative().int()
                })
                .optional(),
            maximum: z.object({
                cpuCores: z.number().nonnegative(),
                memoryMb: z.number().nonnegative().int()
            }),
            cpuShares: z.number().nonnegative().int().optional()
        }),
        environment: z.record(z.string(), z.string()).optional(),
        command: z.array(z.string()).optional(),
        imageHash: z.string(),
        policies: z.array(z.string()).optional()
    })
})

export type CellCreateRequest = z.infer<typeof cellCreateRequestSchema>

export const cellUUIDParamSchema = z.object({
    cellUUID: z.uuid()
})

export const workerImageHashParamSchema = z.object({
    imageHash: z.string()
})

export const cellDeleteRequestSchema = cellUUIDParamSchema

export type CellDeleteRequest = z.infer<typeof cellDeleteRequestSchema>

export const cellInspectRequestSchema = cellUUIDParamSchema

export type CellInspectRequest = z.infer<typeof cellInspectRequestSchema>

export const pullDockerImageRequestSchema = workerImageHashParamSchema

export type PullDockerImageRequest = z.infer<typeof pullDockerImageRequestSchema>

export const pushDockerImageRequestSchema = workerImageHashParamSchema

export type PushDockerImageRequest = z.infer<typeof pushDockerImageRequestSchema>

export const restartCellRequestSchema = cellUUIDParamSchema

export type RestartCellRequest = z.infer<typeof restartCellRequestSchema>

export const stopCellRequestSchema = cellUUIDParamSchema

export type StopCellRequest = z.infer<typeof stopCellRequestSchema>

export const startCellRequestSchema = cellUUIDParamSchema

export type StartCellRequest = z.infer<typeof startCellRequestSchema>
