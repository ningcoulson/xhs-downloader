// index.js
const app = getApp()

// IMPORTANT: Replace this with your DEPLOYED Vercel URL
// Public endpoint - accessible from anywhere
const API_BASE = 'http://YOUR_DOMAIN:3000';

Page({
    data: {
        inputUrl: '',
        loading: false,
        data: null,
        error: null
    },

    onInput(e) {
        this.setData({
            inputUrl: e.detail.value
        });
    },

    handleParse() {
        if (!this.data.inputUrl.trim()) return;

        this.setData({ loading: true, error: null, data: null });

        wx.request({
            url: `${API_BASE}/api/parse`,
            data: {
                url: this.data.inputUrl
            },
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    this.setData({ data: res.data.data });
                } else {
                    this.setData({ error: res.data.error || 'Parse failed' });
                }
            },
            fail: (err) => {
                this.setData({ error: 'Network error. Make sure backend is running.' });
            },
            complete: () => {
                this.setData({ loading: false });
            }
        });
    },

    // Save a single image
    handleDownloadImage(e) {
        const url = e.currentTarget.dataset.url;
        this.downloadFile(url, 'image');
    },

    downloadFile(url, type) {
        wx.showLoading({ title: 'Downloading...' });

        // Use the proxy endpoint to bypass XHS anti-hotlink
        const proxyUrl = `${API_BASE}/api/proxy?url=${encodeURIComponent(url)}&filename=download.${type === 'video' ? 'mp4' : 'jpg'}`;

        wx.downloadFile({
            url: proxyUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    if (type === 'video') {
                        this.saveVideo(res.tempFilePath);
                    } else {
                        this.saveImage(res.tempFilePath);
                    }
                } else {
                    wx.showToast({ title: 'Download Failed', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: 'Network Error', icon: 'none' });
            },
            complete: () => {
                wx.hideLoading();
            }
        });
    },

    saveImage(path) {
        wx.saveImageToPhotosAlbum({
            filePath: path,
            success: () => {
                wx.showToast({ title: 'Saved to Album', icon: 'success' });
            },
            fail: (err) => {
                console.error(err);
                this.checkAuth(err, 'scope.writePhotosAlbum');
            }
        });
    },

    saveVideo(path) {
        wx.saveVideoToPhotosAlbum({
            filePath: path,
            success: () => {
                wx.showToast({ title: 'Saved to Album', icon: 'success' });
            },
            fail: (err) => {
                console.error(err);
                this.checkAuth(err, 'scope.writePhotosAlbum');
            }
        });
    },

    // Batch download logic
    async handleDownloadAll() {
        if (!this.data.data || !this.data.data.images) return;

        const images = this.data.data.images;
        wx.showLoading({ title: `0 / ${images.length}`, mask: true });

        let successCount = 0;

        for (let i = 0; i < images.length; i++) {
            try {
                await this.downloadOnePromise(images[i].original);
                successCount++;
                wx.showLoading({ title: `${successCount} / ${images.length}` });
            } catch (e) {
                console.error('Failed to download image', i);
            }
        }

        wx.hideLoading();
        wx.showToast({
            title: `Finished: ${successCount}/${images.length}`,
            icon: 'none'
        });
    },

    // Helper for batch download
    downloadOnePromise(url) {
        return new Promise((resolve, reject) => {
            const proxyUrl = `${API_BASE}/api/proxy?url=${encodeURIComponent(url)}&filename=batch.jpg`;
            wx.downloadFile({
                url: proxyUrl,
                success: (res) => {
                    if (res.statusCode === 200) {
                        wx.saveImageToPhotosAlbum({
                            filePath: res.tempFilePath,
                            success: resolve,
                            fail: reject
                        });
                    } else {
                        reject();
                    }
                },
                fail: reject
            });
        });
    },

    // Handle permission issues
    checkAuth(err, scope) {
        if (err.errMsg.includes('auth deny')) {
            wx.showModal({
                title: 'Authorization Required',
                content: 'We need permission to save photos/videos to your album.',
                success: (res) => {
                    if (res.confirm) wx.openSetting();
                }
            });
        } else {
            wx.showToast({ title: 'Save Failed', icon: 'none' });
        }
    },

    previewImage(e) {
        const current = e.currentTarget.dataset.current;
        const urls = this.data.data.images.map(img => img.original);
        wx.previewImage({
            current,
            urls
        });
    }
})
