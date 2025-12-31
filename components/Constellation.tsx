
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserData, Story } from '../types';
import { TRANSLATIONS } from '../translations';
import { BookOpen, Anchor, X } from 'lucide-react';

interface ConstellationProps {
    userData: UserData;
    language: keyof typeof TRANSLATIONS;
}

export const Constellation: React.FC<ConstellationProps> = ({ userData, language }) => {
    const t = TRANSLATIONS[language];
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive Check
    const isMobile = containerWidth < 600;

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Data Processing: Layout Logic
    const { nodes, links, unconnectedStories, svgHeight } = useMemo(() => {
        const anchors = userData.coreAnchors.filter(Boolean);
        // FIX: Use evidenceBank and add fallback to empty array
        const stories = userData.evidenceBank || [];
        
        // --- LAYOUT CONFIGURATION ---
        // Mobile: Vertical Stack (Totem). Desktop: Circular Orbit.
        const CENTER_X = isMobile ? containerWidth / 2 : 300;
        const ANCHOR_SPACING = isMobile ? 180 : 0; // Vertical space between anchors on mobile
        // Increased buffer at bottom for the popover on the last item
        const BASE_HEIGHT = isMobile ? (anchors.length * ANCHOR_SPACING) + 350 : 500;
        
        const anchorNodes = anchors.map((a, i) => {
            let x, y;
            if (isMobile) {
                // Vertical Stack
                x = CENTER_X;
                y = 100 + (i * ANCHOR_SPACING);
            } else {
                // Circular Orbit
                const angle = (i / anchors.length) * 2 * Math.PI - Math.PI / 2;
                x = 300 + 120 * Math.cos(angle);
                y = 200 + 120 * Math.sin(angle);
            }
            return {
                id: `anchor-${i}`,
                name: a,
                type: 'anchor',
                x,
                y,
            };
        });

        const storyNodes: any[] = [];
        const edges: any[] = [];
        const unconnected: Story[] = [];

        stories.forEach((story, i) => {
            const matchedAnchorIndex = anchors.findIndex(a => 
                (story.pattern && a.toLowerCase().includes(story.pattern.toLowerCase())) ||
                (story.pattern && story.pattern.toLowerCase().includes(a.toLowerCase()))
            );

            if (matchedAnchorIndex !== -1) {
                const parentAnchor = anchorNodes[matchedAnchorIndex];
                
                // Position story relative to parent anchor
                let sx, sy;
                
                if (isMobile) {
                    // Mobile: Constrained Orbit around the stack
                    // Alternating sides or random spread
                    const angle = (Math.random() * Math.PI) + (i % 2 === 0 ? 0 : Math.PI); // Left or Right semi-circle
                    const radius = 60 + Math.random() * 40;
                    sx = parentAnchor.x + radius * Math.cos(angle);
                    sy = parentAnchor.y + radius * Math.sin(angle);
                    
                    // Keep within bounds
                    sx = Math.max(20, Math.min(containerWidth - 20, sx));
                } else {
                    // Desktop: Fan out outwards
                    const anchorAngle = (matchedAnchorIndex / anchors.length) * 2 * Math.PI - Math.PI / 2;
                    const fanOffset = (Math.random() - 0.5) * 1.5; 
                    const radius = 220 + Math.random() * 40;
                    sx = 300 + radius * Math.cos(anchorAngle + fanOffset);
                    sy = 200 + radius * Math.sin(anchorAngle + fanOffset);
                }

                const sNode = {
                    id: `story-${i}`,
                    name: story.pattern,
                    text: story.text,
                    type: 'story',
                    x: sx,
                    y: sy,
                    connectedTo: anchors[matchedAnchorIndex],
                    connectedToId: `anchor-${matchedAnchorIndex}`
                };
                storyNodes.push(sNode);
                edges.push({
                    source: parentAnchor,
                    target: sNode,
                    anchorId: parentAnchor.id
                });
            } else {
                unconnected.push(story);
            }
        });

        return {
            nodes: [...anchorNodes, ...storyNodes],
            links: edges,
            unconnectedStories: unconnected,
            svgHeight: BASE_HEIGHT
        };
    }, [userData, isMobile, containerWidth]);

    const activeNodeData = useMemo(() => {
        if (!activeNodeId) return null;
        return nodes.find(n => n.id === activeNodeId);
    }, [activeNodeId, nodes]);

    if (userData.coreAnchors.filter(Boolean).length === 0) {
        return null; 
    }

    const handleNodeClick = (id: string) => {
        if (activeNodeId === id) setActiveNodeId(null);
        else setActiveNodeId(id);
    };

    return (
        <div ref={containerRef} className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 relative overflow-hidden flex flex-col">
             {/* Background Decoration */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                     <h3 className="text-white font-bold flex items-center gap-2"><Anchor size={18} className="text-yellow-400"/> {t.constellationTitle}</h3>
                     <p className="text-xs text-slate-400 mt-1">{isMobile ? "Tap stars to see details" : t.constellationDesc}</p>
                 </div>
             </div>

             <div className="w-full relative z-10 transition-all duration-500 ease-in-out" style={{ height: svgHeight }}>
                 <svg width="100%" height="100%" viewBox={`0 0 ${containerWidth || 600} ${svgHeight}`} className="overflow-visible">
                     {/* Lines */}
                     {links.map((link, i) => {
                         const isActive = activeNodeId && (activeNodeId === link.anchorId || activeNodeId === link.target.id);
                         return (
                             <line 
                                key={`link-${i}`}
                                x1={link.source.x} y1={link.source.y}
                                x2={link.target.x} y2={link.target.y}
                                stroke={isActive ? "#fbbf24" : "#334155"}
                                strokeWidth={isActive ? 2 : 1}
                                opacity={isActive ? 0.8 : 0.3}
                                className="transition-all duration-300"
                             />
                         );
                     })}

                     {/* Nodes */}
                     {nodes.map((node, i) => {
                         const isAnchor = node.type === 'anchor';
                         const isActive = activeNodeId === node.id;
                         const isRelated = activeNodeId && !isAnchor && node.connectedToId === activeNodeId;
                         
                         const isHighlighted = isActive || (isAnchor && activeNodeId && nodes.find(n => n.id === activeNodeId)?.connectedToId === node.id);

                         return (
                             <g 
                                key={node.id} 
                                className="cursor-pointer transition-all duration-300"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNodeClick(node.id);
                                }}
                             >
                                 {/* Invisible Hit Area - Increased size for easier tapping */}
                                 <circle cx={node.x} cy={node.y} r={45} fill="transparent" />

                                 {isAnchor ? (
                                     <>
                                        <circle 
                                            cx={node.x} cy={node.y} r={isActive ? 25 : 0} 
                                            fill="#fbbf24" opacity="0.1" className="animate-pulse" 
                                        />
                                        {/* Main Anchor Circle - Larger */}
                                        <circle 
                                            cx={node.x} cy={node.y} r={isActive ? 12 : 9} 
                                            fill="#fbbf24" 
                                            stroke={isActive ? "#fff" : "none"}
                                            strokeWidth={2}
                                            className="transition-all duration-300 shadow-glow"
                                        />
                                        <text 
                                            x={node.x} y={node.y + 30} 
                                            textAnchor="middle" 
                                            fill={isActive ? "#fbbf24" : "#94a3b8"}
                                            fontSize={isMobile ? 14 : 12}
                                            fontWeight={isActive ? "bold" : "normal"}
                                            className="uppercase tracking-wider transition-all duration-300 select-none pointer-events-none"
                                            style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
                                        >
                                            {node.name}
                                        </text>
                                     </>
                                 ) : (
                                     <>
                                        {/* Story Circle - Larger */}
                                        <circle 
                                            cx={node.x} cy={node.y} r={isActive ? 9 : 6} 
                                            fill={isActive ? "#fff" : "#64748b"}
                                            className="transition-colors duration-300"
                                        />
                                        {!isMobile && isActive && (
                                            <text x={node.x + 12} y={node.y + 4} fill="#cbd5e1" fontSize="10" className="pointer-events-none">
                                                {node.name}
                                            </text>
                                        )}
                                     </>
                                 )}
                             </g>
                         );
                     })}
                 </svg>

                 {/* Detail Panel Overlay - Positioned Relative to Node */}
                 {activeNodeData && (
                     <div 
                        className="absolute bg-slate-800/95 backdrop-blur-md border border-slate-600 p-4 rounded-xl shadow-2xl animate-fade-in-up z-20"
                        style={{
                            top: activeNodeData.y + 45, // Adjusted for larger nodes
                            left: isMobile ? '10px' : '50%',
                            right: isMobile ? '10px' : 'auto',
                            width: isMobile ? 'auto' : '320px',
                            transform: isMobile ? 'none' : 'translateX(-50%)',
                        }}
                     >
                         <button 
                            onClick={(e) => { e.stopPropagation(); setActiveNodeId(null); }}
                            className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
                         >
                             <X size={16} />
                         </button>
                         
                         <div className="pr-6">
                             <div className="flex items-center gap-2 mb-2">
                                 {activeNodeData.type === 'anchor' ? (
                                     <Anchor size={16} className="text-yellow-400" />
                                 ) : (
                                     <BookOpen size={16} className="text-blue-400" />
                                 )}
                                 <span className={`text-xs font-bold uppercase tracking-wider ${activeNodeData.type === 'anchor' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                     {activeNodeData.type === 'anchor' ? 'Core Anchor' : 'Evidence Story'}
                                 </span>
                             </div>
                             
                             <h4 className="text-white font-bold text-lg mb-1">{activeNodeData.name || "Untitled"}</h4>
                             
                             {activeNodeData.type === 'story' && (
                                 <p className="text-slate-300 text-sm leading-relaxed max-h-40 overflow-y-auto">
                                     "{activeNodeData.text}"
                                 </p>
                             )}
                             
                             {activeNodeData.type === 'anchor' && (
                                 <p className="text-slate-400 text-xs italic">
                                     {nodes.filter(n => n.connectedToId === activeNodeData.id).length} stories connected to this anchor.
                                 </p>
                             )}
                         </div>
                     </div>
                 )}
             </div>

             {/* Tap background to deselect */}
             {activeNodeId && (
                 <div className="absolute inset-0 z-0" onClick={() => setActiveNodeId(null)} />
             )}

             {unconnectedStories.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-slate-800 relative z-10">
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
