'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-white text-xl font-bold hover:text-blue-400 transition-colors">
                Harbor Parking
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-6">Harbor Parking Privacy Policy</h2>
            
            <h3 className="text-xl font-bold text-white mb-4">Introduction</h3>
            <p className="text-gray-300 mb-6">
              Harbor Parking ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SaaS application and related services.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Information We Collect</h3>
            <p className="text-gray-300 mb-4">We collect information you provide directly:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li><strong>Personal details:</strong> Name, email address, postal address, phone number, payment details (including credit card info).</li>
              <li><strong>Vehicle details:</strong> License plate number and related parking information.</li>
              <li><strong>Account information:</strong> Username, passwords, and activity records.</li>
            </ul>
            
            <p className="text-gray-300 mb-4">We also collect data automatically:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li><strong>Usage details:</strong> Access times, IP addresses, browser and device info.</li>
              <li><strong>Cookies and tracking:</strong> Preferences, session data, and analytics for service improvement.</li>
            </ul>
            
            <p className="text-gray-300 mb-6">
              Third-party sources may provide additional data, such as payment processors or integrations for parking services.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">How We Use Information</h3>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li>Provide, operate, and improve Harbor Parking services.</li>
              <li>Manage reservations, billing, and user accounts.</li>
              <li>Communicate important updates and marketing emails (with opt-out options).</li>
              <li>Analyze usage trends and enhance customer experience.</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-4">Disclosure of Information</h3>
            <p className="text-gray-300 mb-4">We may share your information:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li>With service providers for payment, analytics, and support.</li>
              <li>As required by law, legal processes, or to protect rights and property.</li>
              <li>In connection with business transfers or mergers.</li>
            </ul>
            
            <p className="text-gray-300 mb-6">
              No personal data will be sold. Data sharing is limited to necessary parties and purposes.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Data Retention</h3>
            <p className="text-gray-300 mb-6">
              Your data is retained as long as you use Harbor Parking or as required for legal and business purposes. Data related to billing and reservations may be stored longer per accounting or regulatory requirements.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Cookies and Tracking</h3>
            <p className="text-gray-300 mb-6">
              We use cookies and similar technologies for authentication, analytics, and service optimization. You can manage cookie preferences through your browser settings.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Children's Privacy</h3>
            <p className="text-gray-300 mb-6">
              Our service is not intended for users under age 13, and we do not knowingly collect data from children under this age.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Your Rights and Choices</h3>
            <p className="text-gray-300 mb-4">Depending on your region, you have rights to:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li>Access, update, or request deletion of your personal data.</li>
              <li>Withdraw consent or object to data processing.</li>
              <li>Request data portability.</li>
            </ul>
            
            <p className="text-gray-300 mb-6">
              Contact us if you wish to exercise these rights or have privacy concerns.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Data Security</h3>
            <p className="text-gray-300 mb-6">
              We implement security measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Changes to Policy</h3>
            <p className="text-gray-300 mb-6">
              Harbor Parking reserves the right to update this Privacy Policy. Changes will be posted within the app and on our website. Continued use of our services means acceptance of the updated policy.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
            <p className="text-gray-300 mb-6">
              For questions or requests regarding your privacy, contact:
            </p>
            <p className="text-blue-400 mb-6">
              <a href="mailto:yoel@lapscher.com" className="hover:text-blue-300 transition-colors">
                yoel@lapscher.com
              </a>
            </p>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <Link 
                href="/"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
