import { UserRound } from "lucide-react";
import { changeAmbulancePassword, getAmbulanceProfile, updateAmbulanceProfile } from "../../api/ambulance.api";
import ProfilePage from "../../components/profile/ProfilePage";

// Only the differences from the hospital profile live here
const CONFIG = {
  title: "Ambulance Profile",
  subtitle: "Manage your ambulance credentials, vehicle identity, and security",
  icon: UserRound,
  formTitle: "Profile Details",
  formSubtitle: "Update your vehicle and unit contact information.",
  idLabel: "Ambulance ID",
  fields: [
    { name: "name", label: "Vehicle name / call sign" },
    { name: "hospitalName", label: "Hospital / organization" },
    { name: "email", label: "Official email" },
    { name: "mobile", label: "Emergency mobile" },
  ],
};

const AmbulanceProfile = () => (
  <ProfilePage config={CONFIG} load={getAmbulanceProfile} update={updateAmbulanceProfile} changePassword={changeAmbulancePassword} />
);

export default AmbulanceProfile;
