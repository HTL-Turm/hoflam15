
import { Request, Response, NextFunction } from 'express';

import { ISimpleLogger } from 'debug-sx';



export class RouterError extends Error {

    constructor (msg: string, public statusCode: number, public cause?: Error) {
        super(msg);
    }
}

export class BadRequestError extends RouterError {
    constructor (msg: string, cause?: Error) {
        super(msg, 400, cause);
    }
}

export class AuthenticationError extends RouterError {
    constructor (msg: string, cause?: Error) {
        super(msg, 401, cause);
    }
}

export class NotFoundError extends RouterError {
    constructor (msg: string, cause?: Error) {
        super(msg, 404, cause);
    }
}

export class InternalServerError extends RouterError {
    constructor (msg: string, cause?: Error) {
        super(msg, 500, cause);
    }
}


export function handleError (err: Error,  req: Request, res: Response, next: NextFunction, debug: ISimpleLogger) {
    if (!err) {
        throw new Error('invalid argument');
    }
    if (!(err instanceof RouterError)) {
        next(err);
        return;
    }

    const now = new Date();
    const ts = now.toISOString();
    const status = err.statusCode;
    let msg = err.message || '';
    msg = ' - ' + msg;
    switch (status) {
        case 400: msg = 'Bad Request (400)' + msg; break;
        case 401: msg = 'Bad Authentication (401)' + msg; break;
        case 404: msg = 'Not Found (404)' + msg; break;
        default: msg = '? (' + status + ')' + msg; break;
    }
    if (req.url.endsWith('/auth') && req.body.password) {
        const pw = req.body.password;
        req.body.password = pw[0] + new Array(pw.length - 1).join('*');
    }
    if (err.cause) {
        debug.info('%s\n  %s\n  %s %s\n%o\nCaused by %e', msg, ts, req.method, req.originalUrl, req.body, err.cause);
    } else {
        debug.info('%s\n  %s\n  %s %s\n%o', msg, ts, req.method, req.originalUrl, req.body);
    }
    if (status === 401) {
        const authServerUri = ''; // Auth.Instance.authServerUri;
        if (authServerUri) {
            const v = 'Bearer authorization_uri="' + authServerUri +
                      '", error="' + 'Unauthorized' + '", error_description="' + 'contact web-master with ' + ts + '"';
            res.setHeader('WWW-Authenticate', v);
        }
    }

    if (req.headers.accept && req.headers.accept.indexOf('application/json') >= 0) {
        switch (status) {
            case 400: res.status(status).json({ error: 'Bad Request', ts: ts}); break;
            case 401: res.status(status).json({ error: 'Unauthorized', ts: ts}); break;
            case 404: res.status(status).json({ error: 'Not Found', ts: ts}); break;
            default: next(err);
        }
    } else {
        try {
            switch (status) {
                case 400: res.status(status).render('error400.pug', { time: ts }); break;
                case 401: res.status(status).render('error401.pug', { time: ts }); break;
                case 404: res.status(status).render('error404.pug', { time: ts }); break;
                default: next(err);
            }
        } catch (err) {
            switch (status) {
                case 400: res.status(status).send('Bad request (' + ts + ')'); break;
                case 401: res.status(status).send('Unauthorized (' + ts + ')'); break;
                case 404: res.status(status).send('Not found (' + ts + ')'); break;
                default: next(err);
            }
        }
    }
}

