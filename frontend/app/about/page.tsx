import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      
      <div className="pt-16 lg:pt-20 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-gradient">ScienceIP</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing how scientists and researchers transform their discoveries into valuable intellectual property assets.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Every year, groundbreaking research discoveries remain unpublished or underutilized. 
                Our mission is to bridge the gap between scientific innovation and commercial success.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that every research breakthrough deserves the opportunity to become 
                a valuable intellectual property asset that can benefit society and reward inventors.
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-900">AI-Powered Innovation</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
                <div className="text-gray-600">Research Papers Analyzed</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">200+</div>
                  <div className="text-sm text-gray-600">Patents Filed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">$50M+</div>
                  <div className="text-sm text-gray-600">Value Generated</div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Submit Your Research</h3>
                <p className="text-gray-600">
                  Upload your research papers, manuscripts, or technical documents through our secure platform.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Analysis</h3>
                <p className="text-gray-600">
                  Our advanced AI analyzes your research to identify patentable innovations and commercial opportunities.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Patent Filing</h3>
                <p className="text-gray-600">
                  We handle the entire patent filing process with our network of IP attorneys and patent agents.
                </p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">JD</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Dr. Jane Doe</h3>
                <p className="text-primary-600 mb-2">Chief Technology Officer</p>
                <p className="text-gray-600 text-sm">
                  Former research scientist with 15+ years in biotechnology and IP law.
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">JS</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">John Smith</h3>
                <p className="text-primary-600 mb-2">Head of IP Strategy</p>
                <p className="text-gray-600 text-sm">
                  Patent attorney with expertise in scientific IP commercialization.
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">SW</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sarah Wilson</h3>
                <p className="text-primary-600 mb-2">AI Research Lead</p>
                <p className="text-gray-600 text-sm">
                  Machine learning expert specializing in scientific document analysis.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join hundreds of researchers who have successfully converted their discoveries into valuable IP assets.
            </p>
            <a href="/mint" className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors inline-block">
              Start Your IP Journey
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
