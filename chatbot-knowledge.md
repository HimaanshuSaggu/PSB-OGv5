# Origins Guardian AI — Knowledge Base
Edit this file to train the chatbot. Changes take effect on the next message — no restart needed.

## What is Origins Guardian?
Origins Guardian (OG) is an autonomous archaeological site protection system built by
Power Surge Blast Robotics, an FLL (First Lego League) team at Evans Jr. High School,
Bloomington, IL. The team qualified for the FLL International Championship in Canada.

## The Device (ESP32-CAM)
An AI-Thinker ESP32-CAM running custom firmware. Sensors:
- PIR motion sensor (GPIO 14) — detects intruders by heat/movement
- DHT11 temperature + humidity sensor (GPIO 15)
- HC-SR04 ultrasonic sensor — TRIG GPIO 13, ECHO GPIO 2 — measures distance (triggers capture if < 60 cm)
- Flash LED (GPIO 4) — fires before each capture
- Passive piezo buzzer (GPIO 12) — boot melody + shutter chirp
- Camera — captures SVGA JPEG images

## How the System Works (The Pipeline)
1. PIR detects motion + ultrasonic confirms object within 60 cm
2. Flash fires, camera captures image
3. Image uploaded via HTTP PUT to hooloovoo.blue:18922/powersurge/images/
4. Sensor readings (temp, humidity) uploaded as JSON to /powersurge/sensors/
5. Pi 4 (hostname: powersurgeblast) polls the server every 10 seconds
6. New image sent to Gemini Vision AI for analysis
7. Verdict: Intruder / Animal / All Clear
8. If threat detected → archaeologist alerted via SMS + Telegram

## The Dashboard (This Website)
Built with Next.js 16, Tailwind v4, Framer Motion, React 19.
Features:
- Cinematic scroll hero (fog parts, marble pillars recede, Acropolis background)
- Multi-OG login: enter OG-1 through OG-4 + field code FLD-PSB-1 + password
- 4 Guardian rows (OG-1 active, OG-2 to OG-4 inactive)
- Controls panel: master toggle, motion sensor, camera, ultrasonic, temperature sensor
- Telemetry: battery gauge (ESP-32), signal gauge, temp, sparkline, live feed status
- Last Detection panel: newest image from the field server + archaeologist card
- Animated pipeline visualization
- Detections over time graph (14 days, labeled axes)
- Deployment map: interactive pan/zoom vector map, gold US state outlines, OG-1 pinned on Bloomington IL
- Alert feed: syncs with field server captures
- Gallery: all captures from field server
- Origins AI chatbot (this chatbot)

## How to Log In
1. Add Guardian numbers OG-1, OG-2, OG-3, OG-4 one at a time (any order)
2. Set Dig Site Name to FLD-PSB-1
3. Click "Begin the Watch"
4. Enter password when prompted

## Active Deployments
- OG-1: Bloomington, IL — Field FLD-PSB-1 — ACTIVE
- OG-2, OG-3, OG-4: Registered, not yet deployed — INACTIVE

## Connecting the ESP-32 to the Dashboard
The ESP-32 runs a local web server on port 80 exposing:
- GET /status → returns JSON with temp, humidity, distance, PIR state, signal, toggle states
- POST /control → receives {"device":"motion","on":false} to toggle sensors
The Next.js app polls /api/og/status every 5 seconds and sends toggles via /api/og/control.
Set ESP32_BASE in both route files to the ESP-32's local IP address.

## The Team
Power Surge Blast Robotics
Evans Jr. High School, Bloomington, IL
FLL (First Lego League) — qualified for International Championship
Team member: Himaanshu Saggu (8th grade)

## Add Your Own Knowledge Below:

