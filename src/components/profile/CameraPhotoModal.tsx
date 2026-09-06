import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/common/Button";

interface CameraPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => Promise<void> | void;
}

export function CameraPhotoModal({
  isOpen,
  onClose,
  onCapture,
}: CameraPhotoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Stop media tracks cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start WebRTC Camera Stream
  const startCameraStream = async () => {
    stopCameraStream();
    setCameraError(null);
    setIsStartingCamera(true);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Camera access is not supported by your browser or device.",
      );
      setIsStartingCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.warn("Camera stream initiation notice:", err);
      const e = err as { name?: string; message?: string };
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in browser settings to capture your profile photo.",
        );
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setCameraError("No camera device was detected on your device.");
      } else {
        setCameraError(
          e.message || "Failed to start camera feed. Please try again.",
        );
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCameraStream();
    } else if (!isOpen) {
      stopCameraStream();
      setCapturedPhoto(null);
      setCameraError(null);
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, capturedPhoto]);

  if (!isOpen) return null;

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally for natural mirror preview
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCameraStream();
    setCapturedPhoto(dataUrl);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCameraStream();
  };

  const handleConfirmPhoto = async () => {
    if (!capturedPhoto) return;
    setIsUploading(true);
    try {
      await onCapture(capturedPhoto);
      stopCameraStream();
      onClose();
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4 relative overflow-hidden text-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-left">
            <Camera className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                Real-Time Profile Photo
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                Live camera capture for verified profile identity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewport Box */}
        <div className="relative aspect-square w-full max-w-xs mx-auto rounded-2xl bg-black overflow-hidden border-2 border-border grid place-items-center shadow-inner">
          {capturedPhoto ? (
            /* Captured Frame Preview */
            <img
              src={capturedPhoto}
              alt="Profile Photo Preview"
              className="w-full h-full object-cover"
            />
          ) : cameraError ? (
            /* Error State */
            <div className="p-4 text-center space-y-2 text-destructive">
              <AlertCircle className="h-10 w-10 mx-auto opacity-80" />
              <p className="text-xs font-semibold">{cameraError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={startCameraStream}
                className="mt-2 text-xs font-bold"
              >
                Retry Camera Access
              </Button>
            </div>
          ) : (
            /* Live Camera Stream */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          )}

          {/* Target Face Overlay Grid */}
          {!capturedPhoto && !cameraError && (
            <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full pointer-events-none margin-4 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border border-white/20" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2">
          {capturedPhoto ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetakePhoto}
                disabled={isUploading}
                className="font-bold text-xs gap-2 py-3 rounded-xl cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retake</span>
              </Button>

              <Button
                type="button"
                onClick={handleConfirmPhoto}
                loading={isUploading}
                disabled={isUploading}
                className="font-extrabold text-xs gap-2 py-3 rounded-xl bg-primary text-primary-foreground cursor-pointer shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>{isUploading ? "Uploading..." : "Use Photo"}</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleCaptureFrame}
              disabled={isStartingCamera || !!cameraError}
              className="w-full font-extrabold text-xs py-3.5 rounded-xl bg-primary text-primary-foreground cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>Capture Photo</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
