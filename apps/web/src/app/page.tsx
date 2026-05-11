"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Zap, Shield, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-50 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">TeLLM</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it Works</a>
              <Link href="/dashboard" className="hover:text-blue-400 transition-colors">Teacher Dashboard</Link>
            </div>
            <div>
              <Link
                href="/chat"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-900/20"
              >
                Start Learning
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
                <Zap className="w-3 h-3" />
                <span>AI-Powered Socratic Tutoring</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
                Master Subjects Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Critical Thinking</span>
              </h1>
              <p className="text-xl text-slate-400 mb-8 max-w-lg">
                TeLLM doesn't just give answers. It guides you with intelligent hints, asking the right questions to help you figure it out yourself.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/chat"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all transform hover:scale-105 shadow-xl shadow-blue-900/40"
                >
                  Start a Chat Session
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all"
                >
                  Teacher Portal
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p>Trusted by <span className="text-slate-300 font-semibold">2,000+ students</span> in pilot programs.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-blue-500/10">
                <Image
                  src="/hero.png"
                  alt="TeLLM AI Interface"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl max-w-xs hidden sm:block">
                <div className="flex gap-3 items-center mb-2">
                  <div className="bg-green-500/20 p-2 rounded-lg text-green-500">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Learning Progress</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">75% Mastery in Projectile Motion</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-[#03081a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose TeLLM?</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Built on the Socratic method, TeLLM provides a personalized learning experience that fosters long-term retention.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Brain className="w-8 h-8" />,
                  title: "Socratic Method",
                  desc: "Progressive hints (Levels 1-5) that encourage students to solve problems independently."
                },
                {
                  icon: <BookOpen className="w-8 h-8" />,
                  title: "RAG-Powered",
                  desc: "Connected to verified school curriculums and textbooks for accurate, syllabus-aligned help."
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Injection Guard",
                  desc: "Dual-layer security to prevent students from bypassing the tutoring logic."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all"
                >
                  <div className="bg-blue-600/10 w-16 h-16 rounded-xl flex items-center justify-center text-blue-500 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold">TeLLM</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <Link href="#" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-300">Contact</Link>
          </div>
          <p className="text-sm text-slate-500">© 2026 TeLLM EdTech Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
