// logging with debug-sx/debug
import * as debugsx from 'debug-sx';
// const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('server');
const debug: debugsx.IDefaultLogger = debugsx.createDefaultLogger('server');

export interface IServerConfig {
        disabled?: boolean;
        port: number;
}

export class Server {

    private static instance: Server;

    public static async createInstance (config: IServerConfig): Promise<Server> {
        if (Server.instance) {
            throw new ServerError('server instance already created');
        }
        const server = new Server();
        await server.init(config);
        Server.instance = server;
        return server;
    }

    public static getInstance (): Server {
        if (!Server.instance) {
            throw new ServerError('no server instance created yet');
        }
        return Server.instance;
    }

    // ****************************************************************

    private _config: IServerConfig | null = null;

    private constructor () {

    }

    public async start () {

    }

    private async init (config: IServerConfig) {
        if (!config || !(config.port >= 0 && config.port <= 0xffff)) {
            throw new ServerError('config error, invalid/missing port');
        }
        this._config = config;
        debug.config('init done');
    }

}

export class ServerError extends Error {
    constructor (msg: string, public cause?: any) {
        super(msg);
    }
}

