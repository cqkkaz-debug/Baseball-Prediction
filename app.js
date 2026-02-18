// ========================================
// データ構造とモックデータ
// ========================================

// ローカルストレージのキー
const STORAGE_KEYS = {
    PREDICTIONS: 'baseball_predictions',
    USER_SCORE: 'baseball_user_score',
    USERNAME: 'baseball_username',
    AUTH_SESSION: 'baseball_auth_session',
    DEADLINES: 'baseball_deadlines'
};

// パスワード
const APP_PASSWORD = 'baseball2026';
const ADMIN_PASSWORD = '4185';

// デフォルト締め切り日時（2026年3月6日18:30）
const DEFAULT_DEADLINE = '2026-03-06T18:30:00';

// モック試合データ - WBC日本vs台湾
const mockGames = [
    {
        id: 1,
        homeTeam: '🇯🇵 日本',
        awayTeam: '🇹🇼 台湾',
        tournament: 'WBC 2026',
        startTime: '2026-03-06T18:30:00',
        status: 'open',
        predictions: 1247
    }
];

// 予想者のモックデータ（実際のユーザー予想のみを表示）
const mockPredictors = [];

// モックランキングデータ
const mockRanking = [
    { username: '野球マスター', score: 2850 },
    { username: 'ホームラン王', score: 2640 },
    { username: '予想の達人', score: 2420 },
    { username: 'ベースボールファン', score: 2180 },
    { username: 'スコアハンター', score: 1950 },
    { username: '野球好き太郎', score: 1820 },
    { username: 'データ分析家', score: 1670 },
    { username: '試合観戦者', score: 1540 },
    { username: '予想屋さん', score: 1390 },
    { username: 'ゲスト', score: 0 }
];

// ========================================
// グローバル変数
// ========================================
let currentGameId = null;
let userPredictions = {};
let userScore = 0;
let username = 'ゲスト';
let gameDeadlines = {}; // 試合ごとの締め切り時間

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadUserData();
    initTabs();
    renderGames();
    renderPredictors();
    renderMyPredictions();
    initModal();
    initUsernameModal();
    initAdminModal();
    updateUserDisplay();

    // 初回訪問時にユーザー名入力を促す
    if (username === 'ゲスト') {
        setTimeout(() => {
            openUsernameModal();
        }, 500);
    }
}

// ========================================
// ユーザーデータの読み込み・保存
// ========================================
function loadUserData() {
    const savedPredictions = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
    const savedScore = localStorage.getItem(STORAGE_KEYS.USER_SCORE);
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const savedDeadlines = localStorage.getItem(STORAGE_KEYS.DEADLINES);

    if (savedPredictions) {
        userPredictions = JSON.parse(savedPredictions);
    }
    if (savedScore) {
        userScore = parseInt(savedScore);
    }
    if (savedUsername) {
        username = savedUsername;
    }
    if (savedDeadlines) {
        gameDeadlines = JSON.parse(savedDeadlines);
    }
}

function saveUserData() {
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(userPredictions));
    localStorage.setItem(STORAGE_KEYS.USER_SCORE, userScore.toString());
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    localStorage.setItem(STORAGE_KEYS.DEADLINES, JSON.stringify(gameDeadlines));
}

function updateUserDisplay() {
    document.getElementById('username').textContent = username;
    document.getElementById('userScore').textContent = `${userScore}pt`;
}

// ========================================
// タブ機能
// ========================================
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // タブの切り替え
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // コンテンツの切り替え
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${targetTab}-content`).classList.add('active');

            // タブごとの再レンダリング
            if (targetTab === 'mypredictions') {
                renderMyPredictions();
            } else if (targetTab === 'predictors') {
                renderPredictors();
            }
        });
    });
}

// ========================================
// 試合一覧の描画
// ========================================
function renderGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    gamesGrid.innerHTML = '';

    mockGames.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = `game-card ${game.status}`;

    // 締め切り時間を取得（カスタム設定があればそれを使用、なければデフォルト締め切り日時）
    const deadlineTime = gameDeadlines[game.id]
        ? new Date(gameDeadlines[game.id])
        : new Date(DEFAULT_DEADLINE);
    const now = new Date();
    const isOpen = deadlineTime > now;
    const hasPrediction = userPredictions[game.id] !== undefined;

    card.innerHTML = `
        ${game.tournament ? `<div class="tournament-badge">${game.tournament}</div>` : ''}
        <div class="game-time">
            <span class="game-date">${formatDateTime(new Date(game.startTime))}</span>
            <span class="game-status ${isOpen ? 'open' : 'closed'}">
                ${isOpen ? '受付中' : '締切'}
            </span>
        </div>
        <div class="game-teams">
            <div class="team">
                <span class="team-name">${game.homeTeam}</span>
                <span class="team-score">-</span>
            </div>
            <div class="team">
                <span class="team-name">${game.awayTeam}</span>
                <span class="team-score">-</span>
            </div>
        </div>
        <div class="game-footer">
            <span class="prediction-count">${game.predictions}人が予想中</span>
            <button class="btn-predict" ${!isOpen ? 'disabled' : ''}>
                ${hasPrediction ? '予想を変更' : '予想する'}
            </button>
        </div>
    `;

    const predictBtn = card.querySelector('.btn-predict');
    if (isOpen) {
        predictBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPredictionModal(game);
        });
    }

    return card;
}

// ========================================
// ランキングの描画
// ========================================
function renderRanking() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    // ユーザーのスコアを反映
    const updatedRanking = mockRanking.map(user => {
        if (user.username === username) {
            return { ...user, score: userScore };
        }
        return user;
    }).sort((a, b) => b.score - a.score);

    updatedRanking.forEach((user, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'ranking-item';

        let rankClass = '';
        if (index === 0) rankClass = 'top1';
        else if (index === 1) rankClass = 'top2';
        else if (index === 2) rankClass = 'top3';

        rankItem.innerHTML = `
            <div class="rank-number ${rankClass}">${index + 1}</div>
            <div class="rank-user">${user.username}</div>
            <div class="rank-score">${user.score}pt</div>
        `;

        rankingList.appendChild(rankItem);
    });
}

// ========================================
// 予想者一覧の描画
// ========================================
function renderPredictors() {
    const predictorsList = document.getElementById('predictorsList');
    predictorsList.innerHTML = '';

    // ユーザーの予想も含める
    const allPredictors = [...mockPredictors];

    // ユーザーが予想している場合は追加
    if (userPredictions[1]) {
        const userPrediction = userPredictions[1];
        allPredictors.push({
            username: username,
            home5th: userPrediction.home5th,
            away5th: userPrediction.away5th,
            homeFinal: userPrediction.homeFinal,
            awayFinal: userPrediction.awayFinal,
            timestamp: userPrediction.timestamp
        });
    }

    // 予想者がいない場合
    if (allPredictors.length === 0) {
        predictorsList.innerHTML = '<p class="empty-state">まだ予想がありません</p>';
        return;
    }

    // タイムスタンプでソート（新しい順）
    allPredictors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    allPredictors.forEach((predictor, index) => {
        const predictorCard = document.createElement('div');
        predictorCard.className = 'predictor-card';

        const isCurrentUser = predictor.username === username;

        predictorCard.innerHTML = `
            <div class="predictor-header">
                <div class="predictor-rank">#${index + 1}</div>
                <div class="predictor-name ${isCurrentUser ? 'current-user' : ''}">${predictor.username}</div>
                <div class="predictor-time">${formatTime(new Date(predictor.timestamp))}</div>
            </div>
            <div class="predictor-predictions">
                <div class="predictor-prediction">
                    <div class="prediction-label">5回裏終了</div>
                    <div class="prediction-score">
                        <span class="score-value">${predictor.home5th}</span>
                        <span class="score-separator">-</span>
                        <span class="score-value">${predictor.away5th}</span>
                    </div>
                </div>
                <div class="predictor-prediction">
                    <div class="prediction-label">試合終了</div>
                    <div class="prediction-score">
                        <span class="score-value">${predictor.homeFinal}</span>
                        <span class="score-separator">-</span>
                        <span class="score-value">${predictor.awayFinal}</span>
                    </div>
                </div>
            </div>
        `;

        predictorsList.appendChild(predictorCard);
    });
}

// ========================================
// マイ予想の描画
// ========================================
function renderMyPredictions() {
    const myPredictionsDiv = document.getElementById('myPredictions');

    const predictions = Object.entries(userPredictions);

    if (predictions.length === 0) {
        myPredictionsDiv.innerHTML = '<p class="empty-state">まだ予想がありません</p>';
        return;
    }

    myPredictionsDiv.innerHTML = '';

    predictions.forEach(([gameId, prediction]) => {
        const game = mockGames.find(g => g.id === parseInt(gameId));
        if (!game) return;

        const predictionCard = document.createElement('div');
        predictionCard.className = 'game-card';
        predictionCard.innerHTML = `
            <div class="game-time">
                <span class="game-date">${formatDateTime(new Date(game.startTime))}</span>
            </div>
            <div class="game-teams">
                <div class="team">
                    <span class="team-name">${game.homeTeam}</span>
                </div>
                <div class="team">
                    <span class="team-name">${game.awayTeam}</span>
                </div>
            </div>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                <div style="margin-bottom: 0.5rem;">
                    <strong>5回裏終了:</strong> ${prediction.home5th} - ${prediction.away5th}
                </div>
                <div>
                    <strong>試合終了:</strong> ${prediction.homeFinal} - ${prediction.awayFinal}
                </div>
            </div>
        `;

        myPredictionsDiv.appendChild(predictionCard);
    });
}

// ========================================
// モーダル機能
// ========================================
function initModal() {
    const modal = document.getElementById('predictionModal');
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('modalCancel');
    const submitBtn = document.getElementById('modalSubmit');

    // 閉じる処理
    const closeModal = () => {
        modal.classList.remove('active');
        currentGameId = null;
    };

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // 送信処理
    submitBtn.addEventListener('click', submitPrediction);
}

function openPredictionModal(game) {
    currentGameId = game.id;
    const modal = document.getElementById('predictionModal');

    // タイトル設定
    document.getElementById('modalTitle').textContent = '予想を入力';

    // 試合情報設定
    const gameInfo = document.getElementById('modalGameInfo');
    gameInfo.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">
                ${game.homeTeam} vs ${game.awayTeam}
            </div>
            <div style="font-size: 0.875rem; color: var(--text-muted);">
                ${formatDateTime(new Date(game.startTime))}
            </div>
        </div>
    `;

    // チーム名設定
    document.getElementById('homeTeam5th').textContent = game.homeTeam;
    document.getElementById('awayTeam5th').textContent = game.awayTeam;
    document.getElementById('homeTeamFinal').textContent = game.homeTeam;
    document.getElementById('awayTeamFinal').textContent = game.awayTeam;

    // 既存の予想があれば設定
    const existingPrediction = userPredictions[game.id];
    if (existingPrediction) {
        document.getElementById('home5th').value = existingPrediction.home5th;
        document.getElementById('away5th').value = existingPrediction.away5th;
        document.getElementById('homeFinal').value = existingPrediction.homeFinal;
        document.getElementById('awayFinal').value = existingPrediction.awayFinal;
    } else {
        document.getElementById('home5th').value = 0;
        document.getElementById('away5th').value = 0;
        document.getElementById('homeFinal').value = 0;
        document.getElementById('awayFinal').value = 0;
    }

    modal.classList.add('active');
}

function submitPrediction() {
    if (!currentGameId) return;

    const prediction = {
        home5th: parseInt(document.getElementById('home5th').value),
        away5th: parseInt(document.getElementById('away5th').value),
        homeFinal: parseInt(document.getElementById('homeFinal').value),
        awayFinal: parseInt(document.getElementById('awayFinal').value),
        timestamp: new Date().toISOString()
    };

    // バリデーション
    if (prediction.homeFinal < prediction.home5th || prediction.awayFinal < prediction.away5th) {
        alert('最終スコアは5回裏終了時のスコア以上にしてください');
        return;
    }

    // 新規予想の場合はポイント付与
    if (!userPredictions[currentGameId]) {
        userScore += 10;
    }

    userPredictions[currentGameId] = prediction;
    saveUserData();
    updateUserDisplay();

    // モーダルを閉じる
    document.getElementById('predictionModal').classList.remove('active');
    currentGameId = null;

    // 画面を更新
    renderGames();
    renderPredictors();

    // 成功メッセージ
    alert('予想を送信しました！');
}

// ========================================
// ユーザー名モーダル機能
// ========================================
function initUsernameModal() {
    const usernameBtn = document.getElementById('usernameBtn');
    const submitBtn = document.getElementById('usernameSubmit');
    const usernameInput = document.getElementById('usernameInput');

    // ユーザー名ボタンクリック
    usernameBtn.addEventListener('click', () => {
        openUsernameModal();
    });

    // 決定ボタンクリック
    submitBtn.addEventListener('click', () => {
        submitUsername();
    });

    // Enterキーで送信
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitUsername();
        }
    });
}

function openUsernameModal() {
    const modal = document.getElementById('usernameModal');
    const input = document.getElementById('usernameInput');

    input.value = username === 'ゲスト' ? '' : username;
    modal.classList.add('active');

    // フォーカスを当てる
    setTimeout(() => {
        input.focus();
    }, 100);
}

function submitUsername() {
    const input = document.getElementById('usernameInput');
    const newUsername = input.value.trim();

    if (newUsername === '') {
        alert('ユーザー名を入力してください');
        return;
    }

    if (newUsername.length < 2) {
        alert('ユーザー名は2文字以上で入力してください');
        return;
    }

    // ユーザー名を更新
    username = newUsername;
    saveUserData();
    updateUserDisplay();

    // モーダルを閉じる
    document.getElementById('usernameModal').classList.remove('active');

    // 画面を更新
    renderPredictors();
}

// ========================================
// ユーティリティ関数
// ========================================
function formatDateTime(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
}

function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ========================================
// 管理画面機能
// ========================================
function initAdminModal() {
    const adminBtn = document.getElementById('adminBtn');
    const adminPasswordModal = document.getElementById('adminPasswordModal');
    const adminPasswordOverlay = document.getElementById('adminPasswordOverlay');
    const adminPasswordClose = document.getElementById('adminPasswordClose');
    const adminPasswordCancel = document.getElementById('adminPasswordCancel');
    const adminPasswordSubmit = document.getElementById('adminPasswordSubmit');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminPasswordError = document.getElementById('adminPasswordError');

    const adminModal = document.getElementById('adminModal');
    const adminModalOverlay = document.getElementById('adminModalOverlay');
    const adminModalClose = document.getElementById('adminModalClose');
    const adminModalSave = document.getElementById('adminModalSave');

    // 管理ボタンクリック
    adminBtn.addEventListener('click', () => {
        adminPasswordModal.classList.add('active');
        setTimeout(() => {
            adminPasswordInput.focus();
        }, 100);
    });

    // パスワードモーダルを閉じる
    const closePasswordModal = () => {
        adminPasswordModal.classList.remove('active');
        adminPasswordInput.value = '';
        adminPasswordError.textContent = '';
    };

    adminPasswordOverlay.addEventListener('click', closePasswordModal);
    adminPasswordClose.addEventListener('click', closePasswordModal);
    adminPasswordCancel.addEventListener('click', closePasswordModal);

    // Enterキーで送信
    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAdminPassword();
        }
    });

    // パスワード確認
    adminPasswordSubmit.addEventListener('click', verifyAdminPassword);

    function verifyAdminPassword() {
        const password = adminPasswordInput.value;

        if (password === ADMIN_PASSWORD) {
            // 認証成功
            closePasswordModal();
            openAdminModal();
        } else {
            // 認証失敗
            adminPasswordError.textContent = '管理者パスワードが正しくありません';
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    }

    // 管理画面を開く
    function openAdminModal() {
        renderAdminGames();
        adminModal.classList.add('active');
    }

    // 管理画面を閉じる
    const closeAdminModal = () => {
        adminModal.classList.remove('active');
    };

    adminModalOverlay.addEventListener('click', closeAdminModal);
    adminModalClose.addEventListener('click', closeAdminModal);

    // 保存して閉じる
    adminModalSave.addEventListener('click', () => {
        saveDeadlines();
        closeAdminModal();
        renderGames(); // 試合一覧を再描画
    });
}

function renderAdminGames() {
    const adminGamesList = document.getElementById('adminGamesList');
    adminGamesList.innerHTML = '';

    mockGames.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.className = 'admin-game-item';

        // 現在の締め切り時間を取得
        const currentDeadline = gameDeadlines[game.id]
            ? new Date(gameDeadlines[game.id]).toISOString().slice(0, 16)
            : new Date(game.startTime).toISOString().slice(0, 16);

        gameItem.innerHTML = `
            <div class="admin-game-info">
                <div class="admin-game-title">${game.homeTeam} vs ${game.awayTeam}</div>
                <div class="admin-game-subtitle">試合開始: ${formatDateTime(new Date(game.startTime))}</div>
            </div>
            <div class="admin-game-deadline">
                <label for="deadline-${game.id}">締め切り時間:</label>
                <input 
                    type="datetime-local" 
                    id="deadline-${game.id}" 
                    value="${currentDeadline}"
                    class="deadline-input"
                />
            </div>
        `;

        adminGamesList.appendChild(gameItem);
    });
}

function saveDeadlines() {
    mockGames.forEach(game => {
        const input = document.getElementById(`deadline-${game.id}`);
        if (input && input.value) {
            gameDeadlines[game.id] = new Date(input.value).toISOString();
        }
    });
    saveUserData();
}
