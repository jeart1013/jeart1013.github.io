// =========================================
// 設備偵測與初始化
// =========================================

function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);
    const isMobileScreen = window.innerWidth <= 768;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return isMobileUA || (isMobileScreen && hasTouchScreen);
}

function displayContent() {
    const pcContent = document.getElementById('pc-content');
    const mobileContent = document.getElementById('mobile-content');

    if (isMobileDevice()) {
        console.log('✅ 偵測到行動裝置');
        mobileContent.classList.add('active');
        pcContent.classList.remove('active');
        initializeVideoPlayer('mobile');
    } else {
        console.log('✅ 偵測到桌面裝置');
        pcContent.classList.add('active');
        mobileContent.classList.remove('active');
        initializeVideoPlayer('pc');
    }
}

// =========================================
// HLS 影片播放器
// =========================================

let hls = null;
let totalDownloaded = 0;

function initializeVideoPlayer(platform) {
    const videoPlayer = platform === 'pc'
        ? document.getElementById('pc-video-player')
        : document.getElementById('video-player');
    const videoStatus = platform === 'pc'
        ? document.getElementById('pc-video-status')
        : document.getElementById('video-status');

    const prefix = platform === 'pc' ? 'pc' : 'mobile';
    const infoElements = {
        resolution: document.getElementById(prefix + '-resolution'),
        quality: document.getElementById(prefix + '-quality'),
        bitrate: document.getElementById(prefix + '-bitrate'),
        levels: document.getElementById(prefix + '-levels'),
        downloaded: document.getElementById(prefix + '-downloaded')
    };

    if (!videoPlayer) {
        console.error('❌ 找不到影片元素');
        return;
    }

    const videoUrl = 'video/master_all.m3u8';

    if (!Hls.isSupported()) {
        if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = videoUrl;
            videoPlayer.muted = true;
            videoPlayer.play();
            updateStatus('背景播放中', videoStatus);
        } else {
            updateStatus('不支援 HLS', videoStatus, true);
        }
        return;
    }

    hls = new Hls({
        startLevel: 1,  // 從 720p 開始（索引 1）
        maxBufferLength: 10,        // 減少緩衝時間到 10 秒
        maxMaxBufferLength: 20,     // 最大 20 秒
        abrEwmaDefaultEstimate: 5000000,  // 預設帶寬 5 Mbps
        abrBandWidthFactor: 0.8,    // 降低帶寬保守系數（更積極切換）
        abrBandWidthUpFactor: 0.7   // 更容易升級
    });

    videoPlayer.muted = true;
    totalDownloaded = 0;

    hls.loadSource(videoUrl);
    hls.attachMedia(videoPlayer);

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
        console.log('✅ HLS 載入成功');
        console.log(`🎯 ${platform} 版：從 480p 開始，允許自動調整`);

        updateStatus('背景播放中', videoStatus);

        const levels = hls.levels;
        const levelStr = levels.map(l => l.height + 'p').join(', ');
        updateVideoInfo(infoElements, {
            levels: levelStr,
            quality: '自動'
        });

        videoPlayer.play().catch(function () {
            updateStatus('點擊啟動', videoStatus, true);
        });
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
        const level = hls.levels[data.level];
        const resolution = level.width + '×' + level.height;
        const bitrate = (level.bitrate / 1000000).toFixed(2) + ' Mbps';

        updateVideoInfo(infoElements, {
            resolution: resolution,
            quality: level.height + 'p',
            bitrate: bitrate
        });
    });

    hls.on(Hls.Events.FRAG_LOADED, function (event, data) {
        const fragSize = data.frag.stats.total / 1024 / 1024;
        totalDownloaded += fragSize;
        updateVideoInfo(infoElements, {
            downloaded: totalDownloaded.toFixed(2) + ' MB'
        });
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
            }
        }
    });

    videoPlayer.addEventListener('loadedmetadata', function () {
        updateVideoInfo(infoElements, {
            resolution: videoPlayer.videoWidth + '×' + videoPlayer.videoHeight
        });
    });
}

function updateVideoInfo(elements, data) {
    if (data.resolution && elements.resolution) {
        elements.resolution.textContent = data.resolution;
    }
    if (data.quality && elements.quality) {
        elements.quality.textContent = data.quality;
    }
    if (data.bitrate && elements.bitrate) {
        elements.bitrate.textContent = data.bitrate;
    }
    if (data.levels && elements.levels) {
        elements.levels.textContent = data.levels;
    }
    if (data.downloaded && elements.downloaded) {
        elements.downloaded.textContent = data.downloaded;
    }
}

function updateStatus(message, statusElement, isError) {
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = isError ? '#ff4757' : '#00d4ff';
    }
}

// =========================================
// 初始化
// =========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 頁面初始化');
    displayContent();
});

let resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        if (hls) {
            hls.destroy();
            hls = null;
        }
        totalDownloaded = 0;
        displayContent();
    }, 500);
});

window.addEventListener('beforeunload', function () {
    if (hls) {
        hls.destroy();
    }
});
