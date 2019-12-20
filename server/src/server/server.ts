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
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

import { handleError, RouterError, BadRequestError, AuthenticationError, NotFoundError } from './routers/router-error';
import { VERSION } from '../main';
import { ICommandRequest, ICommandResponse } from '../data/common/command';
import { IServerVersion } from '../data/common/server-version';

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
        this._express.use(bodyParser.json());
        this._express.use(bodyParser.urlencoded({ extended: true }) );
        // this._express.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
        this._express.get('/*', (req, res, next) => this.handleGet(req, res, next));
        this._express.get('/test', (req, res, next) => this.handleTest(req, res, next));
        this._express.get('/version', (req, res, next) => this.handleVersion(req, res, next));
        this._express.put('/cmd', (req, res, next) => this.handleCommand(req, res, next));


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
        if (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/app') ) {
            const indexFileName = path.join(__dirname, '../../../ngx/dist/lightning-tower/index.html');
            res.sendFile(indexFileName);
            return;
        }
        if (req.url === '/favicon.ico') {
            const fileName = path.join(__dirname, '..', 'assets/public/favicon.ico');
            res.sendFile(fileName, (err) => {
                debug.warn('favicon.ico not found (%s)', fileName);
                res.status(404).end();
            });
            return;
        }
        let fn = path.join(__dirname, '../../../ngx/dist/lightning-tower/', req.url);
        try {
            const index = fn.indexOf('?');
            if (index > 0) {
                fn = fn.substr(0, index);
            }
            fs.accessSync(fn, fs.constants.R_OK);
            res.sendFile(fn);
            return;
        } catch (err) {
        }

        next();
    }

    private handleTest (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            throw new BadRequestError('Test', new Error('Cause'));
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    private handleVersion (req: express.Request, res: express.Response, next: express.NextFunction) {
        const rv: IServerVersion = {
            version: VERSION,
            name: 'htl-turm-server'
        };
        res.json(rv);
    }

    private handleCommand (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const data: ICommandRequest = req.body;
            if (!data || !data.command) {
                throw new BadRequestError('request PUT /cmd fails, invalid/missing body');
            }
            debug.info('command: %s', data.command);
            const rv: ICommandResponse = {
                status: 'OK'
            };
            res.json(rv);

        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

}

export class ServerError extends Error {
    constructor (msg: string, public cause?: any) {
        super(msg);
    }
}

