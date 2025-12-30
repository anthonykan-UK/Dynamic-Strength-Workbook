
import React, { useMemo, useState } from 'react';
import { UserData, Story } from '../types';
import { TRANSLATIONS } from '../translations';
import { BookOpen, Anchor } from 'lucide-react';

interface ConstellationProps {
    userData: UserData;
    language: keyof typeof TRANSLATIONS;
}

export const Constellation: React.FC<ConstellationProps> = ({ userData, language }) => {
    const t = TRANSLATIONS[language];
    const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);

    // Data Processing: Match Stories to Anchors
    const { nodes, links, unconnectedStories } = useMemo(() => {
        const anchors = userData.coreAnchors.filter(Boolean);
        const stories = userData.externalStories;

        const anchorNodes = anchors.map((a, i) => {
            const angle = (i / anchors.length) * 2 * Math.PI - Math.PI / 2;
            return {
                id: `anchor-${i}`,
                name: a,
                type: 'anchor',
                x: 300 + 120 * Math.cos(angle),
                y: 200 + 120 * Math.sin(angle),
            };
        });

        const storyNodes: any[] = [];
        const edges: any[] = [];
        const unconnected: Story[] = [];

        stories.forEach((story, i) => {
            // Find which anchor this story supports
            // Matching Logic: Does the story pattern loosely match the anchor name?
            const matchedAnchorIndex = anchors.findIndex(a => 
                (story.pattern && a.toLowerCase().includes(story.pattern.toLowerCase())) ||
                (story.pattern && story.pattern.toLowerCase().includes(a.toLowerCase()))
            );

            if (matchedAnchorIndex !== -1) {
                // Connected Story Position
                // Add some random jitter around the anchor's "orbit"
                const anchorAngle = (matchedAnchorIndex / anchors.length) * 2 * Math.PI - Math.PI / 2;
                // Offset angle slightly for the story fan-out
                const fanOffset = (Math.random() - 0.5) * 1.5; 
                const radius = 220 + Math.random() * 40;
                
                const sx = 300 + radius * Math.cos(anchorAngle + fanOffset);
                const sy = 200 + radius * Math.sin(anchorAngle + fanOffset);

                const sNode = {
                    id: `story-${i}`,
                    name: story.pattern,
                    text: story.text,
                    type: 'story',
                    x: sx,
                    y: sy,
                    connectedTo: anchors[matchedAnchorIndex]
                };
                storyNodes.push(sNode);
                edges.push({
                    source: anchorNodes[matchedAnchorIndex],
                    target: sNode,
                    anchorName: anchors[matchedAnchorIndex]
                });
            } else {
                unconnected.push(story);
            }
        });

        return {
            nodes: [...anchorNodes, ...storyNodes],
            links: edges,
            unconnectedStories: unconnected
        };
    }, [userData]);

    if (userData.coreAnchors.filter(Boolean).length === 0) {
        return null; 
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
             
             <div className="flex justify-between items-center mb-4 relative z-10">
                 <div>
                     <h3 className="text-white font-bold flex items-center gap-2"><Anchor size={18} className="text-yellow-400"/> {t.constellationTitle}</h3>
                     <p className="text-xs text-slate-400">{t.constellationDesc}</p>
                 </div>
             </div>

             <div className="w-full h-[400px] flex items-center justify-center relative z-10 overflow-hidden">
                 <svg viewBox="0 0 600 400" className="w-full h-full">
                     {/* Lines */}
                     {links.map((link, i) => (
                         <line 
                            key={`link-${i}`}
                            x1={link.source.x} y1={link.source.y}
                            x2={link.target.x} y2={link.target.y}
                            stroke={hoveredAnchor === link.anchorName ? "#6366f1" : "#334155"}
                            strokeWidth={hoveredAnchor === link.anchorName ? 2 : 1}
                            opacity={hoveredAnchor ? (hoveredAnchor === link.anchorName ? 1 : 0.1) : 0.4}
                            className="transition-all duration-300"
                         />
                     ))}

                     {/* Central Star (Center of Gravity) */}
                     <circle cx="300" cy="200" r="2" fill="#fff" opacity="0.2" />

                     {/* Nodes */}
                     {nodes.map((node, i) => {
                         const isAnchor = node.type === 'anchor';
                         const isDimmed = hoveredAnchor && isAnchor && hoveredAnchor !== node.name;
                         const isHighlighted = hoveredAnchor && ((isAnchor && hoveredAnchor === node.name) || (!isAnchor && node.connectedTo === hoveredAnchor));

                         return (
                             <g 
                                key={node.id} 
                                className="cursor-pointer transition-all duration-300"
                                onMouseEnter={() => isAnchor && setHoveredAnchor(node.name)}
                                onMouseLeave={() => isAnchor && setHoveredAnchor(null)}
                                style={{ opacity: isDimmed ? 0.3 : 1 }}
                             >
                                 {isAnchor ? (
                                     <>
                                        <circle 
                                            cx={node.x} cy={node.y} r={isHighlighted ? 8 : 5} 
                                            fill="#fbbf24" 
                                            className="transition-all duration-300 shadow-glow"
                                        />
                                        <circle cx={node.x} cy={node.y} r={isHighlighted ? 15 : 0} fill="#fbbf24" opacity="0.2" className="animate-pulse" />
                                        <text 
                                            x={node.x} y={node.y + 20} 
                                            textAnchor="middle" 
                                            fill={isHighlighted ? "#fff" : "#94a3b8"}
                                            fontSize={isHighlighted ? 12 : 10}
                                            fontWeight={isHighlighted ? "bold" : "normal"}
                                            className="uppercase tracking-wider transition-all duration-300 select-none"
                                        >
                                            {node.name}
                                        </text>
                                     </>
                                 ) : (
                                     <>
                                        <circle 
                                            cx={node.x} cy={node.y} r={3} 
                                            fill={isHighlighted ? "#fff" : "#64748b"}
                                            className="transition-colors duration-300"
                                        />
                                        {isHighlighted && (
                                            <g>
                                                <rect x={node.x + 8} y={node.y - 12} width="120" height="40" rx="4" fill="#0f172a" stroke="#334155" />
                                                <text x={node.x + 14} y={node.y + 4} fill="#cbd5e1" fontSize="9">
                                                    "{node.text.substring(0, 18)}..."
                                                </text>
                                                <text x={node.x + 14} y={node.y - 2} fill="#6366f1" fontSize="8" fontWeight="bold" className="uppercase">
                                                    {node.name}
                                                </text>
                                            </g>
                                        )}
                                     </>
                                 )}
                             </g>
                         );
                     })}
                 </svg>
             </div>

             {unconnectedStories.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-slate-800">
                     <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                         <BookOpen size={12}/> {t.unconnected}
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {unconnectedStories.map((s, i) => (
                             <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700" title={s.text}>
                                 {s.pattern || "?"}
                             </span>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    );
};
