import Image from "next/image";
import Link from "next/link";
import { featuredEvents, siteMetadata } from "@/lib/seo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans dark:bg-zinc-950">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center gap-10 py-24 px-8 text-center sm:items-start sm:text-left">
        <Image
          src="/og-image.png"
          alt="MyEcclesia identity"
          width={120}
          height={120}
          className="rounded-full shadow-lg ring-2 ring-blue-500/50"
          priority
        />
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            {siteMetadata.name}
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Book Spirit-filled events across the UK with confidence.
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            {siteMetadata.description} Curated line-ups highlight conferences,
            retreats, worship nights, and leadership gatherings so your church
            calendar stays full of meaningful encounters.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/events/new"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:shadow-blue-500/10 dark:focus-visible:ring-offset-zinc-950"
            >
              Create event
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Share your conference, worship night, or retreat.
            </p>
          </div>
        </div>
        <div className="w-full rounded-3xl border border-zinc-200 bg-white/70 p-6 text-left shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Upcoming highlights
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automatically mirrored to search engines through Event JSON-LD.
          </p>
          <ul className="mt-6 space-y-4">
            {featuredEvents.map((event) => (
              <li key={event.slug} className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {new Date(event.startDate).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {event.location.addressLocality}
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {event.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
