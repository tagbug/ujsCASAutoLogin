var inputs = document.getElementsByTagName('input');
var setting;
chrome.storage.local.get({ username: '', password: '' }, function (data) {
    inputs[0].value = data.username;
    inputs[1].value = data.password;
});
document.getElementById('setting').onsubmit = function () {
    chrome.storage.local.set({ inited: true, username: inputs[0].value, password: inputs[1].value }, function () {
        chrome.runtime.sendMessage({ type: 'saved' });
        inputs[2].value = "保存成功！";
    });
    return false;
};
document.getElementById('test').onclick = function () {
    chrome.runtime.sendMessage({ type: 'test' });
    document.getElementById('test').innerHTML = '请稍等..';
};