"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const CYTOSCAPE_SCRIPT_ID = "cytoscape-cdn-script";
const CYTOSCAPE_CDN_URL =
  "https://unpkg.com/cytoscape@3.30.4/dist/cytoscape.min.js";

let cytoscapeLoadPromise = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mapWeightToRange(weight, fromMin, fromMax, toMin, toMax) {
  const clamped = clamp(Number(weight) || 1, fromMin, fromMax);
  const ratio = (clamped - fromMin) / (fromMax - fromMin || 1);
  return toMin + ratio * (toMax - toMin);
}

function getSquaredWidth(weight, minWidth, maxWidth) {
  const currentWidth = mapWeightToRange(weight, 1, 10, minWidth, maxWidth);
  return currentWidth * currentWidth;
}

function loadCytoscapeFromCdn() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is unavailable"));
  }

  if (window.cytoscape) {
    return Promise.resolve(window.cytoscape);
  }

  if (cytoscapeLoadPromise) {
    return cytoscapeLoadPromise;
  }

  cytoscapeLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(CYTOSCAPE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.cytoscape) {
          resolve(window.cytoscape);
          return;
        }
        reject(new Error("Cytoscape script loaded but library missing"));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Cytoscape script"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = CYTOSCAPE_SCRIPT_ID;
    script.src = CYTOSCAPE_CDN_URL;
    script.async = true;
    script.onload = () => {
      if (window.cytoscape) {
        resolve(window.cytoscape);
        return;
      }
      reject(new Error("Cytoscape script loaded but library missing"));
    };
    script.onerror = () => reject(new Error("Failed to load Cytoscape script"));
    document.head.appendChild(script);
  });

  return cytoscapeLoadPromise;
}

function buildSharedEdges(nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeMap = new Map();

  nodes.forEach((node) => {
    (node.sharedConnections || []).forEach((sharedNode) => {
      if (!nodeIds.has(sharedNode.id)) {
        return;
      }

      const [source, target] = [node.id, sharedNode.id].sort();
      const key = `${source}__${target}`;
      const nextWeight = Math.max(1, Number(sharedNode.weight) || 1);
      const prevWeight = edgeMap.get(key) || 0;
      edgeMap.set(key, Math.max(prevWeight, nextWeight));
    });
  });

  return Array.from(edgeMap.entries()).map(([key, weight]) => {
    const [source, target] = key.split("__");
    return {
      data: {
        id: `shared-${key}`,
        source,
        target,
        weight,
        width: getSquaredWidth(weight, 1, 4),
        kind: "shared",
      },
    };
  });
}

export default function NetworkGraphCanvas({ centerLabel, nodes }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const [graphError, setGraphError] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const elements = useMemo(() => {
    const safeCenterLabel = String(centerLabel || "You");
    const maxWeight = Math.max(1, ...nodes.map((node) => Number(node.weight) || 1));

    const nodeElements = [
      {
        data: {
          id: "self",
          label: safeCenterLabel,
          kind: "self",
          weight: maxWeight + 2,
        },
      },
      ...nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          kind: "connection",
          weight: Math.max(1, Number(node.weight) || 1),
        },
      })),
    ];

    const closestEdgeElements = nodes.map((node) => ({
      data: {
        id: `closest-self-${node.id}`,
        source: "self",
        target: node.id,
        weight: Math.max(1, Number(node.weight) || 1),
        width: getSquaredWidth(node.weight, 2, 10),
        kind: "closest",
      },
    }));

    const sharedEdgeElements = buildSharedEdges(nodes);

    return [...nodeElements, ...closestEdgeElements, ...sharedEdgeElements];
  }, [centerLabel, nodes]);

  useEffect(() => {
    let cy = null;
    let cancelled = false;

    async function render() {
      try {
        const cytoscape = await loadCytoscapeFromCdn();
        if (cancelled || !containerRef.current) {
          return;
        }

        setGraphError("");

        cy = cytoscape({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: "node",
              style: {
                label: "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "font-size": 10,
                "font-weight": 700,
                color: "#111827",
                "text-wrap": "wrap",
                "text-max-width": 70,
              },
            },
            {
              selector: 'node[kind = "self"]',
              style: {
                "background-color": "#0b5a21",
                color: "#ffffff",
                width: 64,
                height: 64,
                "border-width": 2,
                "border-color": "#084618",
              },
            },
            {
              selector: 'node[kind = "connection"]',
              style: {
                "background-color": "#c4ceb2",
                width: "mapData(weight, 1, 10, 34, 52)",
                height: "mapData(weight, 1, 10, 34, 52)",
              },
            },
            {
              selector: 'edge[kind = "shared"]',
              style: {
                "line-color": "#6b7280",
                width: "data(width)",
                opacity: 0.75,
                "line-style": "dashed",
                "curve-style": "bezier",
              },
            },
            {
              selector: 'edge[kind = "closest"]',
              style: {
                "line-color": "#0b5a21",
                width: "data(width)",
                opacity: 0.9,
                "curve-style": "bezier",
              },
            },
          ],
          layout: {
            name: "concentric",
            animate: false,
            fit: true,
            padding: 24,
            concentric: (node) =>
              node.data("kind") === "self" ? 100 : node.data("weight") || 1,
            levelWidth: () => 1,
          },
        });

        cy.on("tap", (event) => {
          if (event.target === cy) {
            setContextMenu(null);
          }
        });

        const openContextMenuForNode = (event) => {
          event.originalEvent?.preventDefault?.();

          const nodeId = event.target.id();
          const rendered = event.renderedPosition;
          const containerWidth = containerRef.current?.clientWidth || 360;
          const containerHeight = containerRef.current?.clientHeight || 300;

          const clampedX = Math.min(
            Math.max(12, rendered.x),
            Math.max(12, containerWidth - 220)
          );
          const clampedY = Math.min(
            Math.max(12, rendered.y),
            Math.max(12, containerHeight - 68)
          );

          setContextMenu({
            x: clampedX,
            y: clampedY,
            nodeId,
          });
        };

        cy.on('cxttap', 'node[kind = "connection"]', openContextMenuForNode);
        cy.on('taphold', 'node[kind = "connection"]', openContextMenuForNode);
      } catch {
        if (!cancelled) {
          setGraphError("Could not load Cytoscape graph renderer.");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
      if (cy) {
        cy.destroy();
      }
    };
  }, [elements]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectedSharedInterests = selectedNode?.sharedInterests || [];

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-xl border border-gray-200 bg-white p-3"
    >
      {graphError ? (
        <p className="text-sm text-red-600">{graphError}</p>
      ) : (
        <>
          <div
            ref={containerRef}
            className="h-[360px] w-full"
            onContextMenu={(event) => event.preventDefault()}
          />

          {contextMenu && (
            <div
              className="absolute z-30 w-56 overflow-hidden rounded-xl border border-[#a9b79a] bg-white/95 shadow-2xl backdrop-blur"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="bg-[#c4ceb2] px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Graph Actions
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {nodeById.get(contextMenu.nodeId)?.label || "Connection"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const node = nodeById.get(contextMenu.nodeId);
                  if (node) {
                    setSelectedNode(node);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm font-semibold text-[#0b5a21] transition-colors hover:bg-[#eef3e5]"
              >
                View shared interests
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-700">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-6 rounded bg-[#0b5a21]" />
              Closest connections (width = strength)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-6 rounded border border-gray-500 border-dashed" />
              Shared links between connections
            </span>
          </div>

          {selectedNode && (
            <div className="mt-4 rounded-2xl border border-[#a9b79a] bg-gradient-to-b from-white to-[#f5f7f1] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Shared Interests
                  </p>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedNode.label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              {selectedSharedInterests.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">
                  No shared interests with this connection yet.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSharedInterests.map((interest) => (
                    <span
                      key={`${selectedNode.id}-${interest}`}
                      className="rounded-full border border-[#a9b79a] bg-[#c4ceb2]/50 px-3 py-1 text-xs font-semibold text-gray-800"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
