import { useRef, useCallback, useEffect } from "react";
// Remove tesseract.js import since we're using the CDN version

const TARGET_SERIAL = "2310211025";
const SCAN_INTERVAL = 150; // Slightly faster scanning
const SCAN_DIMENSIONS = {
    width: 280,    // Good balance for serial number size
    height: 60     // Good balance for serial number size
};

// Mobile-optimized video dimensions
const VIDEO_DIMENSIONS = {
    width: { min: 480, ideal: 720, max: 1080 },    // Smaller width for portrait
    height: { min: 640, ideal: 1280, max: 1920 }   // Taller height for portrait
};

const logScanResult = (result, cleanText, metadata = {}) => {
    console.log('OCR Scan Result:', {
        originalText: result.data.text,
        cleanText: cleanText,
        confidence: result.data.confidence,
        matches: {
            exact: cleanText === TARGET_SERIAL,
            containsTarget: cleanText.includes(TARGET_SERIAL),
            partialMatches: findPartialMatches(cleanText),
        },
        scanArea: metadata.scanArea,
        brightness: metadata.brightness,
        threshold: metadata.threshold,
        timestamp: new Date().toISOString()
    });
};

const findPartialMatches = (text) => {
    const matches = [];
    for (let i = 0; i < TARGET_SERIAL.length; i++) {
        for (let j = i + 4; j <= TARGET_SERIAL.length; j++) {
            const substring = TARGET_SERIAL.substring(i, j);
            if (text.includes(substring)) {
                matches.push({
                    substring,
                    position: text.indexOf(substring),
                    length: substring.length
                });
            }
        }
    }
    return matches;
};

const useScanner = ({ onSuccess, onError } = {}) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const workerRef = useRef(null);
    const isProcessingRef = useRef(false);
    const isScanningRef = useRef(false);
    const frameRequestRef = useRef(null);
    const lastProcessTimeRef = useRef(0);

    const stopCamera = useCallback(() => {
        console.log('Stopping camera and cleanup...');
        try {
            isScanningRef.current = false;
            if (frameRequestRef.current) {
                cancelAnimationFrame(frameRequestRef.current);
                frameRequestRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        } catch (err) {
            console.error('Error during cleanup:', err);
        }
    }, []);

    const preprocessFrame = (context, width, height) => {
        // Create a temporary canvas at original size first
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempContext = tempCanvas.getContext('2d', { willReadFrequently: true });

        // Draw the original frame
        tempContext.drawImage(context.canvas, 0, 0);

        // Get the image data
        const imageData = tempContext.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Calculate average brightness to determine if we need to invert
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
            totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (data.length / 4);

        // Convert to black and white with dynamic threshold
        const threshold = avgBrightness * 0.8; // Slightly darker than average
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = (r + g + b) / 3;

            // Black text on white background
            const value = gray < threshold ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = value;
            data[i + 3] = 255; // Full opacity
        }

        tempContext.putImageData(imageData, 0, 0);

        // Now scale up for better OCR
        const finalCanvas = document.createElement('canvas');
        const scale = 2;
        finalCanvas.width = width * scale;
        finalCanvas.height = height * scale;
        const finalContext = finalCanvas.getContext('2d', { willReadFrequently: true });

        // Use better scaling quality
        finalContext.imageSmoothingEnabled = false;

        // Scale up the processed image
        finalContext.drawImage(tempCanvas, 0, 0, finalCanvas.width, finalCanvas.height);

        // Update the original canvas
        context.canvas.width = finalCanvas.width;
        context.canvas.height = finalCanvas.height;
        context.drawImage(finalCanvas, 0, 0);

        // Log the processed image for debugging
        console.log('Processed frame:', {
            originalDimensions: { width, height },
            finalDimensions: { width: finalCanvas.width, height: finalCanvas.height },
            averageBrightness: avgBrightness,
            threshold: threshold,
            imageData: finalCanvas.toDataURL()
        });
    };

    const initTesseract = useCallback(async () => {
        if (workerRef.current) return workerRef.current;

        try {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => console.log('Tesseract:', m)
            });

            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            // Basic Tesseract configuration
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
                tessedit_pageseg_mode: '7',
                tessedit_ocr_engine_mode: '2',
                preserve_interword_spaces: '0'
            });

            workerRef.current = worker;
            return worker;
        } catch (error) {
            console.error('Tesseract initialization failed:', error);
            throw error;
        }
    }, []);

    const processFrame = useCallback(async (timestamp) => {
        if (!isScanningRef.current) return;

        const timeSinceLastProcess = timestamp - lastProcessTimeRef.current;
        if (timeSinceLastProcess < SCAN_INTERVAL) {
            frameRequestRef.current = requestAnimationFrame(processFrame);
            return;
        }

        if (isProcessingRef.current || !videoRef.current?.videoWidth || !workerRef.current) {
            frameRequestRef.current = requestAnimationFrame(processFrame);
            return;
        }

        try {
            isProcessingRef.current = true;
            lastProcessTimeRef.current = timestamp;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });

            // Set initial canvas size to match scan dimensions
            canvas.width = SCAN_DIMENSIONS.width;
            canvas.height = SCAN_DIMENSIONS.height;

            // Calculate center position
            const centerX = Math.max(0, (video.videoWidth - SCAN_DIMENSIONS.width) / 2);
            const centerY = Math.max(0, (video.videoHeight - SCAN_DIMENSIONS.height) / 2);

            // Clear canvas first
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Draw video frame
            context.drawImage(
                video,
                centerX, centerY,
                SCAN_DIMENSIONS.width, SCAN_DIMENSIONS.height,
                0, 0,
                SCAN_DIMENSIONS.width, SCAN_DIMENSIONS.height
            );

            // Log the raw frame for debugging
            console.log('Raw frame:', {
                videoDimensions: { width: video.videoWidth, height: video.videoHeight },
                canvasDimensions: { width: canvas.width, height: canvas.height },
                centerPoint: { x: centerX, y: centerY },
                rawImageData: canvas.toDataURL()
            });

            // Preprocess the frame
            preprocessFrame(context, SCAN_DIMENSIONS.width, SCAN_DIMENSIONS.height);

            // Perform OCR
            const result = await workerRef.current.recognize(canvas);
            const text = result.data.text.trim();
            const cleanText = text.replace(/[^0-9]/g, '');

            console.log('OCR Result:', {
                original: text,
                cleaned: cleanText,
                confidence: result.data.confidence,
                words: result.data.words,
                timestamp: new Date().toISOString()
            });

            if (cleanText.includes(TARGET_SERIAL)) {
                console.log('Found target serial!', TARGET_SERIAL);
                onSuccess?.(TARGET_SERIAL);
                stopCamera();
                return;
            }

            // Log partial matches
            if (cleanText.length >= 4) {
                for (let i = 0; i < TARGET_SERIAL.length - 3; i++) {
                    const part = TARGET_SERIAL.substring(i, i + 4);
                    if (cleanText.includes(part)) {
                        console.log('Partial match found:', {
                            part,
                            position: i,
                            fullText: cleanText
                        });
                    }
                }
            }

        } catch (err) {
            console.error('Frame processing error:', err);
        } finally {
            isProcessingRef.current = false;
            if (isScanningRef.current) {
                frameRequestRef.current = requestAnimationFrame(processFrame);
            }
        }
    }, [onSuccess, stopCamera]);

    const startCamera = useCallback(async () => {
        try {
            if (!videoRef.current) {
                console.warn('Video element not ready');
                return;
            }

            if (!workerRef.current) {
                await initTesseract();
            }

            // Mobile-optimized video constraints
            const constraints = {
                audio: false,
                video: {
                    facingMode: { exact: 'environment' },
                    width: VIDEO_DIMENSIONS.width,
                    height: VIDEO_DIMENSIONS.height,
                    frameRate: { ideal: 30 },
                    // Add mobile-specific focus and exposure
                    focusMode: 'continuous',
                    exposureMode: 'continuous',
                    whiteBalanceMode: 'continuous'
                }
            };

            console.log('Starting camera with constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Try to get the actual track settings
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const settings = videoTrack.getSettings();
                console.log('Actual video track settings:', settings);
            }

            videoRef.current.srcObject = stream;
            streamRef.current = stream;

            // Mobile video setup
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');

            videoRef.current.onloadedmetadata = () => {
                console.log('Video dimensions:', {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight
                });
                videoRef.current.play().catch(console.error);
                isScanningRef.current = true;
                frameRequestRef.current = requestAnimationFrame(processFrame);
            };
        } catch (err) {
            console.error('Camera initialization failed:', err);
            onError?.(err);
        }
    }, [onError, processFrame, initTesseract]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return {
        videoRef,
        canvasRef,
        startCamera,
        stopCamera
    };
};

export default useScanner; 