
##Inspiration
Cities and nonprofits spend millions on manual street counts and surveys to estimate homelessness, often producing outdated data. We wanted to explore how computer vision and geospatial technology could provide real-time, anonymized insights while respecting dignity and privacy.

##What it does
ShelterMap uses a camera feed, intended for willing users wearing devices such as smart glasses (for example, Apple Vision Pro or similar), to detect signs of outdoor shelters such as tents, blankets, and cardboard. When these are identified, the system records only the approximate location and object type, never faces or personal identifiers. The detections are then intended to display on a real-time map, helping outreach teams and service providers see where needs are emerging. Currently, the map component is not fully functional. The project demonstrates the detection and data collection flow, but the visualization is still a work in progress.

##How we built it
- Frontend: Built entirely with Vite, React, shadcn/ui, and TypeScript.
- Backend/Database: Supabase is used to log and manage detection events in real time.
- Machine Learning: Google Cloud Vision API to recognize shelter-related objects in the video feed.
- Privacy: All images are processed only for object detection; no photos or videos are stored. Only anonymized detections are logged.

##Challenges we ran into
One major challenge was balancing accuracy with privacy and making sure no personally identifiable data was collected. Using Google Cloud Vision for categories like blankets or cardboard required creative workarounds. The map visualization did not work as intended within our limited time. We also spent time debugging React state management with real-time updates in TypeScript.

##Accomplishments that we are proud of
We built a working prototype that successfully detects shelter-related items. We designed a system that prioritizes ethics by avoiding faces and identities, and we built a front-end app with a clean user interface using shadcn components.

##What we learned
We learned how to integrate Google Cloud Vision into a React app, how important privacy-by-design is in civic technology projects, and how difficult it is to get mapping visualizations working well under hackathon time pressure.

What’s next for ShelterMap
The next steps are to fix the map visualization so detections appear in real time, add context detection such as subway, bus, or park to understand mobility patterns, connect to a real backend such as Supabase or Postgres for persistent storage, and work with local outreach organizations to pilot test. We also want to explore heatmap visualizations and temporal trends instead of exact pins.
