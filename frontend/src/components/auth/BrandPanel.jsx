import { ShieldCheck } from "lucide-react";

const BrandPanel = () => {
  return (
    <section className="relative min-h-[420px] overflow-hidden bg-card-dark text-white lg:min-h-screen">
      {/* Lime glow */}
      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-primary/10
          blur-[90px]
        "
      />

      {/* Lavender glow */}
      <div
        className="
          pointer-events-none
          absolute
          -bottom-40
          -right-40
          h-[400px]
          w-[400px]
          rounded-full
          bg-accent/10
          blur-[100px]
        "
      />

      <div
        className="
          relative
          z-10
          flex
          min-h-[420px]
          flex-col
          justify-between
          px-6
          py-7
          sm:px-10
          sm:py-10
          lg:min-h-screen
          lg:px-14
          lg:py-12
          xl:px-16
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              overflow-hidden
              rounded-[11px]
              bg-primary
            "
          >
            <span
              className="
                absolute
                h-[10px]
                w-[18px]
                rotate-[-35deg]
                -translate-x-[2px]
                -translate-y-[3px]
                rounded-lg
                border-[3px]
                border-ink
              "
            />

            <span
              className="
                absolute
                h-[10px]
                w-[18px]
                rotate-[-35deg]
                translate-x-[3px]
                translate-y-[3px]
                rounded-lg
                border-[3px]
                border-ink
              "
            />
          </div>

          <span className="text-[20px] font-semibold tracking-[-0.04em]">
            LifeLink
          </span>
        </div>

        {/* Hero */}
        <div className="my-14 max-w-[620px] lg:my-0">
          <div
            className="
              mb-5
              inline-flex
              items-center
              rounded-full
              border
              border-white/10
              px-3
              py-2
              text-[9px]
              font-semibold
              tracking-[0.13em]
              text-on-dark-muted
            "
          >
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" />
            EMERGENCY RESPONSE PLATFORM
          </div>

          <h1
            className="
              text-[44px]
              font-medium
              leading-[0.98]
              tracking-[-0.065em]
              sm:text-[54px]
              lg:text-[58px]
              xl:text-[70px]
            "
          >
            Connecting
            <br />

            <span className="text-primary">
              care
            </span>{" "}
            when
            <br />

            seconds matter.
          </h1>

          <p
            className="
              mt-7
              max-w-[500px]
              text-[14px]
              leading-7
              text-ink-muted
              sm:text-[15px]
            "
          >
            A connected emergency-response platform
            helping ambulances and hospitals coordinate
            faster, when every second matters.
          </p>
        </div>

        {/* Footer */}
        <div
          className="
            flex
            items-center
            justify-between
            gap-5
            border-t
            border-white/10
            pt-5
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-[10px]
              text-ink-muted
              sm:text-[11px]
            "
          >
            <ShieldCheck
              size={16}
              className="text-primary"
            />

            <span>
              Secure emergency coordination
            </span>
          </div>

          <span
            className="
              hidden
              text-[10px]
              text-ink-muted
              sm:block
            "
          >
            LifeLink · 2026
          </span>
        </div>
      </div>
    </section>
  );
};

export default BrandPanel;