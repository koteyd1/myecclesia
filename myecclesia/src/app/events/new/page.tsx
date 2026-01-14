import Link from "next/link";

export const metadata = {
  title: "Create event",
  description: "Submit a new event to MyEcclesia.",
};

export default function CreateEventPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-20 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              Create event
            </h1>
            <Link
              href="/"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Back to home
            </Link>
          </div>

          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            Event submission is being wired up. For now, share the details below
            and we’ll use it to shape the creation flow.
          </p>

          <form className="mt-8 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Event name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Revival Night London"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="startDate"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  Start date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="city"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Manchester"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="What should people know about this event?"
                className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
            </div>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
            >
              Submit (coming soon)
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

