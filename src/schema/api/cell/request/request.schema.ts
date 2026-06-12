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

export const cellDeleteRequestSchema = z.object({
    cellUUID: z.string()
})

export type CellDeleteRequest = z.infer<typeof cellDeleteRequestSchema>
