import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const categories = [
  { icon: '🛋️', label: 'Furniture Moving' },
  { icon: '🗑️', label: 'Junk Removal' },
  { icon: '🔌', label: 'Appliance Install' },
  { icon: '🔧', label: 'Assembly' },
  { icon: '📦', label: 'Heavy Lifting' },
  { icon: '📦', label: 'Packing' },
  { icon: '🏠', label: 'Storage Help' },
  { icon: '💪', label: 'Other Physical Work' },
]

export default function Landing() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
          Get any physical job done.<br />
          <span className="text-brand-200">Find a trusted Hauler today.</span>
        </h1>
        <p className="text-lg text-brand-100 mb-8 max-w-xl mx-auto">
          HaulHub connects people who need physical help with skilled Haulers in their area. Post a job or pick up work — it's that simple.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated && user ? (
            <>
              {user.user_type === 'client' ? (
                <Link to="/jobs/new" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3">
                  Post a Job
                </Link>
              ) : (
                <Link to="/board" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3">
                  Browse Jobs
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/register" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3">
                I need help →
              </Link>
              <Link to="/register" className="btn-secondary border-white text-white hover:bg-brand-600 text-base px-6 py-3">
                I'm a Hauler →
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-brand-700 mb-6">For Clients</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Post a Job', desc: 'Describe what you need done, set a budget, and pick a date.' },
                  { step: '2', title: 'Review Haulers', desc: 'Haulers apply to your job. Review their profiles and proposals.' },
                  { step: '3', title: 'Accept & Pay', desc: 'Accept the best Hauler. Funds are held securely in escrow.' },
                  { step: '4', title: 'Job Done', desc: 'Mark the job complete to release payment. Leave a review.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-brand-700 mb-6">For Haulers</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Create a Profile', desc: 'Set up your Hauler profile with your skills and experience.' },
                  { step: '2', title: 'Browse Jobs', desc: 'See all open jobs posted by clients in one place.' },
                  { step: '3', title: 'Apply to Jobs', desc: 'Send a proposal to jobs that interest you.' },
                  { step: '4', title: 'Get Paid', desc: 'Complete the job and get paid directly to your HaulHub wallet.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">What can Haulers help with?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map(({ icon, label }) => (
              <div key={label} className="card text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{icon}</div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-brand-700 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-brand-100 mb-8">Join HaulHub for free. No platform fees during our launch period.</p>
        <Link to="/register" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-3">
          Create your free account
        </Link>
      </section>
    </div>
  )
}
