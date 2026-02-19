import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Landing() {
  const { user } = useAuthStore();
  const isClient = user?.user_type === 'client';
  const isHauler = user?.user_type === 'hauler';

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">

      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section className="relative bg-navy-900 overflow-hidden">
        {/* Radial brand-glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(2,132,199,0.25) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-28 sm:py-36 text-center">
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Get any physical job done.
            <br />
            <span className="text-brand-400">Find a trusted Hauler.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-navy-300 max-w-2xl mx-auto leading-relaxed">
            HaulHub connects people who need help with skilled Haulers. Post a
            job or pick up work — it&apos;s that simple.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!user && (
              <>
                <Link
                  to="/register"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-500 transition-all duration-150"
                >
                  Post a Job
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all duration-150"
                >
                  Find Work
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </>
            )}
            {isClient && (
              <Link
                to="/jobs/new"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-500 transition-all duration-150"
              >
                Post a Job
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
            {isHauler && (
              <Link
                to="/board"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-500 transition-all duration-150"
              >
                Browse Jobs
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-navy-300">
            {[
              'Free to join',
              'Secure escrow payments',
              'Verified haulers',
            ].map((label) => (
              <span key={label} className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-brand-400 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Stats Strip ──────────────────────────────────────────── */}
      <section className="bg-navy-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Jobs Posted' },
              { value: '200+', label: 'Verified Haulers' },
              { value: '4.9★', label: 'Avg Rating' },
              { value: '100%', label: 'Secure Escrow' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-navy-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How it Works ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-navy-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white text-center">
            How HaulHub Works
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Clients */}
            <div>
              <h3 className="text-lg font-bold text-brand-600 uppercase tracking-widest mb-8">
                For Clients
              </h3>
              <ol className="space-y-7">
                {[
                  {
                    n: 1,
                    title: 'Post a Job',
                    desc: 'Describe what you need done, set your budget, and choose a date.',
                  },
                  {
                    n: 2,
                    title: 'Review Applicants',
                    desc: 'Browse Hauler profiles, ratings, and bids to find the right fit.',
                  },
                  {
                    n: 3,
                    title: 'Accept & Pay (Escrow)',
                    desc: 'Confirm a Hauler and funds are securely held in escrow until the job is done.',
                  },
                  {
                    n: 4,
                    title: 'Mark Complete',
                    desc: 'Approve the work to release payment and leave a review.',
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-5">
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {step.n}
                    </span>
                    <div>
                      <p className="font-semibold text-navy-900 dark:text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-navy-500 dark:text-navy-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* For Haulers */}
            <div>
              <h3 className="text-lg font-bold text-brand-400 uppercase tracking-widest mb-8">
                For Haulers
              </h3>
              <ol className="space-y-7">
                {[
                  {
                    n: 1,
                    title: 'Create Profile',
                    desc: 'Sign up, add your skills, vehicle details, and get verified.',
                  },
                  {
                    n: 2,
                    title: 'Browse Job Board',
                    desc: 'Explore jobs near you filtered by category, pay, and date.',
                  },
                  {
                    n: 3,
                    title: 'Apply to Jobs',
                    desc: 'Submit your bid and message the client directly.',
                  },
                  {
                    n: 4,
                    title: 'Get Paid to Wallet',
                    desc: 'Once the job is marked complete, funds are released to your HaulHub wallet.',
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-5">
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-400 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {step.n}
                    </span>
                    <div>
                      <p className="font-semibold text-navy-900 dark:text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-navy-500 dark:text-navy-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Category Grid ─────────────────────────────────────────── */}
      <section className="bg-navy-50 dark:bg-navy-800/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white text-center">
            What can Haulers help with?
          </h2>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Furniture Moving',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                ),
              },
              {
                label: 'Junk Removal',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                ),
              },
              {
                label: 'Appliance Install',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                ),
              },
              {
                label: 'Assembly',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                ),
              },
              {
                label: 'Heavy Lifting',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                ),
              },
              {
                label: 'Packing',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                ),
              },
              {
                label: 'Storage Help',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                ),
              },
              {
                label: 'Other Physical Work',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                ),
              },
            ].map((cat) => (
              <div
                key={cat.label}
                className="cursor-pointer flex flex-col items-center gap-3 rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 text-center hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10 text-brand-600 dark:text-brand-400"
                >
                  {cat.svg}
                </svg>
                <span className="text-sm font-semibold text-navy-700 dark:text-navy-200 leading-snug">
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Trust & Safety ───────────────────────────────────────── */}
      <section className="bg-white dark:bg-navy-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white text-center">
            Built for trust and safety
          </h2>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                title: 'Secure Escrow',
                desc: 'Funds are held safely until the job is complete. No disputes about payment.',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                ),
              },
              {
                title: 'Verified Haulers',
                desc: 'Every Hauler profile is reviewed before they can accept work on the platform.',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                ),
              },
              {
                title: 'Transparent Reviews',
                desc: 'Real reviews from real clients — so you always know who you are hiring.',
                svg: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                ),
              },
            ].map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-7 h-7 text-brand-600 dark:text-brand-400"
                  >
                    {feature.svg}
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-navy-900 dark:text-white text-lg">{feature.title}</p>
                  <p className="mt-2 text-sm text-navy-500 dark:text-navy-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Bottom CTA ───────────────────────────────────────────── */}
      <section className="bg-navy-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-navy-400 text-lg">
            Join HaulHub free. No platform fees during our launch period.
          </p>

          <div className="mt-10">
            {!user && (
              <Link
                to="/register"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-brand-500 transition-all duration-150"
              >
                Create your free account
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
            {isClient && (
              <Link
                to="/jobs/new"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-brand-500 transition-all duration-150"
              >
                Post a Job
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
            {isHauler && (
              <Link
                to="/board"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-brand-500 transition-all duration-150"
              >
                Browse Jobs
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
