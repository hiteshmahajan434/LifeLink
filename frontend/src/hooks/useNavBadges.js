import { getEmergencyRequests } from "../api/ambulance.api";
import { getHospitalRequests } from "../api/hospital.api";
import useFetch from "./useFetch";

const ACTIVE_EMERGENCY = ["CONFIRMED", "SEARCHING_HOSPITAL", "HOSPITALS_PINGED", "HOSPITAL_ASSIGNED"];

/**
 * Live counters for the sidebar badge and the header bell.
 *   ambulance → emergencies still in progress
 *   hospital  → requests waiting for a response (PENDING and not yet expired)
 */
export default function useNavBadges(role) {
  const fetcher = role === "HOSPITAL" ? getHospitalRequests : getEmergencyRequests;
  const { data } = useFetch(fetcher, { interval: 30000 });
  const list = Array.isArray(data) ? data : [];

  const requests =
    role === "HOSPITAL"
      ? list.filter((r) => r.status === "PENDING" && (!r.expiresAt || new Date(r.expiresAt) > new Date())).length
      : list.filter((r) => ACTIVE_EMERGENCY.includes(r.status)).length;

  return { requests };
}
