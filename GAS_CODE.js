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

function doPost(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        const params = JSON.parse(e.postData.contents);

        const gameId = params.gameId;
        const username = params.username;
        const prediction = params.prediction;

        // 既存のデータを確認して更新（同じユーザーの同じ試合の予想があれば上書き）
        const data = sheet.getDataRange().getValues();
        let rowUpdated = false;

        for (let i = 1; i < data.length; i++) {
            if (data[i][1] == gameId && data[i][2] == username) {
                // 更新: [timestamp, gameId, username, home5th, away5th, homeFinal, awayFinal]
                const range = sheet.getRange(i + 1, 1, 1, 7);
                range.setValues([[
                    new Date().toISOString(),
                    gameId,
                    username,
                    prediction.home5th,
                    prediction.away5th,
                    prediction.homeFinal,
                    prediction.awayFinal
                ]]);
                rowUpdated = true;
                break;
            }
        }

        // 新規追加
        if (!rowUpdated) {
            sheet.appendRow([
                new Date().toISOString(),
                gameId,
                username,
                prediction.home5th,
                prediction.away5th,
                prediction.homeFinal,
                prediction.awayFinal
            ]);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
