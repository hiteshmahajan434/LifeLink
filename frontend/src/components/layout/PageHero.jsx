/** Page title block. `eyebrow` = small label above, `actions` = buttons on the right. */
export default function PageHero({ eyebrow, title, subtitle, actions }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5 pt-6 lg:px-8">
      <div>
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-headline font-bold tracking-tight text-ink lg:text-display">{title}</h1>
        {subtitle && <p className="mt-1.5 text-body text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </section>
  );
}
