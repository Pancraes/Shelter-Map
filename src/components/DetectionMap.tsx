import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Layers, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet - simplified approach
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapDetection {
  id: string;
  lat: number;
  lon: number;
  type: 'tent' | 'blanket' | 'cardboard';
  context: 'street' | 'park' | 'subway' | 'bus' | 'train' | 'unknown';
  confidence: number;
  timestamp: string;
}

interface DetectionMapProps {
  detections: MapDetection[];
  userLocation?: { lat: number; lon: number };
}

const DetectionMap = ({ detections, userLocation }: DetectionMapProps) => {
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');
  
  // Mock current location if not provided
  const currentLocation = userLocation || { lat: 40.7128, lon: -74.0060 }; // NYC

  const handleResetView = () => {
    console.log('Reset view to current location');
  };

  const getDetectionStats = () => {
    const stats = detections.reduce((acc, detection) => {
      acc[detection.type] = (acc[detection.type] || 0) + 1;
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
        <div className="h-full min-h-[400px] relative">
          <MapContainer
            center={[currentLocation.lat, currentLocation.lon]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {detections.map((detection) => (
              <Marker
                key={detection.id}
                position={[detection.lat, detection.lon]}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">{detection.type}</Badge>
                      <Badge variant="secondary">{detection.context}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {Math.round(detection.confidence * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(detection.timestamp).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectionMap;