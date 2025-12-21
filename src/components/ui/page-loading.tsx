import { Building2, Cpu } from 'lucide-react';

interface PageLoadingProps {
  text?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function PageLoading({ 
  text = 'Carregando', 
  showText = true,
  size = 'md',
  fullScreen = true 
}: PageLoadingProps) {
  const sizeClasses = {
    sm: {
      container: 'gap-6',
      logo: 'w-16 h-16',
      logoIcon: 'w-8 h-8',
      hexGrid: 'w-32 h-32',
      text: 'text-sm',
      progress: 'w-32',
    },
    md: {
      container: 'gap-10',
      logo: 'w-24 h-24',
      logoIcon: 'w-12 h-12',
      hexGrid: 'w-48 h-48',
      text: 'text-lg',
      progress: 'w-56',
    },
    lg: {
      container: 'gap-12',
      logo: 'w-32 h-32',
      logoIcon: 'w-16 h-16',
      hexGrid: 'w-64 h-64',
      text: 'text-xl',
      progress: 'w-72',
    },
  };

  const s = sizeClasses[size];

  const content = (
    <>
      {/* Animated cyber background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Scanning line effect */}
        <div 
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
          style={{
            animation: 'scanLine 3s ease-in-out infinite',
          }}
        />
        
        {/* Matrix rain effect */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary font-mono text-xs"
              style={{
                left: `${i * 5}%`,
                animation: `matrixRain ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              {[...Array(10)].map((_, j) => (
                <div key={j} style={{ opacity: 1 - j * 0.1 }}>
                  {Math.random() > 0.5 ? '1' : '0'}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Holographic orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'orbFloat 8s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(280 80% 60% / 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'orbFloat 10s ease-in-out infinite reverse',
          }}
        />
        
        {/* Cyber grid */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(217 91% 60%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(217 91% 60%) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'gridPulse 4s ease-in-out infinite',
          }}
        />

        {/* Perspective grid floor */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[40%] opacity-20"
          style={{
            background: `
              linear-gradient(to top, hsl(217 91% 60% / 0.2), transparent),
              repeating-linear-gradient(90deg, hsl(217 91% 60% / 0.1) 0px, hsl(217 91% 60% / 0.1) 1px, transparent 1px, transparent 80px),
              repeating-linear-gradient(0deg, hsl(217 91% 60% / 0.1) 0px, hsl(217 91% 60% / 0.1) 1px, transparent 1px, transparent 40px)
            `,
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom',
          }}
        />
      </div>

      {/* Floating tech particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `techParticle ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            <div 
              className="w-1 h-1 bg-primary rounded-full"
              style={{
                boxShadow: '0 0 10px hsl(217 91% 60%), 0 0 20px hsl(217 91% 60% / 0.5)',
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Loading content */}
      <div className={`relative z-10 flex flex-col items-center ${s.container}`}>
        {/* Futuristic loader container */}
        <div className="relative">
          {/* Hexagonal rotating frame */}
          <svg className={`absolute inset-0 ${s.hexGrid}`} viewBox="0 0 100 100" style={{ margin: '-25%' }}>
            <defs>
              <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(280 80% 60%)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Outer hexagon ring */}
            <polygon
              points="50,2 93,25 93,75 50,98 7,75 7,25"
              fill="none"
              stroke="url(#hexGradient)"
              strokeWidth="0.5"
              opacity="0.3"
              style={{ animation: 'spin 30s linear infinite' }}
            />
            
            {/* Middle hexagon ring */}
            <polygon
              points="50,12 83,30 83,70 50,88 17,70 17,30"
              fill="none"
              stroke="url(#hexGradient)"
              strokeWidth="0.8"
              opacity="0.5"
              filter="url(#glow)"
              style={{ animation: 'spin 20s linear infinite reverse' }}
            />
            
            {/* Inner hexagon ring */}
            <polygon
              points="50,22 73,35 73,65 50,78 27,65 27,35"
              fill="none"
              stroke="url(#hexGradient)"
              strokeWidth="1"
              opacity="0.7"
              filter="url(#glow)"
              style={{ animation: 'spin 15s linear infinite' }}
            />
            
            {/* Energy arc 1 */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(217 91% 60%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 220"
              filter="url(#glow)"
              style={{ animation: 'spin 2s linear infinite' }}
            />
            
            {/* Energy arc 2 */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="hsl(280 80% 60%)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="30 209"
              filter="url(#glow)"
              style={{ animation: 'spin 1.5s linear infinite reverse' }}
            />
            
            {/* Corner nodes */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <circle
                key={i}
                cx={50 + 45 * Math.cos((angle - 90) * Math.PI / 180)}
                cy={50 + 45 * Math.sin((angle - 90) * Math.PI / 180)}
                r="2"
                fill="hsl(217 91% 60%)"
                style={{
                  animation: `nodePulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </svg>

          {/* Center logo */}
          <div 
            className={`relative ${s.logo} rounded-2xl flex items-center justify-center overflow-hidden`}
            style={{
              background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.2), hsl(280 80% 60% / 0.1))',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsl(217 91% 60% / 0.3)',
              boxShadow: `
                0 0 40px hsl(217 91% 60% / 0.3),
                inset 0 0 30px hsl(217 91% 60% / 0.1)
              `,
            }}
          >
            {/* Holographic shimmer */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, hsl(217 91% 60% / 0.2) 50%, transparent 70%)',
                animation: 'hologramShimmer 2s linear infinite',
              }}
            />
            
            {/* Icon with pulse */}
            <div className="relative z-10">
              <Building2 
                className={`${s.logoIcon} text-white`}
                style={{ 
                  filter: 'drop-shadow(0 0 10px hsl(217 91% 60%))',
                  animation: 'iconPulse 2s ease-in-out infinite',
                }} 
              />
            </div>
            
            {/* Tech circuit lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
              <path d="M0,30 L30,30 L40,40 L40,60 L30,70 L0,70" stroke="hsl(217 91% 60%)" strokeWidth="0.5" fill="none" />
              <path d="M100,30 L70,30 L60,40 L60,60 L70,70 L100,70" stroke="hsl(217 91% 60%)" strokeWidth="0.5" fill="none" />
              <circle cx="30" cy="30" r="2" fill="hsl(217 91% 60%)" />
              <circle cx="70" cy="30" r="2" fill="hsl(217 91% 60%)" />
              <circle cx="30" cy="70" r="2" fill="hsl(217 91% 60%)" />
              <circle cx="70" cy="70" r="2" fill="hsl(217 91% 60%)" />
            </svg>
          </div>
        </div>
        
        {/* Loading text with cyber styling */}
        {showText && (
          <div className="flex flex-col items-center gap-6">
            {/* Glitch text effect */}
            <div className="relative">
              <span 
                className={`${s.text} font-medium tracking-[0.3em] uppercase text-white`}
                style={{
                  textShadow: '0 0 20px hsl(217 91% 60% / 0.5)',
                }}
              >
                {text}
              </span>
              
              {/* Blinking cursor */}
              <span 
                className="ml-1 inline-block w-[2px] h-[1em] bg-primary align-middle"
                style={{ animation: 'cursorBlink 1s step-end infinite' }}
              />
            </div>
            
            {/* Progress bar with energy effect */}
            <div className={`${s.progress} relative`}>
              {/* Track */}
              <div 
                className="h-1 bg-white/10 rounded-full overflow-hidden"
                style={{
                  boxShadow: 'inset 0 0 10px hsl(217 91% 60% / 0.1)',
                }}
              >
                {/* Energy flow */}
                <div 
                  className="h-full rounded-full relative"
                  style={{
                    background: 'linear-gradient(90deg, hsl(217 91% 60%), hsl(280 80% 60%), hsl(217 91% 60%))',
                    backgroundSize: '200% 100%',
                    animation: 'energyFlow 1s ease-in-out infinite',
                    boxShadow: '0 0 15px hsl(217 91% 60% / 0.8)',
                    width: '40%',
                  }}
                />
              </div>
              
              {/* Progress percentage */}
              <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-xs font-mono text-primary/70">
                <span style={{ animation: 'percentFlicker 0.5s steps(1) infinite' }}>
                  {Math.floor(Math.random() * 30 + 70)}%
                </span>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-4 text-xs font-mono text-white/40">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  style={{ animation: 'statusPulse 1s ease-in-out infinite' }}
                />
                <span>SISTEMA ONLINE</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-primary" style={{ animation: 'spin 2s linear infinite' }} />
                <span>PROCESSANDO</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(222 47% 6%) 100%)',
        }}
      />

      {/* Custom keyframes */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: -2px; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        
        @keyframes matrixRain {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 10px) scale(1.05); }
        }
        
        @keyframes gridPulse {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.08; }
        }
        
        @keyframes techParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          25% { transform: translateY(-30px) scale(1.5); opacity: 1; }
          50% { transform: translateY(-60px) scale(1); opacity: 0.5; }
          75% { transform: translateY(-30px) scale(0.8); opacity: 0.8; }
        }
        
        @keyframes nodePulse {
          0%, 100% { r: 2; opacity: 0.5; }
          50% { r: 4; opacity: 1; }
        }
        
        @keyframes hologramShimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px hsl(217 91% 60%)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 20px hsl(217 91% 60%)); }
        }
        
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes energyFlow {
          0% { transform: translateX(-100%); background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { transform: translateX(250%); background-position: 0% 50%; }
        }
        
        @keyframes percentFlicker {
          0%, 100% { content: '${Math.floor(Math.random() * 10 + 85)}%'; }
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px hsl(152 69% 42%); }
          50% { opacity: 0.5; box-shadow: 0 0 15px hsl(152 69% 42%); }
        }
      `}</style>
    </>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050508] overflow-hidden relative">
        {content}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050508] overflow-hidden relative min-h-[400px]">
      {content}
    </div>
  );
}

// Inline loading spinner for buttons and small areas - Futuristic style
export function InlineLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="w-5 h-5" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="inlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeOpacity="0.15"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#inlineGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="60 190"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        {/* Inner energy core */}
        <circle
          cx="50"
          cy="50"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.3"
          strokeDasharray="20 106"
          style={{ animation: 'spin 0.8s linear infinite reverse' }}
        />
      </svg>
    </div>
  );
}

// Skeleton loader with futuristic shimmer
export function FuturisticSkeleton({ className = '', variant = 'default' }: { className?: string; variant?: 'default' | 'text' | 'card' }) {
  const baseStyles = "relative overflow-hidden bg-white/5 rounded";
  
  const variantStyles = {
    default: "",
    text: "h-4 w-full",
    card: "h-32 w-full",
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(217 91% 60% / 0.1), transparent)',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
