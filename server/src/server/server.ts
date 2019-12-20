// logging with debug-sx/debug
import * as debugsx from 'debug-sx';
// const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('server');
// const debug: debugsx.IDefaultLogger = debugsx.createDefaultLogger('server');
const debug: debugsx.IFullLogger = debugsx.createFullLogger('server');

// Node.js Modules
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

// External modules
import * as express from 'express';
import * as cors from 'cors';

import { handleError, RouterError, BadRequestError, AuthenticationError, NotFoundError } from './routers/router-error';

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
        try {
            await server.init(config);
        } catch (err) {
            throw new ServerError('createInstance() fails', err);
        }
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

    private _config: IServerConfig | undefined;
    private _express: express.Express | undefined;
    private _server: http.Server | undefined;

    private constructor () {

    }

    public async start () {
        this._express = express();
        this._express.use(cors()); // allow cross origin resource sharing
        // this._express.use(bodyParser.json());
        // this._express.use(bodyParser.urlencoded({ extended: true }) );
        // this._express.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
        this._express.get('/*', (req, res, next) => this.handleGet(req, res, next));


        this._express.use(
            (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => this.errorHandler(err, req, res, next)
        );


        // this._express.listen((this._config as IServerConfig).port);
        const config = this._config as IServerConfig;
        const server = http.createServer(this._express).listen(config.port, () => {
            debug.info('Server gestartet: http://localhost:%s', config.port);
        });
        server.on('connection', socket => {
            debug.finer('Connection established: %s:%s', socket.remoteAddress, socket.remotePort);
            // socket.destroy();
        });
        server.on('close', () => {
            debug.info('Server gestoppt');
        });
        server.on('error', err => {
            debug.warn(err);
        });
        this._server = server;
    }

    private async init (config: IServerConfig) {
        if (!config || !(config.port >= 0 && config.port <= 0xffff)) {
            throw new ServerError('config error, invalid/missing port');
        }
        this._config = config;
        debug.config('init done');
    }

    private errorHandler (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        const now = new Date();
        const ts = now.toISOString();
        debug.warn('Internal Server Error: %s\n%e', ts, err);
        if (req.headers.accept && req.headers.accept.indexOf('application/json') >= 0) {
            res.status(500).json({ error: 'Internal Server Error', ts: ts });
        } else {
            res.status(500).send('Internal Server Error (' + ts + ')');
        }
    }


    private handleGet (req: express.Request, res: express.Response, next: express.NextFunction) {
        debug.finer('request GET %s from socket %s:%s', req.originalUrl, req.socket.remoteAddress, req.socket.remotePort);
        throw new BadRequestError('request not supported');
        // res.send('Hallo');
    }

}

export class ServerError extends Error {
    constructor (msg: string, public cause?: any) {
        super(msg);
    }
}

