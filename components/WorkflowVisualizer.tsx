import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Trail, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { CircleDashed, Search, Lightbulb, Hammer, BrainCircuit, ArrowRight, Quote } from 'lucide-react';
import clsx from 'clsx';

// Fix for TypeScript errors regarding R3F intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      icosahedronGeometry: any;
      meshStandardMaterial: any;
      pointLight: any;
      ambientLight: any;
    }
  }
}

// --- 3D COMPONENTS ---

const AgentCore = ({ phase }: { phase: 'analysis' | 'strategy' | 'execution' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const color = useMemo(() => {
      switch(phase) {
          case 'analysis': return '#3b82f6'; // Blue
          case 'strategy': return '#a855f7'; // Purple
          case 'execution': return '#22c55e'; // Green
          default: return '#64748b';
      }
  }, [phase]);

  useFrame((state) => {
      if (!meshRef.current) return;
      // Rotate
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.015;
      
      // Pulse scale based on time
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Trail width={1.2} length={6} color={new THREE.Color(color)} attenuation={(t) => t * t}>
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[1.2, 0]} />
                <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={2}
                    wireframe={true}
                    transparent={true}
                    opacity={0.8}
                />
            </mesh>
        </Trail>
        {/* Inner solid core */}
        <mesh>
             <icosahedronGeometry args={[0.5, 2]} />
             <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <pointLight color={color} intensity={5} distance={10} />
    </Float>
  );
};

const Scene = ({ phase }: { phase: 'analysis' | 'strategy' | 'execution' }) => {
    return (
        <>
            <ambientLight intensity={0.2} />
            <Stars radius={50} depth={20} count={1000} factor={3} saturation={0} fade speed={1} />
            <AgentCore phase={phase} />
            <Sparkles count={20} scale={4} size={2} speed={0.4} opacity={0.5} color={phase === 'execution' ? '#86efac' : '#93c5fd'} />
        </>
    );
};


// --- UI COMPONENT ---

interface WorkflowVisualizerProps {
  thoughts: string;
}

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ thoughts }) => {
  const lines = thoughts.split('\n');
  const items: Array<{ type: 'header' | 'step' | 'text', content: string, phase?: 'analysis' | 'strategy' | 'execution' }> = [];

  let currentPhase: 'analysis' | 'strategy' | 'execution' = 'analysis';

  lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const lower = trimmed.toLowerCase();
      // Heuristics for phase detection
      if ((lower.includes('analy') || lower.includes('check') || lower.includes('read')) && (trimmed.startsWith('#') || trimmed.startsWith('**') || trimmed.startsWith('1.'))) {
          currentPhase = 'analysis';
          if (trimmed.startsWith('#') || trimmed.startsWith('**')) {
               items.push({ type: 'header', content: 'Analysis & Research', phase: 'analysis' });
               return;
          }
      }
      if ((lower.includes('plan') || lower.includes('strateg') || lower.includes('design')) && (trimmed.startsWith('#') || trimmed.startsWith('**') || trimmed.startsWith('2.'))) {
          currentPhase = 'strategy';
          if (trimmed.startsWith('#') || trimmed.startsWith('**')) {
              items.push({ type: 'header', content: 'Strategic Planning', phase: 'strategy' });
              return;
          }
      }
      if ((lower.includes('execut') || lower.includes('writ') || lower.includes('creat')) && (trimmed.startsWith('#') || trimmed.startsWith('**') || trimmed.startsWith('3.'))) {
          currentPhase = 'execution';
          if (trimmed.startsWith('#') || trimmed.startsWith('**')) {
              items.push({ type: 'header', content: 'Execution & Implementation', phase: 'execution' });
              return;
          }
      }

      // Detect List Items as Steps
      const isStep = /^(\d+[\.\)]|\-|\*)\s/.test(trimmed);
      if (isStep) {
          items.push({ 
              type: 'step', 
              content: trimmed.replace(/^(\d+[\.\)]|\-|\*)\s/, '').trim(),
              phase: currentPhase
          });
      } else {
          // Detect reasoning phrases to highlight
          const content = trimmed.replace(/^[\>\s]+/, ''); // remove blockquote indicators
          items.push({ type: 'text', content: content, phase: currentPhase });
      }
  });

  // Determine active phase for 3D engine based on the LAST item processed
  const activePhase = items.length > 0 ? items[items.length - 1].phase || 'analysis' : 'analysis';

  const getPhaseIcon = (phase: string) => {
      switch(phase) {
          case 'analysis': return <Search size={14} className="text-blue-400" />;
          case 'strategy': return <Lightbulb size={14} className="text-purple-400" />;
          case 'execution': return <Hammer size={14} className="text-green-400" />;
          default: return <CircleDashed size={14} />;
      }
  };

  const getPhaseColor = (phase: string) => {
      switch(phase) {
          case 'analysis': return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
          case 'strategy': return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
          case 'execution': return 'border-green-500/30 bg-green-500/10 text-green-300';
          default: return 'border-gray-500/30 bg-gray-500/10 text-gray-300';
      }
  };

  return (
    <div className="flex flex-col bg-neutral-900 border-t border-neutral-800">
        {/* Header / 3D Visualization Area */}
        <div className="h-32 w-full relative bg-black/50 overflow-hidden border-b border-neutral-800">
             <div className="absolute inset-0 z-0">
                 <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                     <Scene phase={activePhase} />
                 </Canvas>
             </div>
             <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
                 <div className="px-2 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-white/70 flex items-center gap-2 backdrop-blur-sm">
                     <BrainCircuit size={12} className={activePhase === 'analysis' ? 'text-blue-400' : activePhase === 'strategy' ? 'text-purple-400' : 'text-green-400'} />
                     <span>NEURAL ENGINE ACTIVE</span>
                 </div>
             </div>
             <div className="absolute bottom-2 right-4 z-10 text-[10px] font-mono text-white/40">
                 Current Phase: {activePhase.toUpperCase()}
             </div>
        </div>

        {/* Steps List */}
        <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
             {items.map((item, idx) => {
                 const style = getPhaseColor(item.phase || 'analysis');
                 
                 if (item.type === 'header') {
                     return (
                         <div key={idx} className="flex items-center gap-3 animate-fade-in">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center border backdrop-blur-sm shadow-sm ${style}`}>
                                 {getPhaseIcon(item.phase || 'analysis')}
                             </div>
                             <div className="h-px flex-1 bg-neutral-800" />
                             <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{item.content}</span>
                         </div>
                     );
                 }
                 
                 if (item.type === 'step') {
                     return (
                         <div key={idx} className="flex gap-3 ml-4 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                             <div className="flex flex-col items-center">
                                 <div className={`w-2 h-2 rounded-full mt-1.5 ${style.split(' ')[0].replace('/30','')} bg-current opacity-70`} />
                                 {idx < items.length - 1 && <div className="w-px h-full bg-neutral-800 my-1" />}
                             </div>
                             <div className="flex-1 pb-2">
                                 <p className="text-sm text-gray-300 leading-relaxed font-medium">{item.content}</p>
                             </div>
                         </div>
                     );
                 }
                 
                 // Reasoning Text
                 return (
                     <div key={idx} className="ml-9 mb-2 animate-fade-in">
                        <div className="bg-neutral-800/40 rounded-md p-3 border-l-2 border-neutral-700">
                             <div className="flex items-start gap-2">
                                 <Quote size={12} className="text-neutral-500 shrink-0 mt-0.5" />
                                 <p className="text-xs text-neutral-400 italic leading-relaxed font-mono">
                                     {item.content}
                                 </p>
                             </div>
                        </div>
                     </div>
                 );
             })}
             
             {/* Dynamic Loading Indicator at bottom if still processing (implied by this component being rendered during stream) */}
             <div className="ml-9 flex items-center gap-2 opacity-50">
                 <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" />
                 <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse delay-100" />
                 <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse delay-200" />
             </div>
        </div>
    </div>
  );
};

export default WorkflowVisualizer;