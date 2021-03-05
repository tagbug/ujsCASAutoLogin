var settings;
function getSettings () {
    chrome.storage.local.get({ inited: false, username: '', password: '', serviceURL: '' }, function (data) {
        settings = data;
        if (!settings.inited) {
            window.open('options.html');
        }
    });
}
getSettings();
chrome.runtime.onMessage.addListener(function (request) {
    if (request.type == 'saved') {
        getSettings();
    }
});
chrome.runtime.onMessage.addListener(function (request) {
    if (request.type == 'test') {
        getSettings();
        Login("test");
    }
});
chrome.runtime.onMessage.addListener(function (request) {
    if (request.type == 'page') {
        getSettings();
        Login("page", request.url);
    }
});
//js Sleep
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
var status;
var statusChecker;
var statusCount = 0;
function Login (mode, url = '') {
    status = 0;
    statusChecker = window.setTimeout(function () {
        if (statusCount >= 5) {
            status = 1;
            if (mode == 'test') {
                chrome.notifications.create(null, {
                    type: 'basic',
                    iconUrl: 'img/icon.png',
                    title: 'ujsCAS登录助手',
                    message: '登录失败！网络连接问题（尝试次数过多）',
                    requireInteraction: false,
                    priority: 2
                });
            } else {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'tip', data: '登录失败！网络连接问题（尝试次数过多）' });
                });
            }
        }
        if (status == 0) {
            statusCount += 1;
            Login(mode);
        }
    }, 1000 * 30);
    //要登录的网址
    var serviceURL = settings.serviceURL;
    //用户名、密码
    var username = settings.username;
    var password = settings.password;
    //load from "https://pass.ujs.edu.cn/cas/login"
    var xmlhttp = new XMLHttpRequest();
    var captchaHttp = new XMLHttpRequest();
    var login = new XMLHttpRequest();
    var _pwdDefaultEncryptSalt;
    serviceURL = encodeURIComponent(serviceURL);
    var postStr = '';
    var postForm = [
        {
            name: 'lt',
            value: ''
        },
        {
            name: 'dllt',
            value: ''
        },
        {
            name: 'execution',
            value: ''
        },
        {
            name: '_eventId',
            value: ''
        },
        {
            name: 'rmShown',
            value: ''
        }
    ];
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            //是否已登录
            if (xmlhttp.response.indexOf("<i class=\"nav_icon nav_icon_logout\"></i><span>安全退出</span>") != -1) {
                //已登录
                status = 1;
                if (mode == 'test') {
                    chrome.notifications.create(null, {
                        type: 'basic',
                        iconUrl: 'img/icon.png',
                        title: 'ujsCAS登录助手',
                        message: '当前已登录！',
                        requireInteraction: false,
                        priority: 2
                    });
                } else {
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'loginOK' });
                    });
                }
            } else {
                if (mode == 'page') {
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'tip', data: '处理登录表单...' });
                    });
                }
                //读取表单提交项
                for (var i = 0; i < postForm.length; i++) {
                    var searchStr = "name=\"" + postForm[i].name + "\" value=\"";
                    var start = xmlhttp.response.indexOf(searchStr);
                    var end = xmlhttp.response.indexOf("\"", start + searchStr.length);
                    postForm[i].value = xmlhttp.response.substring(start + searchStr.length, end);
                }
                var searchStr = "id=\"pwdDefaultEncryptSalt\" value=\"";
                var start = xmlhttp.response.indexOf(searchStr);
                var end = xmlhttp.response.indexOf("\"", start + searchStr.length);
                _pwdDefaultEncryptSalt = xmlhttp.response.substring(start + searchStr.length, end);
                xmlhttp2.open('GET', 'https://pass.ujs.edu.cn/cas/needCaptcha.html?username=' + username + '&pwdEncrypt2=pwdEncryptSalt&_=' + parseInt(Math.random() * Math.pow(10, 13)));
                xmlhttp2.send();
            }
        }
    }
    if (!settings.username || !settings.password) {
        if (mode == 'test') {
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujsCAS登录助手',
                message: '用户名或密码未配置，登录失败！',
                requireInteraction: false,
                priority: 2
            });
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'tip', data: '用户名或密码未配置，登录失败！' });
            });
        }
    } else {
        if (mode == 'test' && !serviceURL) {
            chrome.notifications.create(null, {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'ujsCAS登录助手',
                message: '登陆网址未配置，使用默认网址',
                requireInteraction: false,
                priority: 2
            });
            serviceURL = encodeURIComponent('https://pass.ujs.edu.cn');
        }
        if (mode == 'page' && url.search('webvpn.ujs.edu.cn') != -1) {
            xmlhttp.open('GET', url.substring(0, url.search('/cas/login') + 9), true);
        } else {
            xmlhttp.open('GET', 'https://pass.ujs.edu.cn/cas/login', true);
        }
        xmlhttp.send();
    }
    var xmlhttp2 = new XMLHttpRequest();
    xmlhttp2.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //判断是否需要获取验证码
            if (xmlhttp2.response == 'true') {
                if (mode == 'page') {
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'tip', data: '处理验证码...' });
                    });
                }
                captchaHttp.open('GET', 'https://pass.ujs.edu.cn/cas/captcha.html?ts=' + new Date().getMilliseconds(), true);
                captchaHttp.responseType = 'blob';
                captchaHttp.send();
            } else {
                postStr = "username=" + username + "&password=" + encodeURIComponent(encryptAES(password, _pwdDefaultEncryptSalt));
                for (var i = 0; i < postForm.length; i++) {
                    postStr += '&' + postForm[i].name + '=' + postForm[i].value;
                }
                //POST to login
                var login = new XMLHttpRequest();
                if (mode == 'page') {
                    login.open('POST', url, true);
                } else {
                    login.open('POST', 'https://pass.ujs.edu.cn/cas/login?service=' + serviceURL, true);
                }
                login.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
                login.send(postStr);
            }
        }
    }
    //验证码处理
    var captchaHttp = new XMLHttpRequest();
    var ocrGetToken = new XMLHttpRequest();
    var ocrSingle = new XMLHttpRequest();
    var ocrYoudao = new XMLHttpRequest();
    var ocrGet = new XMLHttpRequest();
    var uuid = getuuid();
    var token = '';
    var captchaBase64 = '';
    var captcha = '';
    //获取匿名uuid
    function getuuid () {
        var e = (new Date).getTime();
        window.performance && "function" === typeof window.performance.now && (e += performance.now());
        var t = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function (t) {
            var n = (e + 16 * Math.random()) % 16 | 0;
            return e = Math.floor(e / 16),
                ("x" == t ? n : 3 & n | 8).toString(16)
        }
        ));
        return t
    }
    //hash计算
    function gethash (e) {
        var t = 0;
        if (0 == e.length)
            return t;
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            t = (t << 5) - t + r,
                t &= t
        }
        return t
    }
    //通过白描ocr获取验证码
    captchaHttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reader = new FileReader();
            reader.readAsDataURL(captchaHttp.response);
            reader.onloadend = function () {
                captchaBase64 = reader.result;
                ocrGetToken.open('POST', 'https://web.baimiaoapp.com/api/user/login/anonymous', true);
                ocrGetToken.setRequestHeader('x-auth-uuid', uuid);
                ocrGetToken.send();
            }
        }
    }
    ocrGetToken.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            token = JSON.parse(ocrGetToken.response).data.token;
            ocrSingle.open('POST', 'https://web.baimiaoapp.com/api/perm/single', true);
            ocrSingle.setRequestHeader('x-auth-uuid', uuid);
            ocrSingle.setRequestHeader('x-auth-token', token);
            ocrSingle.send();
        }
    }
    ocrSingle.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            ocrYoudao.open('POST', 'https://web.baimiaoapp.com/api/ocr/image/youdao', true);
            ocrYoudao.setRequestHeader('x-auth-uuid', uuid);
            ocrYoudao.setRequestHeader('x-auth-token', token);
            ocrYoudao.setRequestHeader('content-type', 'application/json;charset=UTF-8');
            var ocrForm = {
                batchId: "",
                total: 1,
                hash: gethash(captchaBase64),
                name: "captcha.jfif",
                size: captchaBase64.length,
                dataUrl: captchaBase64,
                result: {},
                status: "processing",
                isSuccess: false
            };
            ocrYoudao.send(JSON.stringify(ocrForm));
        }
    }
    ocrYoudao.onreadystatechange = async function () {
        if (this.readyState == 4 && this.status == 200) {
            await sleep(2500);
            ocrGet.open('GET', 'https://web.baimiaoapp.com/api/ocr/image/youdao/status?jobStatusId=' + encodeURIComponent(JSON.parse(ocrYoudao.response).data.jobStatusId), true);
            ocrGet.setRequestHeader('x-auth-uuid', uuid);
            ocrGet.setRequestHeader('x-auth-token', token);
            ocrGet.send();
        }
    }
    ocrGet.onreadystatechange = async function () {
        if (this.readyState == 4 && this.status == 200) {
            try {
                captcha = JSON.parse(ocrGet.response).data.ydResp.Result.regions[0].lines[0].text.replace(/\u0020/g, '');
                //这里继续登录提交
                postStr = "username=" + username + "&password=" + encodeURIComponent(encryptAES(password, _pwdDefaultEncryptSalt)) + "&captchaResponse=" + captcha;
                for (var i = 0; i < postForm.length; i++) {
                    postStr += '&' + postForm[i].name + '=' + postForm[i].value;
                }
                //POST to login
                login.open('POST', 'https://pass.ujs.edu.cn/cas/login?service=' + serviceURL, true);
                login.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
                login.send(postStr);
            } catch {
                //等待1秒重试
                await sleep(1000);
                ocrGet.open('GET', 'https://web.baimiaoapp.com/api/ocr/image/youdao/status?jobStatusId=' + encodeURIComponent(JSON.parse(ocrYoudao.response).data.jobStatusId), true);
                ocrGet.setRequestHeader('x-auth-uuid', uuid);
                ocrGet.setRequestHeader('x-auth-token', token);
                ocrGet.send();
            }
        }
    }
    login.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var searchStr = "class=\"auth_error\"";//认证错误
            var start = login.response.indexOf(searchStr);
            if (start == -1) {
                status = 1;
                if (mode == 'test') {
                    chrome.notifications.create(null, {
                        type: 'basic',
                        iconUrl: 'img/icon.png',
                        title: 'ujsCAS登录助手',
                        message: '登录成功！',
                        requireInteraction: false,
                        priority: 2
                    });
                } else {
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'loginOK' });
                    });
                }
            } else {
                start = login.response.indexOf('>', start) + 1;
                var end = login.response.indexOf('<', start);
                var errorText = login.response.substring(start, end);
                console.log(errorText);
                if (errorText == '无效的验证码') {
                    //重试
                    xmlhttp.open('GET', 'https://pass.ujs.edu.cn/cas/login', true);
                    xmlhttp.send();
                } else if (errorText == '您提供的用户名或者密码有误') {
                    status = 1;
                    //用户名或密码错误
                    if (mode == 'test') {
                        chrome.notifications.create(null, {
                            type: 'basic',
                            iconUrl: 'img/icon.png',
                            title: 'ujsCAS登录助手',
                            message: '登录失败！（用户名或密码有误）',
                            requireInteraction: false,
                            priority: 2
                        });
                    } else {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, { type: 'tip', data: '登录失败！（用户名或密码有误）' });
                        });
                    }
                } else {
                    status = 1;
                    if (mode == 'test') {
                        chrome.notifications.create(null, {
                            type: 'basic',
                            iconUrl: 'img/icon.png',
                            title: 'ujsCAS登录助手',
                            message: '登录失败！（未知错误：' + errorText + '）',
                            requireInteraction: false,
                            priority: 2
                        });
                    } else {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, { type: 'tip', data: '登录失败！（未知错误：' + errorText + '）' });
                        });
                    }
                }
            }
        }
    }
}