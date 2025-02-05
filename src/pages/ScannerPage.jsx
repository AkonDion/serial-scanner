import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useScanner from '../hooks/useScanner';

export default function ScannerPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const index = searchParams.get("index");
    const mounted = useRef(false);

    const {
        videoRef,
        canvasRef,
        startCamera,
        stopCamera
    } = useScanner({
        onSuccess: (serial) => {
            console.log('Scanner success:', {
                serial,
                index,
                timestamp: Date.now()
            });

            // Navigate back to deals page with the serial number and index
            navigate(`/deals?serial=${encodeURIComponent(serial)}&index=${encodeURIComponent(index || '')}`, {
                state: {
                    serial,
                    index,
                    timestamp: Date.now(),
                    fromScanner: true
                },
                replace: true
            });
        },
        onError: (error) => {
            console.error('Camera error:', error);
            navigate('/deals', { replace: true });
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
            {/* Video Container */}
            <div style={{
                width: '100%',
                maxWidth: '430px',
                height: '55vh',
                position: 'relative',
                minHeight: 0,
                background: 'var(--surface)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                marginBottom: '16px',
                marginTop: 'max(env(safe-area-inset-top), 16px)'
            }}>
                {/* Camera Feed */}
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />

                {/* Scan Region */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '280px',  // Match SCAN_DIMENSIONS width
                    height: '60px',   // Match SCAN_DIMENSIONS height
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 15px rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden'
                }} />
            </div>

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}