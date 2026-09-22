# PULSE — Call & Report Emergency Ambulance Dispatch Platform

> **"One tap. Fastest help."**  
> A modern, high-urgency Emergency Ambulance Dispatch and Hospital Operations mobile application connecting Patients/Bystanders, Ambulance Drivers, and Hospital Operations Teams in real time.

---

## 🚑 Project Overview

**PULSE (Call & Report)** is an emergency response mobile application engineered for high-stress, high-urgency medical dispatch scenarios. Built using **Expo**, **React Native**, **TypeScript**, and **Free OSRM Routing**, PULSE provides end-to-end coordination from the initial emergency call to patient pickup and hospital emergency room handover.

---

## ✨ Key Features & Interfaces

### 1. 🏠 Landing & Role Selection (`/`)
- **Emergency Hero Section**: High-contrast, mobile-first interface.
- **Persona Shortcuts**:
  - 🚑 **Ambulance Driver Cockpit** (`/ambulance`)
  - 🏥 **Hospital Operations Dashboard** (`/hospital`)
  - 👤 **Patient Incident Portal** (`/patient`)
- **Secondary Emergency SOS FAB**: Always-visible floating action button equipped with device GPS (`expo-location`) to immediately dispatch an ambulance to the user's live coordinates.

### 2. 🚑 Ambulance Driver Cockpit (`/ambulance`)
- **Drag-Enabled White Light Map Canvas**:
  - Interactive map canvas supporting touch panning and pinch zooming.
  - Live animated vehicle position marker (`MH 31 AM 4921`) and patient pin.
  - Live OSRM polyline route rendering with dynamic ETA and distance readouts.
- **Trip Status Panel**:
  - 5-stage stepper: `Dispatched → En Route to Patient → Patient Picked Up → En Route to Hospital → Arrived`.
  - **"Mark Patient Picked Up"** action button: Automatically recalculates OSRM driving route strictly between **Patient Location $\rightarrow$ Assigned Hospital**.
- **Incremental Radius Expansion Search**:
  - Checks hospital radius sequentially: `1km → 2km → 3km → 5km → 10km → 20km`.
  - Auto-assigns the hospital with the absolute **minimum distance (Min Km)**.
- **Location Controls**:
  - **Detect GPS**: Live device GPS locator, with a Nandanvan, Nagpur preset when location is unavailable.
  - **Nandanvan, Nagpur Preset**: Quick-switch to Nandanvan, Nagpur, Maharashtra, India.
  - **Search Address**: Search bar to locate any city or landmark worldwide.

### 3. 🏥 Hospital Operations Dashboard (`/hospital`)
- **Incoming Ambulance Feed**: Real-time cards of en-route ambulances showing patient vitals snapshot, driver details, live ETA, and expandable mini route preview.
- **Facility Readiness Matrix**: Interactive capacity & equipment grid across 5 categories:
  1. *General Capacity* (Beds, Stretchers, Rooms, ICU Beds, OT Rooms)
  2. *Operation Theatre Equipment* (Anesthesia workstation, Electrosurgical unit, Laparoscopy system, Monitors)
  3. *Patient Monitoring Equipment* (Digital patient monitors, ECG/EKG, Pulse oximeters, Capnography)
  4. *Diagnostic Imaging* (X-Ray, CT Scan, MRI, Ultrasound, Mammography, PET-CT)
  5. *Laboratory* (Blood analyzer, Biochemistry, PCR, Blood Gas, Microscope)
- **Bed Occupancy Breakdown**: Bar chart and donut chart visualizing capacity across General, ICU, Emergency, Maternity, and Pediatric departments.
- **Hospital Name Sync**: Displays the exact name, address, distance, and trauma level of the assigned nearby hospital.

### 4. 👤 Patient Incident Portal (`/patient`)
- **Active Dispatch Stage Indicator**: Real-time stepper tracking ambulance arrival.
- **Patient Health Telemetry Panel (`VitalsCard`)**: Range-coded vitals (Blood Pressure, Blood Sugar, Heart Rate, SpO2, Body Temp), reported symptoms, allergies, ongoing medications, and caller details.
- **Incident Event Audit Log (`StatusTimeline`)**: Chronological post-incident log with timestamps for audit and emergency room handover.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 57, React Native, Expo Router |
| **Language** | TypeScript |
| **Styling** | React Native StyleSheet, light theme |
| **Map & GIS** | react-native-maps, CartoDB Voyager and OpenStreetMap tiles |
| **Routing Engine** | Free OSRM Public Driving Route API (`router.project-osrm.org`) |
| **Geocoding API** | OpenStreetMap Nominatim API |
| **Charts** | react-native-svg bar and donut charts |
| **Icons** | Lucide React Native |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18.0.0 or higher
- npm package manager

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd Pluse-
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the Expo development server:**
   ```bash
   npm start
   ```

4. **Open on Android:**
   ```bash
   npm run android
   ```
   This launches the app in Expo Go on a connected device or running emulator.

---

## 📍 Default Coordinates & Locations

- **Default Location**: Nandanvan, Nagpur, Maharashtra, India (`Latitude 21.1384`, `Longitude 79.1235`)
- **Default Nearby Hospitals (Nagpur, Maharashtra)**:
  - **Nandanvan Life Care Emergency Hospital** — `0.8 km` (ETA 2 mins)
  - **Dr. Dalvi Memorial Hospital & Emergency Care** — `1.8 km` (ETA 4 mins)
  - **Platina Heart & Super Specialty Hospital** — `2.4 km` (ETA 5 mins)
  - **Shrikhande Emergency Hospital** — `2.9 km` (ETA 5 mins)
  - **Government Medical College & Hospital (GMC Nagpur)** — `3.2 km` (ETA 6 mins)

---

## 📁 Directory Structure

```
/app
  /_layout.tsx                → Root tabs, header, and Inter font
  /index.tsx                  → Landing / role selection & Emergency SOS
  /ambulance.tsx              → Ambulance driver cockpit & live OSRM map
  /hospital.tsx               → Hospital operations dashboard & readiness grid
  /patient.tsx                → Patient incident tracking, vitals & timeline
  /+not-found.tsx             → Custom 404 screen
/components
  /shared                     → Status badge, section card, stepper, header
  /map/PulseMap.tsx           → Touch map with OSRM polylines and hospital pins
  /ambulance/TripStatusPanel.tsx
  /hospital                   → Incoming feed, readiness grid, occupancy charts
  /patient                    → Vitals card and incident timeline
/lib
  /osrm.ts                    → Free OSRM driving route API helper with fallback
  /locationStore.ts           → Nominatim geocoding, Overpass search, device storage
  /geo.ts                     → Device GPS helper
  /mockData.ts                → Dataset for hospitals, ambulances & patients
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
