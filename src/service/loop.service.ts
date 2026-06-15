import { dockerListenerStarted, listenDockerEvents } from '@service/docker.service'
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
        // 这里可以处理周期逻辑，可以只用 取模 来控制不同事件的频率
        if (tick % 5 === 0) {
            // 每 5 秒检查一次 Docker 事件监听状态，如果没有启动则尝试启动
            if (!dockerListenerStarted) listenDockerEvents()

            systemInfo = getSystemResources()
        }

        return tick
    } catch (err) {
        console.error(`Error in loop tick ${tick}:`, err)
        return tick
    }
}
