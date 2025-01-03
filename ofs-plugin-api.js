let uniqueCounter = {
    timestamp: 0,
    counter: 0
};
 
const getRandomRange = (min, max) => Math.round(Math.random() * (max - min) + min);
 
class OfsPluginApi {
 
    static generateCallId () {
        return btoa(String.fromCharCode.apply(null, window.crypto.getRandomValues(new Uint8Array(16))));
    }
 
    static generateTemporaryId() {
        let timestamp = (new Date()).getTime();
        if (uniqueCounter.timestamp < timestamp) {
            uniqueCounter.timestamp = timestamp;
            uniqueCounter.counter = 0;
        }
 
        return uniqueCounter.timestamp + '' + (uniqueCounter.counter++) + '-' + getRandomRange(1000, 9999) + 'p';
    }
}
 
if (window.define && window.define.amd) {
    // amd anonymous module
    define([], () => OfsPluginApi);
} else if (typeof exports === 'object' && typeof module === 'object') {
    // CommonJS/Node.js
    module.exports = OfsPluginApi;
} else {
    // global namespace
    window.OfsPluginApi = OfsPluginApi;
}