import CopyCommand from "./copy-command";
import DemoBoard from "./demo/board";
import { ENDEAVOR_PROOF, SUPERGRID_COMMAND } from "@/lib/chamber";

export default function Home() {
  return (
    <main>
      <section className="relative min-h-screen bg-paper">
        <nav className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
          <span className="font-display text-2xl tracking-wide text-accent">
            AIRLOCK
          </span>
          <a
            href="#incident"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-paper"
          >
            Live demo
          </a>
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
            <a
              href="#incident"
              className="mt-8 inline-flex h-28 w-28 items-center justify-center rounded-full bg-accent text-center text-sm font-medium leading-tight text-paper"
            >
              Live
              <br />
              demo
            </a>
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

      <section id="incident">
        <DemoBoard embedded />
      </section>

      <section className="bg-ink px-6 py-20 text-paper md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide md:text-5xl">
            Agents overshare the moment they collaborate.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-paper/85">
            Give two models a joint task and they send names with the useful
            return. Firms then stop the agents talking. The files sit unused.
            AIRLOCK is the door that lets batch and reason through and keeps
            the name in File A. The work can finish. The identity does not
            travel.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-paper/85">
            A prompt that says be careful does not hold. Python then checks
            every outbound sentence. After a block, a standing order means the
            name is not proposed again. That is policy on the shared write, not
            a longer chat.
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
            One Flower AgentApp runs the three roles: move, second, chair. The
            ledger lives in Flower Context. SuperGrid is the runtime. The door
            on this page is the live demo.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            {ENDEAVOR_PROOF.label} proposed the sentence on SuperGrid run{" "}
            {ENDEAVOR_PROOF.run}, model {ENDEAVOR_PROOF.model}. Python gated it.
            A human still has to close the record. The name never sat in the
            shared ledger.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Honest limit: today this is application-level isolation, one
            process, two JSON files. In production each firm would run its own
            node.
          </p>
          <a
            href="#incident"
            className="mt-10 inline-block rounded-full bg-accent px-6 py-3 font-medium text-paper"
          >
            Live demo
          </a>
        </div>
      </section>

      <section className="bg-ink px-6 py-20 text-paper md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide md:text-5xl">
            Run the agent on SuperGrid
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-paper/85">
            The door on this page is the demonstration. Flower Endeavor runs in
            the repo root with this command. Each run gets a new SuperGrid id.
          </p>
          <CopyCommand command={SUPERGRID_COMMAND} />
        </div>
      </section>
    </main>
  );
}
