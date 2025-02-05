import React from 'react';
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScanner } from '../hooks/useScanner';

const ScannerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { modelIndex, dealId } = location.state || {};
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
                modelIndex,
                dealId,
                timestamp: Date.now()
            });

            // Navigate back to deals page with the serial number and model index
            navigate('/deals', {
                state: {
                    serial,
                    modelIndex,
                    dealId,
                    fromScanner: true
                }
            });
        },
        onError: (error) => {
            console.error('Camera error:', error);
            navigate('/deals');
        }
    });

    useEffect(() => {
        if (!modelIndex || !dealId) {
            console.error('Missing required state:', { modelIndex, dealId });
            navigate('/deals');
            return;
        }

        mounted.current = true;
        if (mounted.current) {
            startCamera();
        }
        return () => {
            mounted.current = false;
            stopCamera();
        };
    }, [startCamera, stopCamera, modelIndex, dealId, navigate]);

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
                {/* Camera Feed - Scaled up visually */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    transform: 'scale(1.5)',
                    transformOrigin: 'center center',
                }}>
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
                        width: '160px',  // Even smaller visual width (OCR still uses 220px)
                        height: '34px',   // Even smaller visual height (OCR still uses 45px)
                        border: '1.5px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px', // Slightly smaller radius to match new visual size
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 15px rgba(255, 255, 255, 0.05)',
                        overflow: 'hidden'
                    }} />
                </div>
            </div>

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default ScannerPage;