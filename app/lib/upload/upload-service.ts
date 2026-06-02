import { upload } from '@vercel/blob/client';

export interface UploadProvider {
    upload(file: File): Promise<string>;
}

class VercelBlobProvider implements UploadProvider {
    async upload(file: File): Promise<string> {
        const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            contentType: getUploadContentType(file),
        });
        return newBlob.url;
    }
}

function getUploadContentType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'mp3' || extension === 'mpa') return 'audio/mpeg'
    if (extension === 'm4a') return 'audio/mp4'
    if (extension === 'wav') return 'audio/wav'
    if (extension === 'ogg') return 'audio/ogg'
    if (extension === 'webm') return 'audio/webm'

    return file.type || 'application/octet-stream'
}

class MockUploadProvider implements UploadProvider {
    async upload(file: File): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUrl = URL.createObjectURL(file);
                resolve(mockUrl);
            }, 1500);
        });
    }
}

class CloudinaryProvider implements UploadProvider {
    private cloudName: string
    private uploadPreset: string

    constructor(cloudName: string, uploadPreset: string) {
        this.cloudName = cloudName
        this.uploadPreset = uploadPreset
    }

    async upload(file: File): Promise<string> {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', this.uploadPreset)
        const resourceType = file.type.startsWith('audio/') ? 'auto' : 'image'

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
            {
                method: 'POST',
                body: formData,
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Cloudinary upload failed')
        }

        const data = await response.json()
        return data.secure_url
    }
}

// Factory to create the appropriate provider
function createUploadService(): UploadProvider {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_UPLOAD === 'true'

    // 1. Prefer Cloudinary if configured (Direct Client-Side)
    if (cloudName && uploadPreset) {
        console.log('[UploadService] Using Cloudinary Provider')
        return new CloudinaryProvider(cloudName, uploadPreset)
    } else {
        console.log('[UploadService] Cloudinary credentials not found (check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)')
    }

    // 2. Explicit Mock Mode
    if (useMock) {
        console.warn('[UploadService] Using MockUploadProvider (NEXT_PUBLIC_USE_MOCK_UPLOAD=true)')
        return new MockUploadProvider()
    }

    // 3. Default to Vercel Blob (Works in dev if API route is configured, otherwise fails gracefully on upload attempt)
    // We removed the NODE_ENV check to allow testing Vercel Blob in development.
    console.log('[UploadService] Defaulting to VercelBlobProvider')
    return new VercelBlobProvider()
}

class UploadService {
    private provider: UploadProvider;

    constructor() {
        this.provider = createUploadService();
    }

    async uploadFile(file: File): Promise<string> {
        return this.provider.upload(file);
    }
}

export const uploadService = new UploadService();
