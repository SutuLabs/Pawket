import fetchIntercept from 'fetch-intercept';
import { rpcUrl } from './store/modules/network';

fetchIntercept.register({
    request: function (url, config) {
        // Modify the url or config here
        const offline = localStorage.getItem("OFFLINE_MODE");
        const rpc = rpcUrl()
        if (offline && offline == "on" && url.startsWith(rpc)) {
            return [];
        }
        return [url, config];
    },

    requestError: function (error) {
        // Called when an error occured during another 'request' interceptor call
        return Promise.reject(error);
    },

    response: function (response) {
        // Modify the reponse object
        return response;
    },

    responseError: function (error) {
        // Handle an fetch error
        return Promise.reject(error);
    }
});