import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable()
export class ServerService {

    private _serverUri: string;
    private _authUri: string;

    constructor (private httpClient: HttpClient) {
        // ng serve      --> development mode, server running on same host
        // npm run build --prod --> production mode, server can run on any host and supports loading ngx app
         this._serverUri = isDevMode() ? 'http://localhost:4711' : '';
        // this._serverUri = isDevMode() ? 'http://10.200.99.85:4711' : '';
        // this._serverUri = isDevMode() ? 'http://pi-xxxx:4711' : '';
    }

    public async httpGetJson (resource: string, options?: { headers?: HttpHeaders }, token?: string): Promise<any> {
        return this.performHttpGetJson(resource, options, token);
    }

    public async httpPostAndGetJson (resource: string, data: any,  options?: { headers?: HttpHeaders }, token?: string): Promise<any> {
        return this.performHttpPostAndGetJson(resource, data, options, token);
    }

    public async httpPutAndGetJson (resource: string, data: any,  options?: { headers?: HttpHeaders }, token?: string): Promise<any> {
        return this.performHttpPutAndGetJson(resource, data, options, token);
    }



    private async performHttpGetJson (resource: string, options?: { headers?: HttpHeaders }, token?: string): Promise<object> {
        if (!resource) {
            return Promise.reject(new Error('invalid arguments'));
        }
        let headers = options && options.headers ? options.headers : new HttpHeaders({
            'Content-Type': 'application/json',
        });
        if (token) {
            headers = headers.append('Authorization', 'Bearer ' + token);
        }
        const httpClientOptions = { headers };
        const uri = resource === '/auth' ? this._authUri : this._serverUri + resource;
        try {
            const response = this.httpClient.get(uri, { headers, responseType: 'json' }).toPromise();
            return response;
        } catch (err) {
            throw err;
        }
    }

    private async performHttpPostAndGetJson (resource: string, body: any,
                                             options?: { headers?: HttpHeaders }, token?: string): Promise<object> {
        if (!resource || !body) {
            return Promise.reject(new Error('invalid arguments'));
        }
        let headers = options && options.headers;
        if (!headers) {
            headers = new HttpHeaders({
                'Content-Type': 'application/json',
            });
        }

        if (token) {
             headers = headers.append('Authorization', 'Bearer ' + token);
        }
        const uri = resource !== this._authUri ? this._serverUri + resource : this._authUri;
        console.log('POST---> ', uri, body);
        return this.httpClient.post(uri, body, { headers, responseType: 'json' } ).toPromise();
    }

    private async performHttpPutAndGetJson (resource: string, body: any,
                                            options?: { headers?: HttpHeaders }, token?: string): Promise<object> {
        if (!resource || !body) {
            return Promise.reject(new Error('invalid arguments'));
        }
        let headers = options && options.headers;
        if (!headers) {
            headers = new HttpHeaders({
                'Content-Type': 'application/json',
            });
        }

        if (token) {
            headers = headers.append('Authorization', 'Bearer ' + token);
        }
        const uri = resource !== this._authUri ? this._serverUri + resource : this._authUri;
        console.log('PUT---> ', uri, body);
        return this.httpClient.put(uri, body, { headers, responseType: 'json' } ).toPromise();
    }

}
