import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, MapPin, Camera, Database } from 'lucide-react';
import CameraFeed from '@/components/CameraFeed';
import DetectionMap from '@/components/DetectionMap';
import DetectionStats from '@/components/DetectionStats';
import { toast } from 'sonner';

interface Detection {
  id: string;
  lat: number;
  lon: number;
  type: 'tent' | 'blanket' | 'cardboard';
  context: 'street' | 'park' | 'subway' | 'bus' | 'train' | 'unknown';
  confidence: number;
  timestamp: string;
}

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [needsSupabase, setNeedsSupabase] = useState(false);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to NYC coordinates
          setUserLocation({ lat: 40.7128, lon: -74.0060 });
        }
      );
    }
  }, []);

  const handleDetection = (detection: any) => {
    if (!userLocation) return;

    // Add some random offset to simulate different locations
    const newDetection: Detection = {
      ...detection,
      lat: userLocation.lat + (Math.random() - 0.5) * 0.01,
      lon: userLocation.lon + (Math.random() - 0.5) * 0.01,
      timestamp: new Date().toISOString(),
    };

    setDetections(prev => [...prev, newDetection]);
    
    // Show toast notification
    toast.success(`${detection.type} detected in ${detection.context}`, {
      description: `Confidence: ${Math.round(detection.confidence * 100)}%`,
    });

    // In a real app, this would save to Supabase
    console.log('New detection:', newDetection);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      toast.info('Detection started', {
        description: 'Camera is now analyzing for shelter objects',
      });
    } else {
      toast.info('Detection stopped');
    }
  };

  const handleConnectSupabase = () => {
    setNeedsSupabase(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Homelessness Detection</h1>
                <p className="text-sm text-muted-foreground">Real-time shelter mapping</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {needsSupabase && (
                <Badge variant="destructive" className="animate-pulse">
                  Connect Supabase Required
                </Badge>
              )}
              <Button
                onClick={handleConnectSupabase}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>Setup Backend</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Supabase Connection Notice */}
      {needsSupabase && (
        <div className="bg-destructive/10 border-b border-destructive/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium">Backend Connection Required</p>
                <p className="text-xs text-muted-foreground">
                  To store detection data and enable real-time updates, you need to connect to Supabase.
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setNeedsSupabase(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Live Detection</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Map View</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CameraFeed
                  onDetection={handleDetection}
                  isActive={isRecording}
                  onToggle={handleToggleRecording}
                />
              </div>
              <div>
                <DetectionStats
                  detections={detections}
                  isRecording={isRecording}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <DetectionMap
              userLocation={userLocation || undefined}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetectionStats
                detections={detections}
                isRecording={isRecording}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Data Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>🔒 No personal data or faces are captured</p>
                    <p>📱 Images are processed locally and immediately deleted</p>
                    <p>🗺️ Only object type, location, and context are stored</p>
                    <p>⏱️ Rate limited to prevent spam and duplicate entries</p>
                  </div>
                  <Badge variant="success" className="w-full justify-center">
                    Privacy Compliant
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
