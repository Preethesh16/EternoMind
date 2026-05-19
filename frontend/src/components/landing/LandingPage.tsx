import { useEffect } from 'react';
import './LandingPage.css';

export function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  useEffect(() => {
    const glow = document.getElementById('cursor-glow');
    let isVisible = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (glow) {
        if (!isVisible) {
          glow.style.opacity = '1';
          isVisible = true;
        }
        requestAnimationFrame(() => {
          glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-page-root relative min-h-screen overflow-x-hidden antialiased">
      {/* Ambient Glow Background */}
      <div className="glow-orb"></div>
      
      {/* Cursor Glow Container */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
        <div 
          id="cursor-glow" 
          style={{
            position: 'absolute', 
            top: '-400px', 
            left: '-400px', 
            width: '800px', 
            height: '800px', 
            background: 'radial-gradient(circle, rgba(26, 79, 216, 0.35) 0%, rgba(26, 79, 216, 0) 70%)', 
            borderRadius: '50%', 
            opacity: 0, 
            transition: 'opacity 0.4s ease', 
            willChange: 'transform'
          }}
        ></div>
      </div>
      
      {/* TopNavBar */}
      <nav 
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 md:px-12 h-20 bg-[#071425]/80 backdrop-blur-xl border-b border-[#434655]/30 opacity-0 animate-slide-up" 
        style={{ animationDelay: '0s' }}
      >
        <div className="flex items-center gap-2">
          <img alt="EternoMind Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjRW8XmvVYcv7PVNRmVz0xML629-PhFG2K6U9JUkgRAGcfLVSMGfFfjgGCQXf4I0nqZiWM0P7iZlZqI8i5aar5m46iFipWycf0dyZI-yTFVjsKgBaDpzhjOrH6lJpdPZsBYoIC1KNokAsOUG4LzAT753gNrxREKPgKYqQzvGPc5UGX-KVp8kNPGzPMxfbXVAdp7hH5V8YrmvTIgxV7gdDibE9rR1o7vf-_c3DCyjzlFiAeAgFl0yYwT8gEP-QNDQ72PZqVS9r8YQ4w"/>
          <span className="text-[24px] font-bold text-[#d7e3fc] tracking-tight" style={{ fontFamily: 'Canela, serif' }}>EternoMind</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a className="text-[14px] text-[#8d90a0] hover:text-[#d7e3fc] transition-colors hover:opacity-80 transition-all font-medium" href="#">Platform</a>
          <a className="text-[14px] text-[#8d90a0] hover:text-[#d7e3fc] transition-colors hover:opacity-80 transition-all font-medium" href="#">Solutions</a>
          <a className="text-[14px] text-[#8d90a0] hover:text-[#d7e3fc] transition-colors hover:opacity-80 transition-all font-medium" href="#">Developers</a>
          <a className="text-[14px] text-[#8d90a0] hover:text-[#d7e3fc] transition-colors hover:opacity-80 transition-all font-medium" href="#">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onSignIn} className="text-[15px] px-4 py-2 rounded-full bg-[#d7e3fc] text-[#071425] hover:bg-[#b6c4ff] transition-colors font-medium">Get Started</button>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-8 md:px-12 flex flex-col items-center justify-center relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center w-full max-w-4xl mx-auto mb-20">
          <div className="mb-6 px-3 py-1 rounded-[2px] bg-[#0B1A3D] border border-[#1E3A6E] flex items-center gap-2 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="w-2 h-2 rounded-full bg-[#1a4fd8] animate-pulse"></span>
            <span className="font-['Canela'] text-[11px] font-semibold uppercase tracking-wider text-[#7BA8E8]">SELF-OPTIMIZING AI RUNTIME</span>
          </div>
          <h1 className="text-[56px] font-bold leading-[1.1] tracking-tight text-[#d7e3fc] mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', fontFamily: 'Canela, serif' }}>
            Your AI runtime gets<br/>
            <span className="text-[#4D9EFF]">Smarter. Cheaper. Faster.</span>
          </h1>
          <p className="text-[17px] font-normal leading-relaxed text-[#A8B4CC] max-w-[520px] mb-10 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s', fontFamily: 'Canela, serif' }}>
            EternoMind learns your project patterns. A highly-optimized, dark-mode-first environment tailored for enterprise-scale AI inference, delivering uncompromising computational power.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={onSignIn}
              className="w-full sm:w-auto text-[15px] px-6 py-3 rounded-full bg-white text-[#04091E] hover:bg-white hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(26,79,216,0.4)] font-medium" 
            >
              Sign In <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Dashboard Mockup */}
        <section className="w-full max-w-5xl mx-auto dashboard-mockup p-6 relative opacity-0 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0F2A7A]/20 via-transparent to-transparent pointer-events-none rounded-2xl"></div>
          {/* Mockup Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-[#152050] pb-4 gap-4 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#434655]"></div>
                <div className="w-3 h-3 rounded-full bg-[#434655]"></div>
                <div className="w-3 h-3 rounded-full bg-[#434655]"></div>
              </div>
              <span className="text-[12px] font-semibold tracking-[0.05em] text-[#7BA8E8]">EternoMind — E-commerce Platform · Session 10</span>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-[10px] text-[#8d90a0] uppercase tracking-wider">Savings</div>
                <div className="text-[16px] font-bold text-[#d7e3fc]">95%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#8d90a0] uppercase tracking-wider">Tokens</div>
                <div className="text-[16px] font-bold text-[#d7e3fc]">89.4K</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#8d90a0] uppercase tracking-wider">Latency</div>
                <div className="text-[16px] font-bold text-[#4D9EFF]">43ms</div>
              </div>
            </div>
          </div>
          {/* Mockup Content Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[12px] font-semibold text-[#8d90a0] border-b border-[#152050]">
                  <th className="py-3 px-4 uppercase tracking-wider">Session</th>
                  <th className="py-3 px-4 uppercase tracking-wider">Tokens Used</th>
                  <th className="py-3 px-4 uppercase tracking-wider">Model</th>
                  <th className="py-3 px-4 uppercase tracking-wider">Memories</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-right">Savings</th>
                </tr>
              </thead>
              <tbody className="text-[16px] text-[#c4c5d7]">
                <tr className="dashboard-row hover:bg-[#1a4fd8]/5 transition-colors">
                  <td className="py-4 px-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#8d90a0]"></span>Session 08</td>
                  <td className="py-4 px-4 font-mono text-sm">124.5K</td>
                  <td className="py-4 px-4">GPT-4-Turbo</td>
                  <td className="py-4 px-4">42</td>
                  <td className="py-4 px-4 text-right">12%</td>
                </tr>
                <tr className="dashboard-row hover:bg-[#1a4fd8]/5 transition-colors">
                  <td className="py-4 px-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#8d90a0]"></span>Session 09</td>
                  <td className="py-4 px-4 font-mono text-sm">102.1K</td>
                  <td className="py-4 px-4">GPT-4-Turbo</td>
                  <td className="py-4 px-4">128</td>
                  <td className="py-4 px-4 text-right">45%</td>
                </tr>
                <tr className="dashboard-row bg-[#1a4fd8]/10 border-l-2 border-[#4D9EFF]">
                  <td className="py-4 px-4 flex items-center gap-2 text-[#d7e3fc]"><span className="w-1.5 h-1.5 rounded-full bg-[#4D9EFF] animate-pulse"></span>Session 10</td>
                  <td className="py-4 px-4 font-mono text-sm text-[#d7e3fc]">89.4K</td>
                  <td className="py-4 px-4 text-[#d7e3fc]">EternoMind-Optimized</td>
                  <td className="py-4 px-4 text-[#d7e3fc]">342</td>
                  <td className="py-4 px-4 text-right font-bold text-[#4D9EFF]">95%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="mt-24 text-center opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <p className="text-[12px] font-semibold text-[#484F58] uppercase tracking-wider mb-6">Powered by</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-[#A8B4CC] font-semibold text-lg opacity-80">
            <span className="trust-logo">Hindsight</span>
            <span className="trust-logo">cascadeflow</span>
            <span className="trust-logo">Groq</span>
            <span className="trust-logo">LangGraph</span>
            <span className="trust-logo">ChromaDB</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-10 px-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-[#434655]/20 bg-[#071425] opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center gap-2 text-[20px] font-bold text-[#d7e3fc]">
          <img alt="EternoMind Logo" className="h-6 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjRW8XmvVYcv7PVNRmVz0xML629-PhFG2K6U9JUkgRAGcfLVSMGfFfjgGCQXf4I0nqZiWM0P7iZlZqI8i5aar5m46iFipWycf0dyZI-yTFVjsKgBaDpzhjOrH6lJpdPZsBYoIC1KNokAsOUG4LzAT753gNrxREKPgKYqQzvGPc5UGX-KVp8kNPGzPMxfbXVAdp7hH5V8YrmvTIgxV7gdDibE9rR1o7vf-_c3DCyjzlFiAeAgFl0yYwT8gEP-QNDQ72PZqVS9r8YQ4w"/>
          EternoMind
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="text-[12px] font-semibold text-[#8d90a0] hover:text-[#b6c4ff] transition-colors opacity-100 hover:opacity-80" href="#">Privacy Policy</a>
          <a className="text-[12px] font-semibold text-[#8d90a0] hover:text-[#b6c4ff] transition-colors opacity-100 hover:opacity-80" href="#">Terms of Service</a>
          <a className="text-[12px] font-semibold text-[#8d90a0] hover:text-[#b6c4ff] transition-colors opacity-100 hover:opacity-80" href="#">Security</a>
          <a className="text-[12px] font-semibold text-[#8d90a0] hover:text-[#b6c4ff] transition-colors opacity-100 hover:opacity-80" href="#">Status</a>
        </div>
        <div className="text-[16px] text-[#8d90a0] font-['Canela']">© 2026 EternoMind Intelligence. All rights reserved.</div>
      </footer>
    </div>
  );
}
