import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { findDockerSocket } from '@service/docker.service'
import { generateHex } from '@util/common.util'
import { merge } from 'lodash'

import type { AppConfig } from '../schema/config.schema'
import { appConfigSchema, defaultConfig } from '../schema/config.schema'
import { logger } from './logger.util'

const rootPath = process.cwd()
const CONFIG_PATH = join(rootPath, 'config.json')
const configLogger = (funcName: string) => logger.child({ module: `appConfig/${funcName}` })

/**
 * 将配置写入文件
 */
function writeConfigFile(config: AppConfig): void {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf-8')
}

/**
 * 初始化配置文件
 * 若 config.json 不存在则创建并写入默认值，已存在则跳过并返回当前配置
 */
export function initConfig(): AppConfig {
    const log = configLogger('init')

    if (existsSync(CONFIG_PATH)) {
        return readConfig()
    }

    // 初始化配置前先寻找 Docker Socket，确保配置有效
    log.info('finding docker socket...')
    const socketPath = findDockerSocket()
    if (!socketPath.status || !socketPath.data?.path) {
        log.error('docker socket not found, cannot initialize config')
        throw new Error('Docker socket not found, cannot initialize config')
    }
    log.info(`docker socket found at '${socketPath.data.path}'`)

    // 生成默认配置并写入文件
    log.info('generating new config with default values')
    const uuid = randomUUID()
    const secret = generateHex(64)
    log.info(`generated credentials: uuid=${uuid}, secret=${secret}`)
    writeConfigFile(defaultConfig(uuid, secret))
    log.info('config is successfully initialized')
    return defaultConfig(uuid, secret)
}

/**
 * 读取配置
 * 读取并校验 config.json，若不存在则自动初始化
 */
export function readConfig(): AppConfig {
    const log = configLogger('read')

    if (!existsSync(CONFIG_PATH)) {
        log.warn('config.json not found, initializing...')
        return initConfig()
    }

    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    return appConfigSchema.parse(parsed)
}

/**
 * 删除配置文件
 */
export function deleteConfig(): void {
    const log = configLogger('delete')

    if (!existsSync(CONFIG_PATH)) {
        log.warn('config.json not found, nothing to delete')
        return
    }

    unlinkSync(CONFIG_PATH)
    log.info('config.json deleted')
}

/**
 * 修改配置（部分更新，深度合并）
 * 传入需要更新的字段，会与现有配置深度合并后写回文件
 */
export function modifyConfig(patch: Partial<AppConfig>): AppConfig {
    const log = configLogger('modify')

    const current = readConfig()
    const merged = merge({}, current, patch)
    const validated = appConfigSchema.parse(merged)

    writeConfigFile(validated)
    log.info('config.json updated')
    return validated
}

/**
 * 校验配置文件是否损坏
 * 检查文件是否存在、JSON 是否合法、是否符合 Schema
 */
export function checkConfig(): { valid: boolean; error?: string } {
    const log = configLogger('check')

    if (!existsSync(CONFIG_PATH)) {
        log.warn('config.json not found')
        return { valid: false, error: 'config.json not found' }
    }

    try {
        const raw = readFileSync(CONFIG_PATH, 'utf-8')
        const parsed: unknown = JSON.parse(raw)
        appConfigSchema.parse(parsed)
        log.info('config.json is valid')
        return { valid: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error({ err }, 'config.json is broken')
        return { valid: false, error: message }
    }
}

export const AppConfigs = readConfig()
