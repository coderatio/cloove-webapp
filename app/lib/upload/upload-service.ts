import { upload } from '@vercel/blob/client';

export interface UploadProvider {
    upload(file: File): Promise<string>;
}

class VercelBlobProvider implements UploadProvider {
    async upload(file: File): Promise<string> {
        const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
        });
        return newBlob.url;
    }
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

    async upload(file: File): Promise<string> { // Changed uploadFile to upload to match interface
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', this.uploadPreset)
        // Optional: Add folder or tags here if needed in the future

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
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
