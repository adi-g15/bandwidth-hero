import isImage from 'is-image';
import isPrivateNetwork from './isPrivateNetwork';
import parseUrl from '../utils/parseUrl';

export default ({ imageUrl, hostUrl, compressed, proxyUrl, enabledHosts, enabled, type = 'image' }) => {
  imageUrl = imageUrl.replace('#bh-no-compress=1', '');

  // If we aren't enabled we don't have to do anything.
  if (!enabled) {
        return false;
  }

  // If we don't have an proxy URL we can't compress.
  if (proxyUrl === '') {
    return false;
  }

  // We keep a list of compressed images to prevent infinite loops. If the proxy
  // can't process an image and redirects the browser to the original it will come
  // back as a normal request. If we don't keep track it will keep looping around
  // sending the image to the proxy and proxy redirecting.
  if (compressed.has(imageUrl)) {
    return false;
  }

  // Only process http or https; other protocols including base64 encode URLs are
  // not supported.
  const isHttp = imageUrl.toLowerCase().startsWith('https://') ||
                  imageUrl.toLowerCase().startsWith('http://');
  if (!isHttp) {
    return false;
  }

  // Do not process tracking URLs.
  if (isTrackingPixel(imageUrl)) {
    return false;
  }

  // Clean the image URL and checks if it starts with the proxy URL. Since the
  // request is our own redirect and shouldn't be processed.
  const cleanImageUrl = stripQueryStringAndHashFromPath(imageUrl);
  if (cleanImageUrl.startsWith(proxyUrl)) {
        return false;
  }

  // Local images aren't accessible for our proxy.
  if (isPrivateNetwork(imageUrl)) {
        return false;
  }

  // If the host of the page or image is NOT enabled then return.
  if (!enabledHosts.includes(hostUrl)) {
        return false;
  }

  /**
   * BREAKING CHANGE - 
   * 
   * In the original repo of Bandwidth Hero, it is `enabled by default for all`
   * 
   * Since i changed it to `enabling is OPT IN`,
   * 
   * so here, we are fetching the image as long as we are on an ENABLED SITE (say i enable github.com, but then this if will block raw.githubcontent.com), Commenting and not removing to leave with this note here
   */
  // If the host of the page or image is NOT enabled then return.
  // const imageHost = parseUrl(cleanImageUrl).hostname;
  // if (!enabledHosts.includes(imageHost)) {
  //     //   return false;
  // }

  // Check if the image doesn't have an extension we can't compress.
  const notSupported = ['ico', 'svg'];
  const matched = notSupported.filter(ext => imageUrl.endsWith('.' + ext));
  if (matched.length > 0) {
        return false;
  }

  // Do not process favicons. Those are too small to process most of the time.
  if (imageUrl.includes('favicon')) {
        return false;
  }

  // Firefox will set some images behind a xmlhttprequest instead of
  // image/imageset. But, listening to xmlhttprequest will also give us other
  // files like JS of CSS. By checking if the clean URL is an image we make sure
  // to only get images. But, do this only if the type of the request is
  // xmlhttprequest.
  if (type.toLowerCase() === 'xmlhttprequest' && !isImage(cleanImageUrl)) {
        return false;
  }

  return true;
};

function isTrackingPixel(url) {
  const trackingLinks = [
    /pagead/i,
    /(pixel|cleardot)\.*(gif|jpg|jpeg)/i,
    /google\.([a-z\.]+)\/(ads|generate_204|.*\/log204)+/i,
    /google-analytics\.([a-z\.]+)\/(r|collect)+/i,
    /youtube\.([a-z\.]+)\/(api|ptracking|player_204|live_204)+/i,
    /doubleclick\.([a-z\.]+)\/(pcs|pixel|r)+/i,
    /googlesyndication\.([a-z\.]+)\/ddm/i,
    /pixel\.facebook\.([a-z\.]+)/i,
    /facebook\.([a-z\.]+)\/(impression\.php|tr)+/i,
    /ad\.bitmedia\.io/i,
    /yahoo\.([a-z\.]+)\/pixel/i,
    /criteo\.net\/img/i,
    /ad\.doubleclick\.net/i
  ];

  for (const link of trackingLinks) {
    if (link.test(url)) {
      return true;
    }
  }
  return false;
}

function stripQueryStringAndHashFromPath(url) {
  return url.split('?')[0].split('#')[0];
}
