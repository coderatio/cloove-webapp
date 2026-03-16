"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, RefreshCw, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/app/components/ui/base-dialog"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

interface CameraDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCapture: (file: File) => void
}

export function CameraDialog({ open, onOpenChange, onCapture }: CameraDialogProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
    const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0)
    const [isStarting, setIsStarting] = useState(false)
    const [active, setActive] = useState(false) // Internal state to track if we should be streaming

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop()
                track.enabled = false
            })
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }, [])

    const startStream = useCallback(async (index: number) => {
        if (!open) return
        
        setIsStarting(true)
        stopStream()

        try {
            const availableDevices = await navigator.mediaDevices.enumerateDevices()
            const videoDevices = availableDevices.filter(d => d.kind === "videoinput")
            setDevices(videoDevices)

            if (videoDevices.length === 0) {
                toast.error("No camera found on this device.")
                onOpenChange(false)
                return
            }

            const deviceId = videoDevices[index % videoDevices.length].deviceId
            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            }

            const newStream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = newStream
            
            if (videoRef.current) {
                videoRef.current.srcObject = newStream
                void videoRef.current.play().catch(e => console.error("Video play error:", e))
            }
        } catch (error) {
            console.error("Camera access error:", error)
            toast.error("Could not access camera. Please check permissions.")
            onOpenChange(false)
        } finally {
            setIsStarting(false)
        }
    }, [open, onOpenChange, stopStream])

    useEffect(() => {
        if (open) {
            setActive(true)
            void startStream(currentDeviceIndex)
        } else {
            setActive(false)
            stopStream()
        }
        
        return () => {
            stopStream()
        }
    }, [open, currentDeviceIndex, startStream, stopStream])

    function switchCamera() {
        if (devices.length <= 1) return
        setCurrentDeviceIndex(prev => (prev + 1) % devices.length)
    }

    function capturePhoto() {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (!context) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" })
                onCapture(file)
                onOpenChange(false)
            }
        }, "image/jpeg", 0.85)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose className="sm:max-w-2xl p-0 overflow-hidden bg-black border-none rounded-[28px]">
                <DialogHeader className="absolute top-0 left-0 right-0 z-50 p-6 bg-linear-to-b from-black/60 to-transparent pointer-events-none">
                    <DialogTitle className="text-white font-medium flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Capture Image
                    </DialogTitle>
                </DialogHeader>

                <div className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn(
                            "w-full h-full object-cover transition-opacity duration-300",
                            isStarting ? "opacity-0" : "opacity-100"
                        )}
                    />
                    
                    {isStarting && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                        </div>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="p-8 bg-zinc-900 border-t border-white/5 flex items-center justify-between">
                    <DialogClose
                        render={(closeProps) => (
                            <Button
                                {...closeProps}
                                type="button"
                                variant="ghost"
                                className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        )}
                    />

                    <Button
                        variant="ghost"
                        onClick={capturePhoto}
                        disabled={isStarting || !streamRef.current}
                        className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center p-1 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 hover:bg-transparent"
                    >
                        <div className="h-full w-full rounded-full bg-white transition-transform active:scale-90" />
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={switchCamera}
                        disabled={devices.length <= 1 || isStarting}
                        className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 p-0 transition-transform active:rotate-180 duration-500"
                    >
                        <RefreshCw className="h-6 w-6" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
