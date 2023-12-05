/* eslint-disable @typescript-eslint/no-explicit-any */
import fetchIntercept, { FetchInterceptorResponse } from 'fetch-intercept';
import { rpcUrl } from './store/modules/network';

fetchIntercept.register({
    request: function (url: string, config: any): Promise<any[]> | any[] {
        // Modify the url or config here
        const offline = localStorage.getItem("OFFLINE_MODE");
        const rpc = rpcUrl()
        if (offline && offline == "on" && url.startsWith(rpc)) {
            return ["http://[100::]", config];
        }
        return [url, config];
    },
    requestError: function (error: any): Promise<any> {
        // Called when an error occured during another 'request' interceptor call
        return Promise.reject(error);
    },

    response: function (response: FetchInterceptorResponse): FetchInterceptorResponse {
        // Modify the reponse object
        return response;
    },

    responseError: function (error: any): Promise<any> {
        // Handle an fetch error
        return Promise.reject(error);
    }
});