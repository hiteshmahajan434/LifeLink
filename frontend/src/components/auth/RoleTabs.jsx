import { Ambulance, Hospital } from "lucide-react";

const RoleTabs = ({ role, setRole }) => {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-1
        rounded-xl
        border
        border-line
        bg-workspace
        p-1
      "
    >
      <button
        type="button"
        onClick={() => setRole("ambulance")}
        className={`
          flex
          h-11
          items-center
          justify-center
          gap-2
          rounded-[9px]
          text-[12px]
          font-medium
          transition-all
          sm:text-[13px]
          ${
            role === "ambulance"
              ? "bg-white text-ink shadow-float"
              : "text-ink-muted hover:text-ink"
          }
        `}
      >
        <Ambulance size={17} />
        Ambulance
      </button>

      <button
        type="button"
        onClick={() => setRole("hospital")}
        className={`
          flex
          h-11
          items-center
          justify-center
          gap-2
          rounded-[9px]
          text-[12px]
          font-medium
          transition-all
          sm:text-[13px]
          ${
            role === "hospital"
              ? "bg-white text-ink shadow-float"
              : "text-ink-muted hover:text-ink"
          }
        `}
      >
        <Hospital size={17} />
        Hospital
      </button>
    </div>
  );
};

export default RoleTabs;