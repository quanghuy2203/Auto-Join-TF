/*
脚本作者：DecoAri
引用地址：https://github.com/DecoAri/JavaScript/blob/main/Surge/TF_keys.js
具体使用步骤
1: 导入插件
2: 到Mitm页面启用 Mitm over Http2
3: 启动VPN，进入到TestFlight App，显示通知信息获取成功
4: 到配置-> 持久化数据 -> 导入指定数据  key填写APP_ID，value填写你要加入的TF的ID，（ID为链接 https://testflight.apple.com/join/LPQmtkUs 的join后的字符串（也就是此例子的“LPQmtkUs”）⚠️：支持无限个TF链接，每个链接需要用英文逗号“,”隔开（如： LPQmtkUs,Hgun65jg,8yhJgv）
）
*/
const reg1 = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*)\/apps$/;
const reg2 = /^https:\/\/testflight\.apple\.com\/join\/(.*)/;

if (reg1.test($request.url)) {
    let url = $request.url;
    let key = url.match(reg1)[1];

    let session_id = $request.headers['X-Session-Id'] || $request.headers['x-session-id'];
    let session_digest = $request.headers['X-Session-Digest'] || $request.headers['x-session-digest'];
    let request_id = $request.headers['X-Request-Id'] || $request.headers['x-request-id'];
    let user_agent = $request.headers['User-Agent'] || $request.headers['user-agent'];

    $persistentStore.write(key, 'key');
    $persistentStore.write(session_id, 'session_id');
    $persistentStore.write(session_digest, 'session_digest');
    $persistentStore.write(request_id, 'request_id');
    $persistentStore.write(user_agent, 'user_agent');

    if (key && session_id && session_digest && request_id && user_agent) {
        $notification.post('Thu thập thông tin TF', 'Thu thập thông tin thành công', '');
    } else {
        $notification.post('Thu thập thông tin TF', 'Không thành công, vui lòng kiểm tra lại', '');
    }
    $done({});
}

if (reg2.test($request.url)) {
    let appID = $persistentStore.read("APP_ID") || "";
    let id = reg2.exec($request.url)[1];

    // Add new app ID to the list
    let appIDs = appID.split(',');
    if (!appIDs.includes(id)) {
        appIDs.push(id);
    }

    // Store updated app IDs
    $persistentStore.write(appIDs.join(','), "APP_ID");

    // Notify user
    $notification.post("TestFlight tự động tham gia", `Đã thêm APP_ID: ${id}`, `ID hiện tại: ${appIDs.join(',')}`);

    $done({});
}
