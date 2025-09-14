import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Detection {
  id: string;
  type: 'tent' | 'blanket' | 'cardboard';
  context: 'street' | 'park' | 'subway' | 'bus' | 'train' | 'unknown';
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lat?: number;
  lon?: number;
  timestamp?: string;
}

interface CameraFeedProps {
  onDetection?: (detection: Detection & { lat: number; lon: number; timestamp: string }) => void;
  isActive: boolean;
  onToggle: () => void;
}

const CameraFeed = ({ onDetection, isActive, onToggle }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
      getCurrentLocation();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use a default location (NYC) if geolocation fails
          setUserLocation({ lat: 40.7128, lon: -74.0060 });
        }
      );
    } else {
      setUserLocation({ lat: 40.7128, lon: -74.0060 });
    }
  };

  const saveDetectionToDatabase = async (detection: Detection) => {
    if (!userLocation) return;

    const detectionData = {
      lat: userLocation.lat,
      lon: userLocation.lon,
      object_type: detection.type,
      context: detection.context,
      confidence: detection.confidence,
      timestamp: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('detections')
        .insert(detectionData);

      if (error) {
        console.error('Error saving detection:', error);
      } else {
        console.info('New detection:', {
          ...detectionData,
          id: detection.id,
          bbox: detection.bbox
        });
        
        // Call the parent callback with full detection data
        onDetection?.({
          ...detection,
          lat: userLocation.lat,
          lon: userLocation.lon,
          timestamp: detectionData.timestamp
        });
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  // Mock detection simulation (this explains why it's inaccurate!)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate random detection - THIS IS NOT REAL AI DETECTION!
      if (Math.random() > 0.7) {
        const types: Detection['type'][] = ['tent', 'blanket', 'cardboard'];
        const contexts: Detection['context'][] = ['street', 'park', 'subway', 'bus', 'train'];
        
        const newDetection: Detection = {
          id: Date.now().toString(),
          type: types[Math.floor(Math.random() * types.length)],
          context: contexts[Math.floor(Math.random() * contexts.length)],
          confidence: 0.75 + Math.random() * 0.2,
          bbox: {
            x: Math.random() * 200 + 50,
            y: Math.random() * 150 + 50,
            width: Math.random() * 100 + 50,
            height: Math.random() * 80 + 40,
          }
        };

        setDetections(prev => [...prev.slice(-4), newDetection]);
        
        // Save to database
        saveDetectionToDatabase(newDetection);

        // Remove detection overlay after 3 seconds
        setTimeout(() => {
          setDetections(prev => prev.filter(d => d.id !== newDetection.id));
        }, 3000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, userLocation]);

  const getDetectionColor = (type: Detection['type']) => {
    switch (type) {
      case 'tent': return 'border-detection-tent bg-detection-tent/20';
      case 'blanket': return 'border-detection-blanket bg-detection-blanket/20';
      case 'cardboard': return 'border-detection-cardboard bg-detection-cardboard/20';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted">
          {error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
              />
              
              {/* Detection overlays */}
              {detections.map((detection) => (
                <div
                  key={detection.id}
                  className={cn(
                    "absolute border-2 rounded animate-pulse",
                    getDetectionColor(detection.type)
                  )}
                  style={{
                    left: `${(detection.bbox.x / 640) * 100}%`,
                    top: `${(detection.bbox.y / 480) * 100}%`,
                    width: `${(detection.bbox.width / 640) * 100}%`,
                    height: `${(detection.bbox.height / 480) * 100}%`,
                  }}
                >
                  <Badge 
                    className="absolute -top-6 left-0 text-xs"
                    variant={detection.confidence > 0.8 ? "default" : "secondary"}
                  >
                    {detection.type} ({Math.round(detection.confidence * 100)}%)
                  </Badge>
                  <Badge 
                    className="absolute -bottom-6 left-0 text-xs bg-muted"
                  >
                    {detection.context}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </div>
        
        <div className="p-4 flex items-center justify-between bg-card/50">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Live Detection</span>
          </div>
          
          <Button
            onClick={onToggle}
            variant={isActive ? "destructive" : "default"}
            size="sm"
            className="flex items-center space-x-2"
          >
            {isActive ? (
              <>
                <CameraOff className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Start</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraFeed;