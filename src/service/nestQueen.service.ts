import { AppConfigs } from '@util/appConfig.util'

type WorkerActionThatNeedConfirms = 'cell.delete' | 'cell.stop' | 'cell.restart'

class NestQueenService {
    private queenURL: string

    constructor() {
        this.queenURL = AppConfigs.queen.url
        if (!this.queenURL) throw new Error('Queen URL is not defined in configuration')
    }

    public async sendHeartbeat() {}

    public async confirmAction(_action: WorkerActionThatNeedConfirms, _cellUUID: string) {
        // TODO: implement action confirmation logic with queen
    }
}

export const nestQueenService = new NestQueenService()
