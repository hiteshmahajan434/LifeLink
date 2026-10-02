import { ArrowRight } from "lucide-react";
import RoleTabs from "./RoleTabs";

const PortalSelection = ({ role, setRole, onContinue }) => {
  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-7">
        <span
          className="
            mb-2
            block
            text-[10px]
            font-semibold
            tracking-[0.12em]
            text-ink-muted
          "
        >
          WELCOME TO LIFELINK
        </span>

        <h2
          className="
            text-[30px]
            font-semibold
            tracking-[-0.045em]
            text-ink
            sm:text-[35px]
          "
        >
          Emergency care,
          <br />
          connected.
        </h2>

        <p
          className="
            mt-2
            text-[13px]
            leading-6
            text-ink-soft
            sm:text-[14px]
          "
        >
          Choose your portal to continue.
        </p>
      </div>

      {/* Role */}
      <div className="mb-7">
        <RoleTabs
          role={role}
          setRole={setRole}
        />
      </div>

      {/* Continue */}
      <button
        type="button"
        onClick={onContinue}
        className="
          group
          flex
          h-[52px]
          w-full
          items-center
          justify-center
          gap-2
          rounded-[11px]
          bg-primary
          text-[13px]
          font-semibold
          text-ink
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:brightness-95
          active:translate-y-0
        "
      >
        <span>Continue</span>

        <ArrowRight
          size={18}
          className="
            transition-transform
            duration-200
            group-hover:translate-x-1
          "
        />
      </button>

      {/* Bottom */}
      <p className="mt-7 text-center text-[11px] text-ink-muted">
        Secure access for emergency response partners
      </p>
    </div>
  );
};

export default PortalSelection;