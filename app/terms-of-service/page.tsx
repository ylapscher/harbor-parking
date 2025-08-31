'use client'

import Link from 'next/link'

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-6">Harbor Parking Terms of Service</h2>
            
            <h3 className="text-xl font-bold text-white mb-4">Introduction</h3>
            <p className="text-gray-300 mb-6">
              Welcome to <strong>Harbor Parking</strong> ("Service," "we," "us," or "our"). These Terms of Service ("Terms") govern access and use of the Harbor Parking mobile and web application for resident coordination of guest parking in multi-unit buildings. Use of the Service constitutes acceptance of these Terms.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Account Registration</h3>
            <p className="text-gray-300 mb-6">
              Residents must register an account to access Service features, including claiming guest parking spots and receiving notifications. Account holders are responsible for providing current, accurate information and maintaining the confidentiality of their login credentials.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Service Description</h3>
            <p className="text-gray-300 mb-4">Harbor Parking facilitates:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li>Viewing available guest parking spots.</li>
              <li>Receiving notifications and reminders via SMS or app.</li>
              <li>Claiming and confirming parking reservations.</li>
              <li>Managing expiring reservations with automated reminders.</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-4">Acceptable Use</h3>
            <p className="text-gray-300 mb-4">Using Harbor Parking, residents are expected to:</p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li>Follow all building and Service rules concerning parking access and guest visitor limits.</li>
              <li>Only claim parking spots authorized for their building.</li>
              <li>Not misrepresent information or attempt to claim more spots than allowed.</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-4">Reservation and Notifications</h3>
            <p className="text-gray-300 mb-6">
              Parking availability is determined by Harbor Parking algorithms and building management. Users must confirm claimed spots promptly and respond to automated reminders regarding expiring reservations for timely compliance.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Fees and Payment</h3>
            <p className="text-gray-300 mb-6">
              Applicable fees for guest parking may be charged according to building policy or Harbor Parking arrangements. Users are responsible for paying billed amounts, including any fines for overstaying or violation. All payments processed are subject to the published payment and refund policies.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Termination</h3>
            <p className="text-gray-300 mb-6">
              Accounts may be suspended or terminated for violation of these Terms, building policy, or misuse of the Service. Users may delete accounts at any time.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Intellectual Property</h3>
            <p className="text-gray-300 mb-6">
              All app content, software, and designs are property of Harbor Parking and may not be copied, modified, or used without written permission.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Limitation of Liability</h3>
            <p className="text-gray-300 mb-6">
              Harbor Parking is provided "as is." No liability is assumed for parking availability, disputes, property loss/damage, or missed notifications. Your sole remedy for dissatisfaction is discontinuing Service use.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Privacy and Communications</h3>
            <p className="text-gray-300 mb-6">
              Use of Harbor Parking is governed by our Privacy Policy. Users consent to receive automated SMS and app notifications for service and reservation management.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Changes to Terms</h3>
            <p className="text-gray-300 mb-6">
              We reserve the right to modify Service features, terms, and conditions at any time. Updates are effective when posted; continued use reflects acceptance.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Governing Law</h3>
            <p className="text-gray-300 mb-6">
              These Terms are governed by the laws of the jurisdiction where the building is located.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
            <p className="text-gray-300 mb-6">
              For questions or requests, please contact:
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
