import emergencyAlert from "../assets/sound/emergency-alert.mp3";

let alertAudio = null;

export const playEmergencyAlert = () => {
  try {
    if (!alertAudio) {
      alertAudio = new Audio(emergencyAlert);
      alertAudio.volume = 1.0;
    }

    alertAudio.currentTime = 0;
    alertAudio.play().catch((error) => {
      console.warn("Unable to play emergency alert:", error);
    });
  } catch (error) {
    console.warn("Emergency alert failed:", error);
  }
};