import { dockerListenerStarted, dockerListenerStarting, listenDockerEvents } from '@service/docker.service'
import { getSystemResources, getSystemResourcesReturn } from '@service/system.service'

export let systemInfo: getSystemResourcesReturn = getSystemResources()

export const StartupLoop = async () => {
    let loopTick = 0
    while (true) {
        loopTick++
        void resolveLoopEvents(loopTick)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 每秒执行一次
    }
}

export const resolveLoopEvents = async (tick: number) => {
    try {
        if (tick % 5 === 0) {
            systemInfo = getSystemResources()
        }

        if (tick % 30 === 0) {
            if (!dockerListenerStarted && !dockerListenerStarting) void listenDockerEvents()
        }

        return tick
    } catch (err) {
        console.error(`Error in loop tick ${tick}:`, err)
        return tick
    }
}
