document.write('请稍等...\n');
document.body.style = '-webkit-user-modify: read-write-plaintext-only !important;';
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
        var URL = decodeURIComponent(location.href);
        var start = URL.search('/cas/login?');
        location.href = URL.substring(start + 19, URL.length);
    }
});
chrome.runtime.sendMessage({ type: 'page' });