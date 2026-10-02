import { Building2 } from "lucide-react";
import { changeHospitalPassword, getHospitalProfile, updateHospitalProfile } from "../../api/hospital.api";
import ProfilePage from "../../components/profile/ProfilePage";

const CONFIG = {
  title: "Hospital Profile",
  subtitle: "Manage your hospital credentials, facility details, and dispatch security",
  icon: Building2,
  formTitle: "Facility Details",
  formSubtitle: "Update your hospital facility and contact information.",
  idLabel: "Hospital ID",
  fields: [
    { name: "name", label: "Hospital / clinic name" },
    { name: "phone", label: "24/7 emergency hotline" },
    { name: "email", label: "Official dispatch email" },
    { name: "address", label: "Physical facility address", wide: true },
  ],
};

const HospitalProfile = () => (
  <ProfilePage config={CONFIG} load={getHospitalProfile} update={updateHospitalProfile} changePassword={changeHospitalPassword} />
);

export default HospitalProfile;
