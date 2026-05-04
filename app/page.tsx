'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, Shield, Zap, PieChart, Target, Bell, BarChart3, Lock, Eye, CheckCircle, ArrowRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import Footer from '@/components/ui/Footer';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Smart Expense Tracking',
    description: 'Track every transaction in real-time. Automatic categorization and smart insights into your spending patterns.',
  },
  {
    icon: Target,
    title: 'Budget Management',
    description: 'Set budgets for each category and get instant alerts when you\'re approaching your limits.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Beautiful, interactive charts showing your spending trends, monthly patterns, and financial progress.',
  },
  {
    icon: PieChart,
    title: 'Savings Goals',
    description: 'Create financial goals and track your progress toward them with visual milestones.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay on top of your finances with timely push notifications about your spending and budgets.',
  },
  {
    icon: Zap,
    title: 'Instant Summaries',
    description: 'Get monthly and yearly spending summaries with insights into your financial behavior.',
  },
];

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'Bank-Level Encryption',
    description: 'Your data is encrypted end-to-end using military-grade encryption standards.',
  },
  {
    icon: Shield,
    title: 'Zero-Knowledge Architecture',
    description: 'We can\'t see your data. All processing happens securely on our servers.',
  },
  {
    icon: Eye,
    title: 'Privacy First',
    description: 'Your financial data is never sold or shared. Complete control over your information.',
  },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gradient">
            Vaultly
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Features
            </a>
            <a href="#security" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Security
            </a>
            <a href="/terms" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Terms
            </a>
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-all"
            >
              Log in
            </Link>
            <Link
              href="/subscribe"
              className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[#0d0a06] rounded-lg hover:bg-[var(--color-accent-hover)] transition-all font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--color-text-primary)]"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
              >
                Features
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
              >
                Security
              </a>
              <a
                href="/terms"
                className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
              >
                Terms
              </a>
              <div className="border-t border-[var(--color-border)] pt-3 mt-3 space-y-2">
                <Link
                  href="/login"
                  className="block text-center px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] rounded-lg border border-[var(--color-border)]"
                >
                  Log in
                </Link>
                <Link
                  href="/subscribe"
                  className="block text-center px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[#0d0a06] rounded-lg font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main content */}
      <div className="flex-1 mt-16">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-[var(--color-accent-dim)] text-[var(--color-accent)] text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
              >
                <Zap size={14} />
                Personal Finance, Simplified
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
                Take Control of Your
                <span className="text-gradient"> Financial Future</span>
              </h1>

              <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
                Vaultly is the premium personal finance app that gives you complete visibility into your spending,
                helps you build budgets that actually work, and empowers you to achieve your financial goals.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/subscribe"
                  className="px-8 py-3 bg-[var(--color-accent)] text-[#0d0a06] rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition-all inline-flex items-center gap-2 text-base"
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-dim)] transition-all text-base"
                >
                  Sign In
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 pt-8 border-t border-[var(--color-border)] grid grid-cols-3 gap-4 sm:gap-8"
              >
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--color-accent)]">100%</p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">Private & Secure</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--color-accent)]">Real-time</p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">Transaction Tracking</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--color-accent)]">0 Ads</p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">Premium Experience</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* What is Vaultly Section */}
        <section className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-surface)]/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                What is Vaultly?
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                Vaultly is your all-in-one personal finance companion. Track expenses, set budgets, achieve goals,
                and understand your spending patterns — all with military-grade security.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true, margin: '-100px' }}
              className="grid md:grid-cols-2 gap-8 lg:gap-12"
            >
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <TrendingUp className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Track Every Transaction
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      See exactly where your money goes. Automatically categorized transactions with detailed insights.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <Target className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Build Smart Budgets
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Set budgets for each category and receive smart alerts before you overspend.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <PieChart className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Achieve Financial Goals
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Create savings goals and watch your progress with visual milestones.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <BarChart3 className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Powerful Analytics
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Beautiful charts and graphs reveal spending patterns and trends at a glance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <Bell className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Smart Notifications
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Get timely alerts about budget limits, unusual spending, and financial milestones.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <Zap className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Financial Summaries
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Comprehensive monthly and yearly reports with actionable insights.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                Powerful Features Built for You
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                Everything you need to take control of your finances, in one intuitive platform.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true, margin: '-100px' }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]/70 hover:border-[var(--color-accent)]/40 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent-dim)]/2 transition-all">
                    <feature.icon className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-surface)]/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-12 sm:mb-16"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-[var(--color-accent-dim)] text-[var(--color-accent)] text-xs font-semibold px-4 py-1.5 rounded-full mb-4"
              >
                <Shield size={14} />
                Enterprise-Grade Security
              </motion.div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                Your Security is Our Priority
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                Your financial data is sensitive. We use bank-level encryption and zero-knowledge architecture
                to ensure your information stays completely private and secure.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true, margin: '-100px' }}
              className="grid md:grid-cols-3 gap-8"
            >
              {SECURITY_FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center mb-4">
                    <feature.icon className="text-[var(--color-accent)]" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[var(--color-accent)] text-sm font-medium">
                    <CheckCircle size={16} />
                    <span>Verified & Certified</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Why Choose Vaultly Section */}
        <section className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                Why Choose Vaultly?
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true, margin: '-100px' }}
              className="grid md:grid-cols-2 gap-6 lg:gap-8"
            >
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">No Ads. No Distractions.</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Pure, premium experience focused entirely on your financial wellness.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Cancel Anytime</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      No long contracts. Monthly or yearly plans with the freedom to cancel whenever you want.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Complete Privacy</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Your data is never sold, shared, or used for advertising purposes.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Lifetime License Option</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Prefer one-time payment? Buy a lifetime license for $400 and own your access forever.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Always Improving</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Regular updates with new features and improvements based on user feedback.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Dedicated Support</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Get help when you need it. Real support from a real person.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: '-100px' }}
              className="relative rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent-dim)] to-[var(--color-surface)] p-8 sm:p-12 text-center overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl -z-10" />

              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                Ready to Take Control of Your Finances?
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
                Join Vaultly today and start your journey toward financial clarity and confidence.
              </p>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/subscribe"
                  className="px-8 py-3 bg-[var(--color-accent)] text-[#0d0a06] rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition-all inline-flex items-center gap-2 text-base"
                >
                  Subscribe
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 border border-[var(--color-accent)] text-[var(--color-accent)] rounded-lg font-semibold hover:bg-[var(--color-accent)]/10 transition-all text-base"
                >
                  Already Have Account?
                </Link>
              </motion.div>

              <p className="text-sm text-[var(--color-text-muted)] mt-6">
                Subscribe today and access all features immediately.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
