import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function Footer() {
  const { dict } = await getDictionary();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold">Pamasahe Cabanatuan</span> · {dict.footer.about}
        </p>
        <p>
          <a
            href="https://www.openstreetmap.org/copyright"
            className="inline-flex min-h-11 items-center underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            {dict.footer.mapData}
          </a>
        </p>
      </div>
    </footer>
  );
}
