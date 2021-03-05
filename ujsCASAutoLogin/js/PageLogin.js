document.write('请稍等...\n');
document.body.style = '-webkit-user-modify: read-write-plaintext-only !important;';
var URL = decodeURIComponent(location.href);
var start = URL.search('/cas/login?');
var serviceURL = URL.substring(start + 19, URL.length);
chrome.runtime.onMessage.addListener(function (request) {
    console.log(request);
    if (request.type == 'tip') {
        document.write(request.data + '\n');
    }
});
chrome.runtime.onMessage.addListener(function (request) {
    console.log(request);
    if (request.type == 'loginOK') {
        //跳转
        location.href = serviceURL;
    }
});
chrome.storage.local.set({ serviceURL:serviceURL }, function () {
    chrome.runtime.sendMessage({ type: 'page', url: location.href });
});