import { getSystemResources, getSystemResourcesReturn } from '@service/system.service'
import { serviceErrorHandler } from '@util/errorHandler.util'

export const StartupLoop = async () => {
    // 启动时先获取一次系统资源信息
    let systemInfo: getSystemResourcesReturn = getSystemResources()

    // 后续每5秒更新一次
    setInterval(() => {
        systemInfo = getSystemResources()
    }, 5000)

    const MAX_RETRIES = 256
    let retryCount = 0
    while (true) {
        if (retryCount >= MAX_RETRIES) {
            console.error('Startup loop reached maximum retry limit. Exiting loop.')
            process.exit(1)
        }

        try {
            // Dosomething when startup, for example every 1 min to send a request to queen for heartbeat or check for updates
            // 循环每 30 秒 执行一次，可以是发送 心跳信息给 queen
            await new Promise((resolve) => setTimeout(resolve, 30000))
            retryCount = 0
        } catch (error) {
            retryCount++
            serviceErrorHandler(error, 'Error in StartupLoop')
        }
    }
}
