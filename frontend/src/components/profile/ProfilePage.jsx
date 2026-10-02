import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import PageHero from "../layout/PageHero";
import { ErrorState, LoadingState } from "../ui";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

/**
 * The whole profile screen, shared by both roles.
 * Each portal's Profile page just supplies config + its API functions:
 *
 *   <ProfilePage config={...} load={getAmbulanceProfile} update={updateAmbulanceProfile} changePassword={...} />
 */
export default function ProfilePage({ config, load, update, changePassword }) {
  const { updateUser } = useAuth();
  const { data: profile, loading, error, reload } = useFetch(load);

  const save = async (values) => {
    const response = await update(values);
    updateUser(response.data);     // keep the header in sync
    await reload({ silent: true });
  };

  return (
    <>
      <PageHero title={config.title} subtitle={config.subtitle} />
      <div className="px-6 pb-8 lg:px-8">
        {loading ? (
          <LoadingState label="Loading profile…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <ProfileForm
              key={profile?.updatedAt || profile?._id}
              icon={config.icon}
              title={config.formTitle}
              subtitle={config.formSubtitle}
              idLabel={config.idLabel}
              idValue={profile?.id}
              fields={config.fields}
              initialValues={Object.fromEntries(config.fields.map((f) => [f.name, profile?.[f.name] ?? ""]))}
              footnote={profile?.updatedAt ? `Last updated ${new Date(profile.updatedAt).toLocaleString("en-IN")}` : ""}
              onSave={save}
            />
            <PasswordForm onSubmit={changePassword} />
          </div>
        )}
      </div>
    </>
  );
}
