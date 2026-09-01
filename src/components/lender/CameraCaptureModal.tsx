import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  X,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/common/Button";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, angleTag?: string) => void;
  onFallbackUpload: () => void;
  angleTag?: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackUpload,
  angleTag = "Front View",
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isShuttering, setIsShuttering] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Play shutter sound via Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio fallback silent ignore
    }
  }, []);

  // Check available cameras
  useEffect(() => {
    if (!isOpen) return;
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {});
  }, [isOpen]);

  // Stop camera stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setHasPermission(null);
    setErrorMsg(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      setErrorMsg("Camera access is not supported by your browser or environment.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err: unknown) {
      console.warn("[CameraCaptureModal] Camera permission error:", err);
      setHasPermission(false);
      const message =
        err instanceof Error
          ? err.message
          : "Unable to access camera. Please check permissions.";
      setErrorMsg(message);
    }
  }, [facingMode, stopStream]);

  // Manage camera open state
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, capturedImage, startCamera, stopStream]);

  // Toggle camera direction
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture photo snapshot onto canvas
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    setIsShuttering(true);
    playShutterSound();

    setTimeout(() => {
      setIsShuttering(false);

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // If front camera, mirror horizontally for natural preview
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(dataUrl);
        stopStream();
      }
    }, 150);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, angleTag);
      setCapturedImage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 grid place-items-center text-primary">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Snap Gear Photo
              </h3>
              <p className="text-xs text-zinc-400">
                Angle: <span className="text-primary font-medium">{angleTag}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopStream();
              setCapturedImage(null);
              onClose();
            }}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Visual Camera Shutter Flash */}
          {isShuttering && (
            <div className="absolute inset-0 z-40 bg-white animate-in fade-in fade-out duration-150" />
          )}

          {capturedImage ? (
            /* Review Captured Photo */
            <div className="relative h-full w-full">
              <img
                src={capturedImage}
                alt="Captured product snapshot"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Snapshot ready
              </div>
            </div>
          ) : hasPermission === false ? (
            /* Permission / Error State */
            <div className="p-8 text-center max-w-md mx-auto space-y-4">
              <div className="h-14 w-14 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto border border-red-500/20">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">
                  Camera Unavailable
                </h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  {errorMsg ||
                    "Please grant camera access in your browser settings or select an image file directly from your device."}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Camera
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    onFallbackUpload();
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image File
                </Button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative h-full w-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Viewfinder Target Framing Guidelines */}
              <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-dashed border-white/40 rounded-2xl flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-primary" />
                </div>
                <div className="text-center bg-black/50 backdrop-blur-md self-center px-3 py-1 rounded-full text-xs text-white/90 border border-white/10">
                  Center your item clearly in the frame
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-primary" />
                </div>
              </div>

              {/* Camera Switch Pill if multiple cameras */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/20 hover:bg-black/80 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  Flip Camera
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/90 flex items-center justify-between">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Photo
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 font-medium"
              >
                <Check className="h-4 w-4 mr-2" />
                Use This Photo
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackUpload();
                }}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-2 py-1"
              >
                <Upload className="h-3.5 w-3.5" />
                Or pick from gallery
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!hasPermission}
                  onClick={handleTakeSnapshot}
                  className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="h-14 w-14 rounded-full border-4 border-white bg-transparent p-1 transition-transform group-active:scale-95">
                    <div className="h-full w-full rounded-full bg-white group-hover:bg-primary transition-colors grid place-items-center">
                      <Camera className="h-5 w-5 text-black group-hover:text-white" />
                    </div>
                  </div>
                </button>
              </div>

              <div className="w-24 text-right">
                <span className="text-[11px] text-zinc-500 flex items-center justify-end gap-1">
                  <Layers className="h-3 w-3" /> HQ Photo
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
