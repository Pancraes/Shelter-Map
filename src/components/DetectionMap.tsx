import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Layers, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapDetection {
  id: string;
  lat: number;
  lon: number;
  object_type: 'tent' | 'blanket' | 'cardboard';
  context: 'street' | 'park' | 'subway' | 'bus' | 'train' | 'unknown';
  confidence: number;
  timestamp: string;
}

interface DetectionMapProps {
  userLocation?: { lat: number; lon: number };
}

const DetectionMap = ({ userLocation }: DetectionMapProps) => {
  const [detections, setDetections] = useState<MapDetection[]>([]);
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');
  
  // Mock current location if not provided
  const currentLocation = userLocation || { lat: 40.7128, lon: -74.0060 }; // NYC

  // Load detections from Supabase
  useEffect(() => {
    loadDetections();
    
    // Set up real-time subscription for new detections
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detections'
        },
        (payload) => {
          console.log('New detection received:', payload);
          const newDetection = payload.new as MapDetection;
          setDetections(prev => [...prev, newDetection]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDetections = async () => {
    try {
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading detections:', error);
      } else {
        // Type cast the data to ensure proper typing
        const typedDetections = (data || []).map(item => ({
          ...item,
          object_type: item.object_type as 'tent' | 'blanket' | 'cardboard',
          context: item.context as 'street' | 'park' | 'subway' | 'bus' | 'train' | 'unknown'
        }));
        setDetections(typedDetections);
      }
    } catch (error) {
      console.error('Error loading detections:', error);
    }
  };

  const handleResetView = () => {
    console.log('Reset view to current location');
    loadDetections(); // Also refresh data
  };

  const getDetectionStats = () => {
    const stats = detections.reduce((acc, detection) => {
      acc[detection.object_type] = (acc[detection.object_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return stats;
  };

  const stats = getDetectionStats();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Detection Map</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'markers' ? 'heatmap' : 'markers')}
              className="flex items-center space-x-1"
            >
              <Layers className="h-4 w-4" />
              <span>{viewMode === 'markers' ? 'Heatmap' : 'Markers'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(stats).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}: {count}
            </Badge>
          ))}
          <Badge variant="secondary" className="text-xs">
            Total: {detections.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <div className="h-full min-h-[400px] relative bg-muted/10 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <MapPin className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Real-time Detection Map</h3>
              <p className="text-muted-foreground">Map displays live detections from the camera</p>
            </div>
            <div className="bg-background/80 p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium">
                Showing {detections.length} total detections
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {detections.slice(0, 8).map((detection) => (
                  <div key={detection.id} className="text-xs bg-muted/50 p-2 rounded flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="text-xs mr-1">{detection.object_type}</Badge>
                      <Badge variant="secondary" className="text-xs">{detection.context}</Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {Math.round(detection.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              {detections.length > 8 && (
                <p className="text-xs text-muted-foreground">
                  +{detections.length - 8} more detections
                </p>
              )}
              {detections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Start the camera to begin detecting objects
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectionMap;