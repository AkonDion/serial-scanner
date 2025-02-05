import React, { useRef, useCallback, useEffect } from "react";
// Remove tesseract.js import since we're using the CDN version

const SCAN_INTERVAL = 150; // Slightly faster scanning
const SCAN_DIMENSIONS = {
    width: 220,    // Smaller width for more precise targeting
    height: 45     // Smaller height for more precise targeting
};

// Mobile-optimized video dimensions
const VIDEO_DIMENSIONS = {
    width: { min: 480, ideal: 720, max: 1080 },    // Standard mobile camera resolutions
    height: { min: 640, ideal: 1280, max: 1920 }   // Standard mobile camera resolutions
};

const CONFIDENCE_THRESHOLD = 90; // Minimum confidence level required
const MIN_SUCCESSFUL_READS = 3; // Number of consecutive successful reads required
const READ_TIMEOUT = 1000; // Time window for consecutive reads in ms

// Track consecutive successful reads
const SerialNumberTracker = {
    readings: new Map(), // Store readings and their timestamps
    lastCleanup: Date.now(),

    addReading(serialNumber) {
        const now = Date.now();

        // Cleanup old readings
        if (now - this.lastCleanup > READ_TIMEOUT) {
            for (const [number, data] of this.readings.entries()) {
                if (now - data.lastSeen > READ_TIMEOUT) {
                    this.readings.delete(number);
                }
            }
            this.lastCleanup = now;
        }

        // Update or add new reading
        if (!this.readings.has(serialNumber)) {
            this.readings.set(serialNumber, {
                count: 1,
                lastSeen: now,
                firstSeen: now
            });
        } else {
            const data = this.readings.get(serialNumber);
            // Only count if within timeout window
            if (now - data.lastSeen < READ_TIMEOUT) {
                data.count++;
            } else {
                data.count = 1;
            }
            data.lastSeen = now;
        }

        const reading = this.readings.get(serialNumber);
        return reading.count >= MIN_SUCCESSFUL_READS;
    },

    reset() {
        this.readings.clear();
    }
};

const isValidSerialNumber = (text, confidence) => {
    // Must be exactly 10 digits with no other characters
    if (!/^\d{10}$/.test(text)) return false;

    // Confidence must be above threshold
    if (confidence < CONFIDENCE_THRESHOLD) return false;

    return true;
};

const logScanResult = (result, serialNumber, metadata = {}) => {
    console.log('OCR Scan Result:', {
        text: result.data.text,
        serialNumber,
        isValid: isValidSerialNumber(serialNumber, result.data.confidence),
        confidence: result.data.confidence,
        consecutiveReads: SerialNumberTracker.readings.get(serialNumber)?.count || 0,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};

export const useScanner = ({ onSuccess, onError } = {}) => {
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
            SerialNumberTracker.reset();
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

            // Properly terminate Tesseract worker
            if (workerRef.current) {
                const worker = workerRef.current;
                workerRef.current = null; // Clear reference first
                worker.terminate().catch(console.warn); // Handle termination error gracefully
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
        const threshold = avgBrightness * 0.9; // Slightly more aggressive threshold
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Use weighted RGB conversion for better contrast
            const gray = (r * 0.299 + g * 0.587 + b * 0.114);

            // Sharper black and white conversion
            const value = gray < threshold ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = value;
            data[i + 3] = 255; // Full opacity
        }

        tempContext.putImageData(imageData, 0, 0);

        // Scale up for better OCR while maintaining aspect ratio
        const scale = 3; // Increase scale for better detail
        context.canvas.width = width * scale;
        context.canvas.height = height * scale;

        // Use better scaling quality
        context.imageSmoothingEnabled = false;

        // Scale up the processed image
        context.drawImage(tempCanvas, 0, 0, width * scale, height * scale);

        // Log the preprocessed image for debugging
        console.log('Preprocessed frame:', {
            originalWidth: width,
            originalHeight: height,
            scaledWidth: width * scale,
            scaledHeight: height * scale,
            threshold,
            avgBrightness,
            imageUrl: context.canvas.toDataURL()
        });
    };

    const initTesseract = useCallback(async () => {
        if (workerRef.current) {
            try {
                await workerRef.current.terminate();
            } catch (err) {
                console.warn('Error terminating existing worker:', err);
            }
            workerRef.current = null;
        }

        try {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => console.log('Tesseract:', m)
            });

            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            // Optimized Tesseract configuration for 10-digit numbers
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
                tessedit_pageseg_mode: '7', // Treat the image as a single text line
                tessedit_ocr_engine_mode: '2', // Use LSTM neural net mode
                preserve_interword_spaces: '0',
                tessedit_min_word_length: '10', // We're looking for 10-digit numbers
                tessedit_max_word_length: '10',
                textord_min_linesize: '1.5' // Help with small text
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

            // Calculate center position for scanning
            const videoAspectRatio = video.videoWidth / video.videoHeight;
            const targetWidth = video.videoHeight * videoAspectRatio;

            // Adjust centerX based on the actual video display width
            const centerX = (targetWidth - SCAN_DIMENSIONS.width) / 2;
            const centerY = (video.videoHeight - SCAN_DIMENSIONS.height) / 2;

            // Clear canvas first
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Draw video frame - ensure we're capturing exactly what's in the UI rectangle
            context.drawImage(
                video,
                Math.max(0, centerX),
                Math.max(0, centerY),
                SCAN_DIMENSIONS.width,
                SCAN_DIMENSIONS.height,
                0,
                0,
                SCAN_DIMENSIONS.width,
                SCAN_DIMENSIONS.height
            );

            // Log the scan area for debugging
            console.log('Scanning area:', {
                centerX: Math.max(0, centerX),
                centerY: Math.max(0, centerY),
                width: SCAN_DIMENSIONS.width,
                height: SCAN_DIMENSIONS.height,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                targetWidth,
                videoAspectRatio
            });

            // Preprocess the frame
            preprocessFrame(context, SCAN_DIMENSIONS.width, SCAN_DIMENSIONS.height);

            // Perform OCR
            const result = await workerRef.current.recognize(canvas);

            // Log raw OCR result for debugging
            console.log('Raw OCR result:', {
                text: result.data.text,
                confidence: result.data.confidence,
                words: result.data.words,
                lines: result.data.lines
            });

            const text = result.data.text.trim();
            const confidence = result.data.confidence;

            // Extract all potential 10-digit numbers from the text
            const matches = text.match(/\d{10}/g) || [];

            // Log matches for debugging
            console.log('Number matches found:', {
                matches,
                rawText: text,
                confidence
            });

            // Process each match
            for (const serialNumber of matches) {
                // Check if this is a valid serial number with high confidence
                if (isValidSerialNumber(serialNumber, confidence)) {
                    logScanResult(result, serialNumber, {
                        allMatches: matches,
                        matchCount: matches.length,
                        confidence
                    });

                    // Track consecutive successful reads
                    if (SerialNumberTracker.addReading(serialNumber)) {
                        console.log('Confirmed valid serial number:', serialNumber, {
                            confidence,
                            consecutiveReads: SerialNumberTracker.readings.get(serialNumber).count
                        });
                        onSuccess?.(serialNumber);
                        stopCamera();
                        return;
                    }
                } else {
                    console.log('Invalid serial number or low confidence:', {
                        serialNumber,
                        confidence,
                        validFormat: /^\d{10}$/.test(serialNumber),
                        meetsConfidence: confidence >= CONFIDENCE_THRESHOLD
                    });
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

            // Mobile-optimized video constraints with zoom
            const constraints = {
                audio: false,
                video: {
                    facingMode: { exact: 'environment' },
                    width: VIDEO_DIMENSIONS.width,
                    height: VIDEO_DIMENSIONS.height,
                    frameRate: { ideal: 30 },
                    // Add zoom and focus settings
                    advanced: [{
                        zoom: 0.25, // Much more zoomed out to allow close scanning (5-6 inches)
                        focusMode: ['continuous', 'macro'],
                        focusDistance: 0.12 // Optimize for closer distance
                    }]
                }
            };

            console.log('Starting camera with constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Try to get the video track and set zoom
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const capabilities = videoTrack.getCapabilities();
                const settings = videoTrack.getSettings();

                // Log camera capabilities for debugging
                console.log('Camera capabilities:', capabilities);
                console.log('Current settings:', settings);

                // Check if zoom is supported and set it
                if (capabilities.zoom) {
                    try {
                        // Set zoom to 0.25x or min available zoom if higher
                        const targetZoom = Math.max(0.25, capabilities.zoom.min);
                        await videoTrack.applyConstraints({
                            advanced: [{
                                zoom: targetZoom,
                                focusMode: ['continuous', 'macro'],
                                focusDistance: 0.12
                            }]
                        });
                        console.log('Set camera zoom to:', targetZoom);
                    } catch (err) {
                        console.warn('Failed to set zoom:', err);
                    }
                }

                // Try to set focus mode and distance if supported
                if (capabilities.focusMode) {
                    try {
                        const focusModes = ['macro', 'continuous'].filter(mode =>
                            capabilities.focusMode.includes(mode)
                        );
                        if (focusModes.length > 0) {
                            await videoTrack.applyConstraints({
                                advanced: [{
                                    focusMode: focusModes[0], // Use first supported mode
                                    focusDistance: capabilities.focusDistance ? 0.15 : undefined
                                }]
                            });
                            console.log('Set focus settings to:', focusModes[0]);
                        }
                    } catch (err) {
                        console.warn('Failed to set focus:', err);
                    }
                }
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