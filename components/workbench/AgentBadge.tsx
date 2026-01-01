import React from 'react';
import { AgentProfile } from '../../types';
import { BrainCircuit, Code2, Map, Stethoscope, Palette } from 'lucide-react';

const icons: any = { BrainCircuit, Code2, Map, Stethoscope, Palette };

export const AgentBadge: React.FC<{ profile: AgentProfile, compact?: boolean }> = ({ profile, compact }) => {
    const Icon = icons[profile.icon] || BrainCircuit;
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500`} 
             style={{ borderColor: `${profile.color}40`, backgroundColor: `${profile.color}10`, color: profile.color }}>
            <Icon size={compact ? 14 : 16} />
            {!compact && <span className="text-xs font-bold leading-none">{profile.name}</span>}
        </div>
    );
};
