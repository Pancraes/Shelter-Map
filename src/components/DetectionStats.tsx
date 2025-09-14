import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Clock, MapPin } from 'lucide-react';

interface Detection {
  id: string;
  type: 'tent' | 'blanket' | 'cardboard';
  context: 'street' | 'park' | 'subway' | 'bus' | 'train' | 'unknown';
  confidence: number;
  timestamp: string;
}

interface DetectionStatsProps {
  detections: Detection[];
  isRecording: boolean;
}

const DetectionStats = ({ detections, isRecording }: DetectionStatsProps) => {
  const getTypeStats = () => {
    const stats = detections.reduce((acc, detection) => {
      acc[detection.type] = (acc[detection.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = detections.length;
    return Object.entries(stats).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const getContextStats = () => {
    const stats = detections.reduce((acc, detection) => {
      acc[detection.context] = (acc[detection.context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getRecentDetections = () => {
    return detections
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const typeStats = getTypeStats();
  const contextStats = getContextStats();
  const recentDetections = getRecentDetections();
  const avgConfidence = detections.length > 0 
    ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
    : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tent': return 'bg-detection-tent';
      case 'blanket': return 'bg-detection-blanket';
      case 'cardboard': return 'bg-detection-cardboard';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Session Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Session Overview</span>
            {isRecording && (
              <Badge variant="destructive" className="ml-auto animate-pulse">
                LIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{detections.length}</div>
              <div className="text-sm text-muted-foreground">Total Detections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.round(avgConfidence * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Object Type Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Object Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {typeStats.length > 0 ? (
            typeStats.map(({ type, count, percentage }) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No detections yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Context Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MapPin className="h-4 w-4" />
            <span>Top Contexts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contextStats.length > 0 ? (
            <div className="space-y-2">
              {contextStats.map(({ context, count }) => (
                <div key={context} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{context}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No context data yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="h-4 w-4" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentDetections.length > 0 ? (
            <div className="space-y-3">
              {recentDetections.map((detection) => (
                <div key={detection.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${getTypeColor(detection.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {detection.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {detection.context}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(detection.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(detection.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetectionStats;