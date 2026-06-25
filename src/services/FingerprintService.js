import FingerprintJS from '@fingerprintjs/fingerprintjs';

class FingerprintService {
    static async getDeviceId() {
        let deviceId = localStorage.getItem('device_id');

        if (!deviceId) {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            deviceId = result.visitorId;
            localStorage.setItem('device_id', deviceId);
        }

        return deviceId;
    }
}

export default FingerprintService;
