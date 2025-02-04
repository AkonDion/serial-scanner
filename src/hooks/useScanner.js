import { useRef, useCallback, useEffect } from "react";
import { createWorker } from "tesseract.js";

let globalWorker = null;

export const useScanner = ({ onSuccess, onError } = {}) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const processingRef = useRef(false);
    const intervalRef = useRef(null);

    const stopCamera = useCallback(() => {
        console.log('Stopping camera and cleanup...');
        try {
            if (intervalRef.current) {
                console.log('Clearing scan interval');
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (streamRef.current) {
                console.log('Stopping camera stream');
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                console.log('Clearing video source');
                videoRef.current.srcObject = null;
            }
        } catch (err) {
            console.error('Error during cleanup:', err);
        }
    }, []);

    const processFrame = useCallback(async () => {
        if (processingRef.current) {
            console.log('Already processing a frame, skipping...');
            return;
        }
        if (!videoRef.current?.videoWidth) {
            console.log('Video not ready yet');
            return;
        }
        if (!globalWorker) {
            console.log('Tesseract worker not ready');
            return;
        }

        try {
            processingRef.current = true;
            console.log('Processing new frame...');

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Calculate the scanning area in the center
            const scanWidth = 200;
            const scanHeight = 40;
            const sourceX = (video.videoWidth - scanWidth) / 2;
            const sourceY = (video.videoHeight - scanHeight) / 2;

            // Set canvas size to match scanning area
            canvas.width = scanWidth;
            canvas.height = scanHeight;

            // Draw only the scanning area to the canvas
            context.drawImage(
                video,
                sourceX, sourceY, scanWidth, scanHeight,  // Source rectangle
                0, 0, scanWidth, scanHeight               // Destination rectangle
            );

            console.log('Starting OCR on frame...');
            const result = await globalWorker.recognize(canvas);
            const text = result.data.text.trim();
            console.log('OCR result:', text);

            // Check if the text matches a serial number pattern
            const serialPattern = /^[A-Z0-9]{10}$/;
            const cleanText = text.replace(/[^A-Z0-9]/g, '');
            console.log('Cleaned text:', cleanText);

            if (serialPattern.test(cleanText)) {
                console.log('Valid serial number found:', cleanText);
                onSuccess?.(cleanText);
                stopCamera();
            }
        } catch (err) {
            console.error('Error processing frame:', err);
        } finally {
            processingRef.current = false;
        }
    }, [onSuccess, stopCamera]);

    const startCamera = useCallback(async () => {
        console.log('Starting camera initialization...');
        try {
            if (!videoRef.current) {
                console.log('Video element not ready');
                return;
            }

            // Initialize Tesseract if not already initialized
            if (!globalWorker) {
                console.log('Initializing Tesseract worker...');
                globalWorker = await createWorker();
                console.log('Loading Tesseract language data...');
                await globalWorker.loadLanguage('eng');
                console.log('Initializing Tesseract engine...');
                await globalWorker.initialize('eng');
                console.log('Setting Tesseract parameters...');
                await globalWorker.setParameters({
                    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                });
                console.log('Tesseract initialization complete');
            }

            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: 'environment' }
            });

            console.log('Camera access granted, setting up video...');
            videoRef.current.srcObject = stream;
            streamRef.current = stream;

            // Start processing frames once video is playing
            videoRef.current.onloadedmetadata = () => {
                console.log('Video metadata loaded, starting playback...');
                videoRef.current.play();
                console.log('Starting frame processing interval...');
                intervalRef.current = setInterval(processFrame, 500);
            };
        } catch (err) {
            console.error('Camera initialization error:', err);
            onError?.(err);
        }
    }, [onError, processFrame]);

    useEffect(() => {
        console.log('Scanner hook mounted');
        return () => {
            console.log('Scanner hook unmounting, cleaning up...');
            stopCamera();
        };
    }, [stopCamera]);

    return {
        videoRef,
        startCamera,
        stopCamera
    };
};

export default useScanner; 