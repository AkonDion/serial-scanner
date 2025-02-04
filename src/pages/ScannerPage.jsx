import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useScanner from '../hooks/useScanner';

// Add keyframes style to head
const style = document.createElement('style');
style.textContent = `
@keyframes scanLight {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}`;
document.head.appendChild(style);

export default function ScannerPage() {
    const navigate = useNavigate();
    const mounted = useRef(false);

    const {
        videoRef,
        startCamera,
        stopCamera
    } = useScanner({
        onError: (error) => {
            console.error('Camera error:', error);
            navigate('/deals');
        }
    });

    useEffect(() => {
        mounted.current = true;
        if (mounted.current) {
            startCamera();
        }
        return () => {
            mounted.current = false;
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className="fixed inset-0">
            {/* Camera Feed */}
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
            />

            {/* Dark Overlay with Cutout */}
            <div className="fixed inset-0 bg-black/70">
                {/* Pill-shaped Cutout */}
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: '200px',
                        height: '40px',
                        maxWidth: '60vw'
                    }}
                >
                    <div
                        className="w-full h-full rounded-full"
                        style={{
                            background: 'transparent',
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.7)'
                        }}
                    />
                    {/* Scanning guide lines */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                        <div className="w-4 h-[1px] bg-white/50" />
                        <div className="w-4 h-[1px] bg-white/50" />
                    </div>
                </div>
            </div>
        </div>
    );
} 