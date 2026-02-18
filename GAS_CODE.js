// このスクリプトをGoogleスプレッドシートの「拡張機能」>「Apps Script」に貼り付けてください

function doGet(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // 1行目はヘッダーとして扱う（存在しない場合は作成）
    if (data.length === 0) {
        sheet.appendRow(['timestamp', 'gameId', 'username', 'home5th', 'away5th', 'homeFinal', 'awayFinal']);
        return ContentService.createTextOutput(JSON.stringify({}))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // データをオブジェクトに変換
    const predictions = {};

    // 2行目以降のデータを処理
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // [timestamp, gameId, username, home5th, away5th, homeFinal, awayFinal]
        const timestamp = row[0];
        const gameId = row[1];
        const username = row[2];

        if (!gameId || !username) continue;

        if (!predictions[gameId]) {
            predictions[gameId] = {};
        }

        predictions[gameId][username] = {
            username: username,
            home5th: row[3],
            away5th: row[4],
            homeFinal: row[5],
            awayFinal: row[6],
            timestamp: timestamp
        };
    }

    return ContentService.createTextOutput(JSON.stringify(predictions))
        .setMimeType(ContentService.MimeType.JSON);
}
// 予想データを保存するAPI (POST)
function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // デバッグ用: 受け取ったデータそのものを記録してみる（動作確認用）
    // sheet.appendRow(['DEBUG', new Date(), JSON.stringify(e)]);

    try {
        // データが postData.contents に入っている場合と、parameter に入っている場合の両方に対応
        let params;
        if (e.postData && e.postData.contents) {
            params = JSON.parse(e.postData.contents);
        } else if (e.parameter && e.parameter.data) {
            params = JSON.parse(e.parameter.data);
        } else {
            throw new Error('No data received');
        }

        const gameId = params.gameId;
        const username = params.username;
        const p = params.prediction;

        // 必須チェック
        if (!gameId || !username || !p) {
            throw new Error(`Missing required fields: gameId=${gameId}, username=${username}`);
        }

        // 同じユーザーのデータを更新 (上書き)
        const data = sheet.getDataRange().getValues();
        let updated = false;

        for (let i = 1; i < data.length; i++) {
            if (data[i][1] == gameId && data[i][2] == username) {
                sheet.getRange(i + 1, 1, 1, 7).setValues([[
                    new Date().toISOString(),
                    gameId,
                    username,
                    p.home5th,
                    p.away5th,
                    p.homeFinal,
                    p.awayFinal
                ]]);
                updated = true;
                break;
            }
        }

        // 新規追加
        if (!updated) {
            sheet.appendRow([
                new Date().toISOString(),
                gameId,
                username,
                p.home5th,
                p.away5th,
                p.homeFinal,
                p.awayFinal
            ]);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // エラー内容をシートに記録して原因を特定しやすくする
        sheet.appendRow(['ERROR', new Date(), error.toString()]);

        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
