// logging with debug-sx/debug
import * as debugsx from 'debug-sx';
// const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('serial');
// const debug: debugsx.IDefaultLogger = debugsx.createDefaultLogger('serial');
const debug: debugsx.IFullLogger = debugsx.createFullLogger('serial');

// Node.js Modules
import * as path from 'path';
import * as fs from 'fs';

// External modules
import * as SerialPort from 'serialport';
import { rejects } from 'assert';


export interface ISerialConfig {
    disabled?: boolean;
    device:  string;
    options: SerialPort.OpenOptions;
}

export class Serial {

    private static instance: Serial;

    public static async createInstance (config: ISerialConfig): Promise<Serial> {
        if (Serial.instance) {
            throw new SerialError('serial instance already created');
        }
        const serial = new Serial();
        try {
            await serial.init(config);
        } catch (err) {
            throw new SerialError('createInstance() fails', err);
        }
        Serial.instance = serial;
        return serial;
    }

    public static getInstance (): Serial {
        if (!Serial.instance) {
            throw new SerialError('no serial instance created yet');
        }
        return Serial.instance;
    }

    // ****************************************************************

    private _config: ISerialConfig | null = null;
    private _openPromise: { resolve: () => void, reject: (err: Error) => void } | null = null;
    private _serialPort: SerialPort | undefined;

    private constructor () {

    }

    public async open () {
        if (this._openPromise) {
            return Promise.reject(new Error('open already called, execute close() first.'));
        }
        const rv: Promise<void> = new Promise<void>( (resolve, reject) => {
            const config = this._config as ISerialConfig;
            this._serialPort = new SerialPort(config.device, config.options);
            // this._serialPort.on('open', this.handleOnSerialOpen.bind(this));
            this._serialPort.on('error', this.handleOnSerialError.bind(this));
            this._serialPort.on('data', this.handleOnSerialData.bind(this));
            this._openPromise = { resolve: resolve, reject: reject };
            this._serialPort.open( (err) => {
                if (!this._openPromise || !this._openPromise.resolve) { return; }
                if (err) {
                    debug.warn('cannot open serial port ' + config.device);
                    this._openPromise.reject(err);
                } else {
                    const o = Object.assign(config.options);
                    delete o.autoOpen;
                    debug.info('serial port ' + config.device + ' opened (' + JSON.stringify(o) + ')');
                    const res = this._openPromise.resolve;
                    this._openPromise = null;
                    res();
                }
            });
        });
        return rv;
    }

    public async close () {
        if (!this._serialPort || !this._serialPort.isOpen) {
            return Promise.reject(new Error('serial port not open'));
        }
        if (this._openPromise && this._openPromise.reject) {
            this._openPromise.reject(new Error('serial port closed while opening pending'));
        }
        this._openPromise = null;
        const config = this._config as ISerialConfig;
        try {
            await this._serialPort.close();
            debug.info('serial port ' + config.device + ' closed');
        } catch (err) {
            debug.warn('cannot close serial port ' + config.device, err);
        }
    }


    public async send (data: string): Promise<void> {
        debug.finer('send data... %s', data);
        if (!this._serialPort || this._openPromise) { throw new Error('serialPort not open'); }
        return new Promise<void>( (res, rej) => {
            (this._serialPort as SerialPort).write(data, (err) => {
                if (err) {
                    rej(err);
                } else {
                    debug.finest('data send successfully');
                    res();
                }
            });
        });
    }

    private async init (config: ISerialConfig) {
        if (!config) { throw new SerialError('missing serial'); }
        if (config.disabled) {
            debug.warn('serial interface disabled');
            return;
        }
        if (!config.device || typeof config.device !== 'string') { throw new SerialError('missing/invalid device'); }
        if (!config.options || typeof config.options !== 'object') { throw new SerialError('missing/invalid options'); }
        this._config = config;
        this._config.options.autoOpen = false;
        await this.open();
        await this.send('Hello\n');
        debug.config('init done');
    }

    private handleOnSerialError (err: any) {
        debug.warn(err);
    }

    private handleOnSerialData (data: Buffer) {
        if (!(data instanceof Buffer)) {
            debug.warn('serial input not as expected...');
            return;
        }
        console.log(data);
    }
}


export class SerialError extends Error {
    constructor (msg: string, public cause?: any) {
        super(msg);
    }
}

