/*
Script Author: DecoAri
Fix Author: Hely-T
Reference: https://github.com/Hely-T/TestFlight-All/
*/
!(async () => {
  let ids = $persistentStore.read('APP_ID')?.split(',').filter(id => id.trim() !== '');
  if (!ids || ids.length === 0) {
    $notification.post('Thông báo', 'APP_ID chưa được thêm hoặc tất cả đã được xử lý', 'Vui lòng kiểm tra và cập nhật APP_ID');
    return $done();
  }

  for (const ID of ids) {
    await autoPost(ID);
  }
  $done();
})();

async function autoPost(ID) {
  const key = $persistentStore.read('key');
  const sessionId = $persistentStore.read('session_id');
  const sessionDigest = $persistentStore.read('session_digest');
  const requestId = $persistentStore.read('request_id');
  const userAgent = $persistentStore.read('tf_ua');

  const testUrl = `https://testflight.apple.com/v3/accounts/${key}/ru/${ID}`;
  const headers = {
    'X-Session-Id': sessionId,
    'X-Session-Digest': sessionDigest,
    'X-Request-Id': requestId,
    'User-Agent': userAgent,
  };

  try {
    const response = await httpGet(testUrl, headers);
    if (response.status === 404) {
      handleNonExistentApp(ID);
    } else {
      processAppResponse(ID, response.data, testUrl, headers);
    }
  } catch (error) {
    console.error(`${ID} - Lỗi: ${error}`);
  }
}

async function processAppResponse(ID, data, testUrl, headers) {
  const jsonData = JSON.parse(data);
  if (!jsonData.data) {
    console.log(`${ID} - ${jsonData.messages[0].message}`);
  } else if (jsonData.data.status === 'FULL') {
    console.log(`${jsonData.data.app.name} (${ID}) - ${jsonData.data.message}`);
  } else {
    const postResponse = await httpPost(`${testUrl}/accept`, headers);
    const jsonBody = JSON.parse(postResponse.data);
    console.log(`${jsonBody.data.name} - TestFlight đã tham gia thành công.`);
    $notification.post(jsonBody.data.name, 'TestFlight đã tham gia thành công.', '');
    removeAppId(ID);
  }
}

function handleNonExistentApp(ID) {
  removeAppId(ID);
  console.log(`${ID} không tồn tại, APP_ID đã tự động bị xóa`);
  $notification.post(ID, 'TestFlight không tồn tại', 'APP_ID đã tự động bị xóa');
}

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (error, resp, data) => {
      if (error) return reject(error);
      resolve({ status: resp.status, data });
    });
  });
}

function httpPost(url, headers) {
  return new Promise((resolve, reject) => {
    $httpClient.post({ url, headers }, (error, resp, data) => {
      if (error) return reject(error);
      resolve({ status: resp.status, data });
    });
  });
}

function removeAppId(ID) {
  let ids = $persistentStore.read('APP_ID').split(',').filter(id => id !== ID);
  $persistentStore.write(ids.join(','), 'APP_ID');
}