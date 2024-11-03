/*
Script Author: DecoAri
Fix Author: Hely-T
Reference: https://github.com/Hely-T/TestFlight-All/
Thanks to a great person for adapting this script into Loon version!
*/
!(async () => {
  let ids = $persistentStore.read('APP_ID');
  if (ids == null) {
    $notification.post('TestFlight APP_ID chưa được thêm', 'Vui lòng thêm thủ công hoặc sử dụng liên kết TestFlight để tải tự động', '');
  } else if (ids === '') {
    $notification.post('Tất cả TestFlight đã được thêm vào', 'Vui lòng tắt plugin theo cách thủ công', '');
  } else {
    ids = ids.split(',');
    for await (const ID of ids) {
      try {
        await autoPost(ID);
      } catch (error) {
        console.error(`Lỗi xảy ra khi xử lý ID ${ID}:`, error);
      }
    }
  }
  $done();
})();

async function autoPost(ID) {
  let Key = $persistentStore.read('key');
  if (!Key) {
    throw new Error('Key không tồn tại trong persistent store');
  }
  
  let testurl = `https://testflight.apple.com/v3/accounts/${Key}/ru/`;
  let header = {
    'X-Session-Id': $persistentStore.read('session_id') || '',
    'X-Session-Digest': $persistentStore.read('session_digest') || '',
    'X-Request-Id': $persistentStore.read('request_id') || '',
    'User-Agent': $persistentStore.read('tf_ua') || ''
  };

  return new Promise((resolve) => {
    $httpClient.get({ url: testurl + ID, headers: header }, function (error, resp, data) {
      if (error) {
        console.error(`Lỗi khi gửi yêu cầu GET cho ID ${ID}:`, error);
        resolve();
        return;
      }

      if (resp.status === 404) {
        ids = $persistentStore.read('APP_ID').split(',');
        ids = ids.filter(currentID => currentID !== ID);
        $persistentStore.write(ids.toString(), 'APP_ID');
        console.log(`${ID} TestFlight không tồn tại, APP_ID đã tự động bị xóa`);
        $notification.post(ID, 'TestFlight không tồn tại', 'APP_ID đã tự động bị xóa');
        resolve();
      } else {
        try {
          let jsonData = JSON.parse(data);
          if (!jsonData.data) {
            console.log(`${ID} ${jsonData.messages?.[0]?.message || 'Không có dữ liệu trả về'}`);
            resolve();
          } else if (jsonData.data.status === 'FULL') {
            console.log(`${jsonData.data.app.name} ${ID} ${jsonData.data.message}`);
            resolve();
          } else {
            $httpClient.post({ url: testurl + ID + '/accept', headers: header }, function (error, resp, body) {
              if (error) {
                console.error(`Lỗi khi gửi yêu cầu POST cho ID ${ID}:`, error);
                resolve();
                return;
              }
              
              try {
                let jsonBody = JSON.parse(body);
                if (jsonBody.data) {
                  $notification.post(jsonBody.data.name, 'TestFlight đã tham gia thành công.', '');
                  console.log(`${jsonBody.data.name} TestFlight đã tham gia thành công.`);
                } else {
                  console.log(`Dữ liệu POST không hợp lệ cho ID ${ID}`);
                }
                ids = $persistentStore.read('APP_ID').split(',');
                ids = ids.filter(currentID => currentID !== ID);
                $persistentStore.write(ids.toString(), 'APP_ID');
              } catch (parseError) {
                console.error(`Lỗi phân tích JSON từ phản hồi POST cho ID ${ID}:`, parseError);
              }
              resolve();
            });
          }
        } catch (parseError) {
          console.error(`Lỗi phân tích JSON từ phản hồi GET cho ID ${ID}:`, parseError);
          resolve();
        }
      }
    });
  });
}