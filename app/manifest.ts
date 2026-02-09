import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Cloove AI',
        short_name: 'Cloove',
        description: 'Your calm, intelligent business partner',
        start_url: '/',
        display: 'standalone',
        background_color: '#fdfcf8',
        theme_color: '#062c21',
        icons: [
            {
                src: '/favicon.png',
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        categories: ['business', 'productivity', 'finance'],
        orientation: 'portrait',
        scope: '/',
    }
}
