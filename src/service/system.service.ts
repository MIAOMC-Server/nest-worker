import os from 'os'

export interface getSystemResourcesReturn {
    process: {
        cpuUsage: NodeJS.CpuUsage
        memoryUsage: NodeJS.MemoryUsage
    }
    system: {
        memory: {
            total: number
            free: number
            used: number
            percentage: number
        }
        cpu: {
            total: number
            free: number
            used: number
            percentage: number
        }
    }
}
let prevCpuTimes: { total: number; idle: number } | null = null

const getCpuTimes = () => {
    const cpus = os.cpus()
    const total = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0)
    const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0)
    return { total, idle }
}

export const getSystemResources = (): getSystemResourcesReturn => {
    const processCpuUsage = process.cpuUsage()
    const processMemoryUsage = process.memoryUsage()

    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory

    const currentCpuTimes = getCpuTimes()
    let totalCpuTime: number
    let idleCpuTime: number
    let usedCpuTime: number

    if (prevCpuTimes) {
        totalCpuTime = currentCpuTimes.total - prevCpuTimes.total
        idleCpuTime = currentCpuTimes.idle - prevCpuTimes.idle
        usedCpuTime = totalCpuTime - idleCpuTime
    } else {
        totalCpuTime = currentCpuTimes.total
        idleCpuTime = currentCpuTimes.idle
        usedCpuTime = 0
    }
    prevCpuTimes = currentCpuTimes

    return {
        process: {
            cpuUsage: processCpuUsage,
            memoryUsage: processMemoryUsage
        },
        system: {
            memory: {
                total: totalMemory,
                free: freeMemory,
                used: usedMemory,
                percentage: (usedMemory / totalMemory) * 100
            },
            cpu: {
                total: totalCpuTime,
                free: idleCpuTime,
                used: usedCpuTime,
                percentage: totalCpuTime > 0 ? (usedCpuTime / totalCpuTime) * 100 : 0
            }
        }
    }
}
