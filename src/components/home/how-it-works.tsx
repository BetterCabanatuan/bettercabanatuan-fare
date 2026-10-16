import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function HowItWorks() {
  const { dict } = await getDictionary();
  const t = dict.home;

  return (
    <section aria-labelledby="steps-heading" className="border-y bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h2 id="steps-heading" className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t.stepsHeading}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {t.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
              {/* The list already numbers the steps for screen readers. */}
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-highlight text-lg font-extrabold text-highlight-foreground tabular-nums"
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-extrabold tracking-tight">{step.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
