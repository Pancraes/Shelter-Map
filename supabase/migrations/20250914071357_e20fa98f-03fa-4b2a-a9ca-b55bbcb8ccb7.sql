-- Create detections table for storing homeless shelter detections
CREATE TABLE public.detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lat DECIMAL(10,8) NOT NULL,
  lon DECIMAL(11,8) NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('tent', 'blanket', 'cardboard')),
  context TEXT NOT NULL CHECK (context IN ('street', 'park', 'subway', 'bus', 'train', 'unknown')),
  confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is a public mapping project)
CREATE POLICY "Allow public read access to detections" 
ON public.detections 
FOR SELECT 
USING (true);

-- Create policy for public insert access (anyone can submit detections)
CREATE POLICY "Allow public insert access to detections" 
ON public.detections 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance on location queries
CREATE INDEX idx_detections_location ON public.detections (lat, lon);
CREATE INDEX idx_detections_timestamp ON public.detections (timestamp DESC);
CREATE INDEX idx_detections_type ON public.detections (object_type);

-- Enable realtime for the detections table
ALTER TABLE public.detections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;