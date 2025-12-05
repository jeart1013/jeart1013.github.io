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

    // 根據平台設定不同的起始畫質
    // HLS.js 會將畫質從低到高排序: [0]=480p, [1]=720p, [2]=1080p, [3]=1440p, [4]=2160p
    const targetStartLevel = platform === 'mobile' ? 0 : 1;  // 手機:480p, PC:720p

    hls = new Hls({
        startLevel: targetStartLevel,   // 設定起始畫質，之後會自動調整
        maxBufferLength: 3,             // 減少緩衝時間到 4 秒（快速切換）
        maxMaxBufferLength: 6,          // 最大 8 秒
        abrEwmaDefaultEstimate: platform === 'mobile' ? 1500000 : 3000000,  // 手機1.5Mbps, PC 3Mbps
        abrBandWidthFactor: 0.8,        // 降低帶寬保守系數（更積極切換）
        abrBandWidthUpFactor: 0.7       // 更容易升級
    });

    console.log(`🎬 ${platform} 版起始畫質: ${platform === 'mobile' ? '480p (Level 0)' : '720p (Level 1)'} (自動調整已啟用)`);

    videoPlayer.muted = true;
    totalDownloaded = 0;

    hls.loadSource(videoUrl);
    hls.attachMedia(videoPlayer);

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
        console.log('✅ HLS 載入成功');

        const levels = hls.levels;
        console.log('📊 可用畫質層級:');
        levels.forEach((level, index) => {
            console.log(`  [${index}] ${level.width}×${level.height} (${level.height}p) - ${(level.bitrate / 1000000).toFixed(2)} Mbps`);
        });

        console.log(`🎯 ${platform} 版：從 ${levels[targetStartLevel].height}p 開始，將根據網路速度自動調整`);

        updateStatus('背景播放中', videoStatus);

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

        console.log(`📊 畫質切換到: ${level.height}p (Level ${data.level})`);
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

    // 強制保持畫質的手動循環
    let savedQualityLevel = targetStartLevel;  // 保存循環前的畫質
    let isLooping = false;  // 是否正在循環

    // 記錄當前畫質
    hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
        if (!isLooping) {
            savedQualityLevel = data.level;
        }
    });

    videoPlayer.addEventListener('ended', function () {
        const currentLevel = hls.currentLevel >= 0 ? hls.currentLevel : savedQualityLevel;
        console.log(`🔄 影片結束，保持畫質: ${hls.levels[currentLevel]?.height}p (Level ${currentLevel})`);

        isLooping = true;

        // 暫時禁用自動畫質切換
        hls.autoLevelEnabled = false;
        hls.currentLevel = currentLevel;

        // 回到開頭並播放
        videoPlayer.currentTime = 0;
        videoPlayer.play().catch(function (error) {
            console.error('播放失敗:', error);
        });

        // 1 秒後重新啟用自動畫質，但保持當前等級
        setTimeout(() => {
            hls.autoLevelEnabled = true;
            isLooping = false;
            console.log(`✅ 循環完成，當前維持在 ${hls.levels[currentLevel]?.height}p，ABR 已重新啟用`);
        }, 1000);
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
let lastDeviceType = isMobileDevice() ? 'mobile' : 'pc';

window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        const currentDeviceType = isMobileDevice() ? 'mobile' : 'pc';

        // 只有在裝置類型真的改變時才重新載入（例如從 PC 切換到手機）
        if (currentDeviceType !== lastDeviceType) {
            console.log(`🔄 裝置類型改變: ${lastDeviceType} → ${currentDeviceType}`);

            if (hls) {
                hls.destroy();
                hls = null;
            }
            totalDownloaded = 0;
            lastDeviceType = currentDeviceType;
            displayContent();
        } else {
            console.log('📊 視窗大小改變，但裝置類型未變，不重新載入影片');
        }
    }, 500);
});

window.addEventListener('beforeunload', function () {
    if (hls) {
        hls.destroy();
    }
});
