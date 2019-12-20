export const VERSION = '0.0.1';

console.log('start of server application V' + VERSION);

// Node.js Module
import * as fs from 'fs';
import * as path from 'path';

// Externe Module
import * as nconf from 'nconf';

process.on('unhandledRejection', (reason, p) => {
    const now = new Date();
    console.log(now.toLocaleDateString() + '/' + now.toLocaleTimeString() + ': unhandled rejection at: Promise', p, 'reason:', reason);
});



// ***********************************************************
// configuration, logging
// ***********************************************************

nconf.argv().env();
const configFilename = path.join(__dirname, '../config.json');
try {
    fs.accessSync(configFilename, fs.constants.R_OK);
    nconf.file(configFilename);
} catch (err) {
    console.log('Error on config file ' + configFilename + '\n' + err);
    process.exit(1);
}

let debugConfig: any = nconf.get('debug');
if (!debugConfig) {
    debugConfig = { enabled: '*::*' };
}
for (const a in debugConfig) {
    if (debugConfig.hasOwnProperty(a)) {
        const name: string = (a === 'enabled') ? 'DEBUG' : 'DEBUG_' + a.toUpperCase();
        if (!process.env[name] && (debugConfig[a] !== undefined || debugConfig[a] !== undefined)) {
            process.env[name] = debugConfig[a] ? debugConfig[a] : debugConfig[a];
        }
    }
}

// logging with debug-sx/debug
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('main');

// debugsx.addHandler(debugsx.createConsoleHandler('stdout'));
debugsx.addHandler(debugsx.createRawConsoleHandler());

const logfileConfig = nconf.get('logfile');
if (logfileConfig) {
    for (const att in logfileConfig) {
        if (!logfileConfig.hasOwnProperty(att)) { continue; }
        const logHandlerConfig = logfileConfig[att];
        if (logHandlerConfig.disabled) { continue; }
        const h = debugsx.createFileHandler( logHandlerConfig);
        console.log('Logging ' + att + ' to ' + logHandlerConfig.filename);
        debugsx.addHandler(h);
    }
}


// ***********************************************************
// startup of application
//   ... things to do before server can be started
// ***********************************************************

import { sprintf } from 'sprintf-js';
import { Server } from './server/server';
import { Serial } from './serial/serial';

doStartup().then( () => {
    debug.info('startup server V%s successfully finished', VERSION);
}).catch( (err) => {
    console.log('startup fails....', err);
    process.exit(2);
});


async function doStartup () {
    try {
        debug.fine('doStartup() - start');
        await delayMillis(100);
        const serial = await Serial.createInstance(nconf.get('serial'));
        const server = await Server.createInstance(nconf.get('server'));
        await server.start();
        
    } catch (err) {
        debug.severe('debug fails\n%e', err);
        throw err;
    } finally {
        debug.fine('doStartup() - end');
    }
}

export async function delayMillis (ms: number) {
    return new Promise<void>( (res) => {
        setTimeout( () => res(), ms );
    });
}



