import { BedDouble, Activity, Bed, Wind, Droplets, FlaskConical } from "lucide-react";

// Countable hospital resources (match backend keys exactly)
export const COUNTABLE_RESOURCES = [
  { key: "icuBeds", label: "ICU Beds", icon: BedDouble },
  { key: "traumaBeds", label: "Trauma Beds", icon: Activity },
  { key: "generalBeds", label: "General Beds", icon: Bed },
  { key: "ventilators", label: "Ventilators", icon: Wind },
];

// On/off hospital resources
export const CRITICAL_RESOURCES = [
  { key: "oxygenSupply", label: "Oxygen Supply", description: "Oxygen availability for emergency patients", icon: FlaskConical },
  { key: "bloodBank", label: "Blood Bank", description: "Blood bank availability", icon: Droplets },
];

export const EMERGENCY_TYPES = [
  { value: "ROAD_ACCIDENT", label: "Road Accident" },
  { value: "CARDIAC_EMERGENCY", label: "Cardiac Emergency" },
  { value: "BREATHING_EMERGENCY", label: "Breathing Emergency" },
  { value: "STROKE", label: "Stroke" },
  { value: "SEVERE_INJURY", label: "Severe Injury" },
  { value: "BURN", label: "Burn" },
  { value: "POISONING", label: "Poisoning" },
  { value: "PREGNANCY", label: "Pregnancy" },
  { value: "UNCONSCIOUS", label: "Unconscious" },
  { value: "OTHER", label: "Other" },
];

export const EMPTY_RESOURCES = {
  icuBeds: 0, traumaBeds: 0, generalBeds: 0, ventilators: 0, oxygenSupply: false, bloodBank: false,
};

// Life-threatening types — shown with the critical (red) treatment
export const CRITICAL_EMERGENCY_TYPES = [
  "CARDIAC_EMERGENCY", "BREATHING_EMERGENCY", "STROKE", "SEVERE_INJURY", "UNCONSCIOUS",
];
