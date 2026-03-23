import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCcw } from 'lucide-react';
import Quagga from '@ericblade/quagga2'; // assuming we will use the npm package or load it from CDN

const ScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Votre navigateur ne supporte pas l'accès à la caméra.");
      return;
    }

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment', // Use rear camera on mobile
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
          ],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error(err);
          setError("Impossible de démarrer la caméra.");
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((result) => {
      if (result && result.codeResult && result.codeResult.code) {
        // Play beep sound
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.type = 'sine';
          oscillator.frequency.value = 880;
          gain.gain.setValueAtTime(0.1, context.currentTime);
          oscillator.start();
          setTimeout(() => oscillator.stop(), 100);
        } catch (e) {
          // Ignore audio errors
        }

        onScan(result.codeResult.code);
        stopScanner();
        onClose();
      }
    });
  };

  const stopScanner = () => {
    try {
      Quagga.stop();
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-jakarta font-bold text-lg text-royal-dark flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scanner un Code-barres
          </h3>
          <button 
            onClick={() => { stopScanner(); onClose(); }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative p-6 bg-slate-900 flex justify-center items-center min-h-[300px]">
          {error ? (
            <div className="text-center text-red-400 p-4">
              <p>{error}</p>
              <button onClick={startScanner} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                <RefreshCcw className="w-4 h-4" /> Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* Scanner Video Container */}
              <div 
                ref={scannerRef} 
                className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-royal/50 shadow-[0_0_20px_rgba(30,58,138,0.3)] relative [&>video]:w-full [&>canvas.drawingBuffer]:hidden"
              />
              
              {/* Scan Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-green-500 rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-500"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-500"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-500"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-500"></div>
                  <div className="w-full h-px bg-red-500/50 absolute top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 text-center text-sm text-slate-500">
          Placez le code-barres au centre du cadre pour le scanner automatiquement.
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
