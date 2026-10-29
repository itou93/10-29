const deptNames = {
    'stamp-a': '電子機械科',
    'stamp-b': '情報技術科',
    'stamp-c': '情報処理科',
    'stamp-d': '服飾デザイン科',
    'stamp-e': '食物調理科',
    'stamp-f': '流通経済科'
};

let clickCount = 0;
let clickTimer = null;

// 来場者向けの案内メッセージ＆ボタン表示制御
function updateSoftLog(status, message, isSuccess = true) {
    const statusEl = document.getElementById('log-status');
    const msgEl = document.getElementById('log-message');
    const btnEl = document.getElementById('btn-to-test');

    if (statusEl && msgEl) {
        statusEl.textContent = status;
        if (isSuccess) {
            statusEl.style.background = '#d1fae5';
            statusEl.style.color = '#047857';
            if (btnEl) btnEl.style.display = 'block';
        } else {
            statusEl.style.background = '#e2e8f0';
            statusEl.style.color = '#475569';
            if (btnEl) btnEl.style.display = 'none';
        }
        msgEl.textContent = message;
    }
}

function showNearObjectLog() {
    return;
}

// 動画の自動再生
function handlePlayVideo(targetElem, path) {
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
        const src = v.getAttribute('src');
        if (src && src.includes(path)) {
            v.muted = true;
            v.play().then(() => {
                const aVideo = targetElem.querySelector('a-video');
                if (aVideo) {
                    const mesh = aVideo.getObject3D('mesh');
                    if (mesh && mesh.material && mesh.material.map) {
                        mesh.material.map.needsUpdate = true;
                    }
                }
            }).catch(e => console.log("再生エラー:", e));
        }
    });
}

function handlePauseVideo(path) {
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
        const src = v.getAttribute('src');
        if (src && src.includes(path)) {
            v.pause();
        }
    });
}

function stopWebcamStream() {
    try {
        const videoElems = document.querySelectorAll('video');
        videoElems.forEach(video => {
            if (video.srcObject) {
                const stream = video.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        });
    } catch (e) {
        console.warn("カメラ停止処理エラー:", e);
    }
}

// 学科ごとに個別に解放処理を行うイベントバインド
function bindMindEvents() {
    // 学科ごとのターゲット設定リスト（targetIndex は targets.mind 内の画像順）
    const targets = [
        { id: 'target-a', flag: 'stamp-a-flag', name: '電子機械科', video: 'denshi.mp4' },
        { id: 'target-b', flag: 'stamp-b-flag', name: '情報技術科', video: 'joho_gijutsu.mp4' },
        { id: 'target-c', flag: 'stamp-c-flag', name: '情報処理科', video: 'joho_syori.mp4' },
        { id: 'target-d', flag: 'stamp-d-flag', name: '服飾デザイン科', video: 'hukudelong.mp4' },
        { id: 'target-e', flag: 'stamp-e-flag', name: '食物調理科', video: 'chouri.mp4' },
        { id: 'target-f', flag: 'stamp-f-flag', name: '流通経済科', video: 'ryutsu.mp4' }
    ];

    targets.forEach(item => {
        const elem = document.getElementById(item.id);
        if (elem) {
            // 検出したターゲットの学科だけを個別に解放
            elem.addEventListener('targetFound', function() {
                console.log(`検出成功: ${item.name}`);
                try { 
                    localStorage.setItem(item.flag, '1'); // 読み取った学科のみ1にする
                } catch(e){}

                updateSoftLog('検出成功！', `🎉 ${item.name} の動画が解放されました！`, true);
                handlePlayVideo(this, item.video);
            });

            elem.addEventListener('targetLost', function() {
                console.log(`ターゲット喪失: ${item.name}`);
                updateSoftLog('スキャン中', '近くに読み取れるものがあるかも！ボタンを押してみよう', false);
                handlePauseVideo(item.video);
            });
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const unlockAudio = () => {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
            if (!v.paused) v.muted = false;
        });
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    bindMindEvents();
});

window.addEventListener('beforeunload', () => {
    stopWebcamStream();
});

function goBack() {
    stopWebcamStream();
    window.location.href = 'index.html';
}

function switchToMarkerless() {
    stopWebcamStream();
    window.location.href = 'test.html';
}

// 説明画面の「Next ➔」を押してMindARシーン生成（学科ごとのターゲット生成）
function startAR() {
    const screen = document.getElementById('explanation-screen');
    if (screen) {
        screen.remove();
    }

    const container = document.getElementById('ar-container');
    if (container && !document.getElementById('ar-scene')) {
        container.innerHTML = `
            <a-scene 
                id="ar-scene"
                mindar-image="imageTargetSrc: ./targets.mind;" 
                color-space="sRGB" 
                renderer="colorManagement: true, physicallyCorrectLights" 
                vr-mode-ui="enabled: false" 
                device-orientation-permission-ui="enabled: false">
            
                <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

                <!-- targets.mind 内の画像インデックス（0〜5）と学科を1対1で対応付け -->
                <a-entity id="target-a" mindar-image-target="targetIndex: 0"></a-entity>
                <a-entity id="target-b" mindar-image-target="targetIndex: 1"></a-entity>
                <a-entity id="target-c" mindar-image-target="targetIndex: 2"></a-entity>
                <a-entity id="target-d" mindar-image-target="targetIndex: 3"></a-entity>
                <a-entity id="target-e" mindar-image-target="targetIndex: 4"></a-entity>
                <a-entity id="target-f" mindar-image-target="targetIndex: 5"></a-entity>
            </a-scene>
        `;

        setTimeout(() => {
            bindMindEvents();
        }, 300);
    }
}

function openCollection() {
    const modal = document.getElementById('collection-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCollection() {
    const modal = document.getElementById('collection-modal');
    if (modal) modal.style.display = 'none';
}

function selectDepartment(deptKey) {
    openDeptVideos(deptKey);
}

function openDeptVideos(deptKey) {
    const modal = document.getElementById('dept-video-modal');
    const title = document.getElementById('dept-title');
    const list = document.getElementById('dept-video-list');
    
    if (title) title.textContent = `${deptNames[deptKey] || '学科'} の動画`;
    
    if (list) {
        list.innerHTML = '';

        const deptVideoData = {
            'stamp-a': { id: 'stamp-a-flag', title: '電子機械科 紹介動画', src: 'denshi.mp4' },
            'stamp-b': { id: 'stamp-b-flag', title: '情報技術科 紹介動画', src: 'joho_gijutsu.mp4' },
            'stamp-c': { id: 'stamp-c-flag', title: '情報処理科 紹介動画', src: 'joho_syori.mp4' },
            'stamp-d': { id: 'stamp-d-flag', title: '服飾デザイン科 紹介動画', src: 'hukudelong.mp4' },
            'stamp-e': { id: 'stamp-e-flag', title: '食物調理科 紹介動画', src: 'chouri.mp4' },
            'stamp-f': { id: 'stamp-f-flag', title: '流通経済科 紹介動画', src: 'ryutsu.mp4' }
        };

        const videoInfo = deptVideoData[deptKey];

        if (videoInfo) {
            let isUnlocked = false;

            try {
                isUnlocked = (localStorage.getItem(videoInfo.id) === '1');
            } catch (e) {
                isUnlocked = false;
            }

            const div = document.createElement('div');
            div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            if (isUnlocked) {
                div.innerHTML = `
                    <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 ${videoInfo.title}</p>
                    <video src="${videoInfo.src}" controls style="width:100%; border-radius:8px; display:block;"></video>
                `;
            } else {
                div.innerHTML = `
                    <p style="font-weight:bold; margin:0; color:#475569;">🔒 ${videoInfo.title}</p>
                    <div class="secret-box" style="background:#cbd5e1; border-radius:10px; padding:20px; text-align:center; margin-top:8px;">
                        <div class="secret-icon" style="font-size:36px; font-weight:bold; color:#64748b; margin-bottom:4px;">❓</div>
                        <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                    </div>
                `;
            }
            list.appendChild(div);
        }
    }
    
    const collectionModal = document.getElementById('collection-modal');
    if (collectionModal) collectionModal.style.display = 'none';
    if (modal) modal.style.display = 'flex';
}

function closeDeptVideos() {
    const deptModal = document.getElementById('dept-video-modal');
    const collectionModal = document.getElementById('collection-modal');
    
    if (deptModal) {
        const videos = deptModal.querySelectorAll('video');
        videos.forEach(v => v.pause());
        deptModal.style.display = 'none';
    }
    
    if (collectionModal) {
        collectionModal.style.display = 'flex';
    }
}

function handleTitleClick() {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 5) {
        clickCount = 0;
        if (confirm('【開発者コマンド】スタンプと解放状況を全リセットしますか？')) {
            try { localStorage.clear(); } catch(e){}
            alert('すべての進行状況をリセットしました！');
            location.reload();
        }
    } else {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1500);
    }
}