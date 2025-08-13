import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { Users, Target, Lightbulb, Heart, Award, Globe } from 'lucide-react';

export const About = () => {
  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Mission-Driven',
      description: 'We exist to empower teams and individuals to build exceptional products that make a real difference.',
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: 'Innovation First',
      description: 'We push boundaries and embrace new technologies to deliver cutting-edge solutions.',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Human-Centered',
      description: 'Every decision we make prioritizes the human experience and genuine user needs.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Impact',
      description: 'We build tools that scale globally while respecting local cultures and contexts.',
    },
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Founder',
      bio: '15+ years building products at scale. Former VP of Engineering at TechCorp.',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO',
      bio: 'Full-stack architect with expertise in scalable systems and developer experience.',
    },
    {
      name: 'Emily Watson',
      role: 'Head of Design',
      bio: 'Design leader passionate about creating intuitive and accessible user experiences.',
    },
    {
      name: 'David Kim',
      role: 'Head of Product',
      bio: 'Product strategist focused on turning customer insights into impactful features.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-primary-100/30 dark:from-primary-900/20 dark:to-primary-800/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Building the{' '}
                <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                  future
                </span>{' '}
                together
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                We're a passionate team of builders, designers, and thinkers dedicated to creating tools that help teams accomplish extraordinary things.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  Studio45 was born from a simple observation: great teams deserve great tools. After years of working with complex, fragmented systems that hindered rather than helped, we set out to build something different.
                </p>
                <p>
                  Founded in 2023, we've grown from a small team of three to a global community of developers, designers, and creators who share our vision of making powerful tools accessible to everyone.
                </p>
                <p>
                  Today, we're proud to serve thousands of teams worldwide, from startups to enterprises, helping them streamline their workflows and build better products faster.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-3xl transform rotate-3 opacity-20" />
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Award className="w-8 h-8 text-primary-600" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Est. 2023</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                      <span className="font-bold text-2xl text-gray-900 dark:text-white">50K+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Countries</span>
                      <span className="font-bold text-2xl text-gray-900 dark:text-white">45+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Projects Created</span>
                      <span className="font-bold text-2xl text-gray-900 dark:text-white">1M+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The principles that guide everything we do and every decision we make.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="group">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-105 h-full">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The passionate individuals behind Studio45, working together to build something extraordinary.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="group">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-105 text-center h-full flex flex-col">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400 text-sm font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to join our journey?
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Whether you're looking to build with us or join our team, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Get Started Today
              </Button>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white/10">
                We're Hiring
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};