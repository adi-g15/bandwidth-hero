import shouldCompress from './background/shouldCompress'
import patchContentSecurity from './background/patchContentSecurity'
import getHeaderValue from './background/getHeaderIntValue'
import parseUrl from './utils/parseUrl'
import deferredStateStorage from './utils/deferredStateStorage'
import defaultState from './defaults'
import isPrivateNetwork from './background/isPrivateNetwork';

chrome.storage.local.get(storedState => {
    const storage = deferredStateStorage()
    const compressed = new Set();
    let setupHasBeenOpened = false;
    let state = { ...defaultState, ...storedState };
    let currentHostName = null;
    let currentPageProtocol = null;

    checkWebpSupport().then(isSupported => {
        chrome.storage.local.set({ ...storedState, isWebpSupported: isSupported })
    })

    async function checkWebpSupport() {
        if (!self.createImageBitmap) return false
        const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA='
        const blob = await fetch(webpData).then(r => r.blob())
        return self.createImageBitmap(blob).then(() => true, () => false)
    }

    /**
     * Sets the icons based on the enabled parameter.
     */
    function setIcon() {
        const isEnabled = state.enabled && isEnabledSite();
        if (chrome.browserAction.setIcon) {
            chrome.browserAction.setIcon({
                path: isEnabled ? "assets/icon-128.png" : "assets/icon-128-disabled.png"
            });
        }
    }

    /**
     * Checks if the proxy is enabled for the given url
     * @returns {boolean}
     */
    function isEnabledSite() {
        // If we don't have the URL or protocol we can't check if it is enabled. By default we say it is disabled then
        if (!currentHostName || !currentPageProtocol) {
            return false;
        }

        // Check if the page is a http/https page.
        const supportedProtocols = ['http:', 'https:'];
        if (!supportedProtocols.includes(currentPageProtocol)) {
            return false;
        }

        // We are disabled when on localhost or site is hosted on private IP.
        if (isPrivateNetwork(currentHostName)) {
            return false;
        }
        return state.enabledHosts.includes(currentHostName);
    }

    /**
     * Every time the storage of the browser changes we also update our in-memory state to keep up with the changes.
     *
     */
    function onStateChanged(changes) {
        const changedItems = Object.keys(changes);
        for (const item of changedItems) {
            if (state[item] !== changes[item].newValue) {
                state[item] = changes[item].newValue;
                stateItemChanged(item, state[item]);
            }
        }
    }

    /**
     * Perform actions for certain changes to the state. Like changing the icon if we enable/disable the extension.
     * @param key
     * @param newValue
     */
    function stateItemChanged(key, newValue) {
        switch (key) {
            case 'enabled':
            case 'enabledHosts':
                setIcon(); // Update icon
                break;
        }
    }

    function checkSetup() {
        if (!state.enabled) return;
        if (setupHasBeenOpened) return;
        if (state.proxyUrl === '') {
            chrome.tabs.create({ url: 'setup.html' });
            setupHasBeenOpened = true;
        }
    }

    function onInstalled() {
        checkSetup();
    }

    /**
     * Intercept image loading request and decide if we need to compress it.
     * 
     * @param
     *  url - Destination resource url
     *  documentUrl - The current page we are on
     *  type - type of request ("xmlhttprequest" or "image" etc.)
     */
    function onBeforeRequestListener({ url, documentUrl, type }) {
        checkSetup();

        // Occasionally currentHostName is not ready in time on FF
        const hostUrl = currentHostName || parseUrl(documentUrl).host;

        if (
            shouldCompress({
                imageUrl: url,
                hostUrl,
                compressed,
                proxyUrl: state.proxyUrl,
                enabledHosts: state.enabledHosts,
                enabled: state.enabled,
                type
            })
        ) {
            compressed.add(url)
            const redirectUrl = buildCompressUrl(url);

            // Firefox allows onBeforeRequest event listener to return a Promise
            // and perform redirect when this Promise is resolved.
            // This allows us to run HEAD request before redirecting to compression
            // to make sure that the image should be compressed.
            if (isFirefox()) {
                return fetch(url, {
                    method: "HEAD"
                })
                .then(res => {
                    if (
                        res.status === 200 &&
                        res.headers.get('content-length') > 1024 &&
                        res.headers.get('content-type') &&
                        res.headers.get('content-type').startsWith('image')
                    ) {
                        return { redirectUrl }
                    }
                }).catch(error => {
                    if(error.response.status === 405)//HEAD method not allowed
                    {
                        return { redirectUrl }
                    }
                })
            } else {
                return { redirectUrl }
            }
        }
    }

    /**
     * Builds up a redirect URL. The original URL is encode and added as query
     * parameter. If WebP isn't supported the url append a flag to let the
     * server know to return in a JPEG format instead. Other flags that are
     * added are: bw (this lets the proxy know to return image in grayscale
     * as those have less color information and thus saving more space) and
     * compression level.
     * @param url
     * @returns {string}
     */
    function buildCompressUrl(url) {
        let redirectUrl = '';
        redirectUrl += state.proxyUrl;
        redirectUrl += `?url=${encodeURIComponent(url)}`;
        redirectUrl += `&jpeg=${state.isWebpSupported ? 0 : 1}`;
        redirectUrl += `&bw=${state.convertBw ? 1 : 0}`;
        redirectUrl += `&l=${state.compressionLevel}`;
        return redirectUrl;
    }

    /**
     * Firefox user agent always has "rv:" and "Gecko"
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent/Firefox
     */
    function isFirefox() {
        return /rv\:.*Gecko/.test(window.navigator.userAgent)
    }

    /**
     * Retrieve saved bytes info from response headers, update statistics in
     * app storage and notify UI about state changes.
     */
    function onCompletedListener({ responseHeaders, fromCache }) {
        if (fromCache) return;
        const bytesSaved = getHeaderValue(responseHeaders, 'x-bytes-saved')
        const bytesProcessed = getHeaderValue(responseHeaders, 'x-original-size')
        if (bytesSaved !== false && bytesProcessed !== false) {
            state.statistics.filesProcessed += 1
            state.statistics.bytesProcessed += bytesProcessed
            state.statistics.bytesSaved += bytesSaved

            storage.set({statistics : state.statistics})
        }
    }

    function onTabActivated({tabId}) {
        chrome.tabs.get(tabId, tab => {
            const url = parseUrl(tab.url);
            currentHostName = url.hostname;
            currentPageProtocol = url.schema;
            compressed.clear(); // Reset our list of compressed images
            setIcon();
        });
    }

    // If we navigate to a new page within a tab and it is the same we have a
    // bug where it does not process images. Because the images are still in
    // compressed even though the page changed. With onTabUpdated we reset this.
    function onTabUpdated(){
      compressed.clear()
    }

    /**
     * Patch document's content security policy headers so that it will allow
     * images loading from our compression proxy URL.
     */
    function onHeadersReceivedListener({ responseHeaders }) {
        return {
            responseHeaders: patchContentSecurity(responseHeaders, state.proxyUrl)
        }
    }

    if (!chrome.webRequest.onBeforeRequest.hasListener(onBeforeRequestListener)) {
        chrome.webRequest.onBeforeRequest.addListener(
            onBeforeRequestListener,
            {
                urls: ['<all_urls>'],
                types: isFirefox() ? ['xmlhttprequest', 'imageset', 'image'] : ['image']
            },
            ['blocking']
        )
    }

    if (!chrome.webRequest.onCompleted.hasListener(onCompletedListener)) {
        chrome.webRequest.onCompleted.addListener(
            onCompletedListener,
            {
                urls: ['<all_urls>'],
                types: isFirefox() ? ['xmlhttprequest', 'imageset', 'image'] : ['image']
            },
            ['responseHeaders']
        )
    }

    if (!chrome.webRequest.onHeadersReceived.hasListener(onHeadersReceivedListener)) {
        chrome.webRequest.onHeadersReceived.addListener(
            onHeadersReceivedListener,
            {
                urls: ['<all_urls>'],
                types: ['main_frame', 'sub_frame', 'xmlhttprequest']
            },
            ['blocking', 'responseHeaders']
        )
    }

    if (!chrome.tabs.onActivated.hasListener(onTabActivated)) {
        chrome.tabs.onActivated.addListener(onTabActivated)
    }

    if (!chrome.tabs.onUpdated.hasListener(onTabUpdated)) {
        chrome.tabs.onUpdated.addListener(onTabUpdated)
    }

    if (!chrome.storage.onChanged.hasListener(onStateChanged)) {
        chrome.storage.onChanged.addListener(onStateChanged)
    }

    if (!chrome.runtime.onInstalled.hasListener(onInstalled)) {
        chrome.runtime.onInstalled.addListener(onInstalled)
    }
})
