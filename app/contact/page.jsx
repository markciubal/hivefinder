import React from "react";
import PageShell from "../components/layout/PageShell";

export const metadata = { title: "Contact | HiveFinder" };

export default function ContactPage() {
  return (
    <PageShell
      title="Contact us"
      description="Questions about a club, your account, or something that looks broken? Reach out."
      width="md"
    >
      <div>
        <section className="hf-card p-6">
          <h2 className="text-lg font-bold text-black">Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            The fastest way to reach the HiveFinder team.
          </p>
          <a
            href="mailto:support@hivefinder.com"
            className="hf-btn hf-btn-primary mt-4"
          >
            support@hivefinder.com
          </a>
        </section>

      </div>

      <section className="hf-card mt-6 p-6">
        <h2 className="text-lg font-bold text-black">Common questions</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-black">
              Do I need an account to browse?
            </dt>
            <dd className="mt-1 text-gray-600">
              No. Browsing clubs is open to everyone, and the rest of the app
              can be previewed with sample data before you sign up.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-black">
              How do I get my club listed?
            </dt>
            <dd className="mt-1 text-gray-600">
              Official club listings come from Sacramento State&apos;s roster of
              recognized organizations, so they are not created here — and
              joining, members and events for them all happen on the
              university&apos;s CampusGroups site. HiveFinder is a directory that
              points you there. If your club&apos;s listing is missing or out of
              date, email us and we will fix it.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-black">
              What is a hive?
            </dt>
            <dd className="mt-1 text-gray-600">
              A hive is a group a student started inside HiveFinder — a study
              crew, a weekly run, a game night. Anyone signed in can create one.
              Hives are listed separately from official clubs and carry no
              university affiliation.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-black">
              Something looks wrong on a club page.
            </dt>
            <dd className="mt-1 text-gray-600">
              Email us with the club name and we will sort it out with the
              club officers.
            </dd>
          </div>
        </dl>
      </section>
    </PageShell>
  );
}
