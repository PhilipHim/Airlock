import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="relative min-h-screen bg-paper">
        <nav className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
          <span className="font-display text-2xl tracking-wide text-accent">
            AIRLOCK
          </span>
          <Link
            href="/file"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper"
          >
            Open the file
          </Link>
        </nav>

        <div className="grid min-h-screen md:grid-cols-2">
          <div className="flex flex-col justify-center px-6 pb-32 pt-24 md:px-12 lg:px-16">
            <h1 className="font-display text-[clamp(4.2rem,12vw,8rem)] leading-[0.82] tracking-wide text-ink">
              AIR
              <br />
              LOCK
            </h1>
            <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
              Two company agents work one incident. Each keeps its own file.
            </p>
            <Link
              href="/file"
              className="mt-8 inline-flex h-28 w-28 items-center justify-center rounded-full bg-accent text-center text-sm font-medium leading-tight text-paper"
            >
              Open
              <br />
              the file
            </Link>
          </div>
          <div className="relative min-h-[55vh] md:min-h-screen">
            <img
              src="/keyhole.jpg"
              alt="A keyhole filled with flowers. You only see what the chamber lets through."
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="karo absolute bottom-0 left-0 right-0 z-10" aria-hidden />
      </section>

      <section className="bg-ink px-6 py-20 text-paper md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide md:text-5xl">
            Agents overshare the moment they collaborate.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-paper/85">
            Give two models a joint task and they send names, customer IDs, and
            addresses with the useful count. A prompt that says be careful does
            not hold. The model is trying to help. Help, here, is a leak.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-paper/85">
            Firms then keep agents apart. The files sit unused. The models can
            do the work. Nobody set the rights.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-paper/85">
            AIRLOCK covers the rights on the shared write, a second from the
            other file, and memory of the block on the next run. It does not
            claim to fix long-horizon drift or week-long memory.
          </p>
        </div>
      </section>

      <div className="karo" aria-hidden />

      <section className="px-6 py-20 md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide md:text-5xl">
            A sentence crosses only if three checks pass.
          </h2>
          <p className="mt-6 text-lg leading-relaxed">
            AIRLOCK is a shared channel with a door. Agent A may propose a
            claim. Agent B must second it from its own file. Python then checks
            every field: a count may pass, a name may not. Even an allowed
            sentence stays private until a human closes the record.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            That is the product. Code in front of the shared write, plus a
            person who says this may go out. A longer prompt is hope.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-3">
        <div className="border-b border-line px-8 py-16 md:border-b-0 md:border-r">
          <h2 className="font-display text-3xl tracking-wide">File A</h2>
          <p className="mt-3 text-muted">
            Agent A sees Anna Müller and the rest of the retailer list. Flower
            Context never stores that file. The other agent cannot read it.
          </p>
        </div>
        <div className="border-b border-line bg-accent px-8 py-16 text-paper md:border-b-0">
          <h2 className="font-display text-3xl tracking-wide">Chamber</h2>
          <p className="mt-3">
            Empty until a second, the gate, and a human agree. Private files.
            Airlock. Human release.
          </p>
        </div>
        <div className="px-8 py-16 md:border-l md:border-line">
          <h2 className="font-display text-3xl tracking-wide">File B</h2>
          <p className="mt-3 text-muted">
            Agent B sees its own supplier list. No IDs from the left. It can
            only second a claim it can support from this file.
          </p>
        </div>
      </section>

      <section className="bg-paper px-6 py-20 md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide md:text-5xl">
            You can search the Context. That is the proof.
          </h2>
          <p className="mt-6 text-lg leading-relaxed">
            After the name is blocked, search Flower Context for Anna Müller.
            Zero hits. The name still sits in File A. It never entered the
            shared ledger. A filter you cannot inspect is a story. An empty
            Context is a fact.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            What is unique here is the second. The other organisation has to
            back the claim from its own records. The gate then strips identity.
            The human still has to release. Three doors, one sentence.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Honest limit: today this is application-level isolation, one
            AgentApp, two JSON files. In production each firm would run its own
            node. We do not pretend the process boundary is physical yet.
          </p>
        </div>
      </section>

      <section className="flex flex-col items-start gap-8 px-8 py-24 md:flex-row md:items-center md:px-16">
        <p className="font-display text-[8rem] leading-none tracking-wide md:text-[12rem]">
          0
        </p>
        <div>
          <h2 className="font-display text-4xl tracking-wide md:text-5xl">
            Anna Müller in Context
          </h2>
          <p className="mt-4 max-w-lg text-lg">
            Zero hits after the block. Names stay on the left. The shared
            middle stays empty.
          </p>
          <Link
            href="/file"
            className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-medium text-paper"
          >
            Open the file
          </Link>
        </div>
      </section>
    </main>
  );
}
