"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { buildFileHierarchy, toFoldersOnlyHierarchy } from "../lib/file-hierarchy";
import type { FileHierarchyNode } from "../lib/file-hierarchy";

type Props = {
  files: string[];
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onSelectPath?: (path: string) => void;
  selectedPath?: string | null;
};

export function FileMindMapFolders({
  files,
  fullscreen = false,
  onToggleFullscreen,
  onSelectPath,
  selectedPath,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<{
    expandAll: () => void;
    collapseAll: () => void;
    center: () => void;
  } | null>(null);

  const [stats, setStats] = useState({ files: 0, folders: 0, depth: 0 });

  const treeData = useMemo(() => {
    const full = buildFileHierarchy(files);
    const root = toFoldersOnlyHierarchy(full, { rootName: "root" });
    let folderCount = 0;
    let maxDepth = 0;
    const walk = (node: FileHierarchyNode, depth: number) => {
      folderCount += 1;
      maxDepth = Math.max(maxDepth, depth);
      node.children?.forEach((c) => walk(c, depth + 1));
    };
    walk(root, 0);
    setStats({ files: full.fileCount, folders: Math.max(0, folderCount - 1), depth: maxDepth });
    return root;
  }, [files]);

  useEffect(() => {
    if (!svgRef.current) return;

    const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
    const parentHeight = svgRef.current.parentElement?.getBoundingClientRect().height;
    const width = Math.max(320, Math.floor(svgWidth));
    const height = Math.max(420, Math.floor(svgHeight || parentHeight || 700));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const duration = prefersReducedMotion ? 0 : 180;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", "100%").attr("height", height);
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    const tree = d3
      .tree<FileHierarchyNode>()
      // folders-only is much lighter; make it more horizontal for readability
      .nodeSize([32, 320])
      .separation((a, b) => (a.parent === b.parent ? 1.25 : 1.55));

    const root = d3.hierarchy(treeData);

    const collapseDeep = (node: any) => {
      if (node.children) {
        node._children = node.children;
        node.children = undefined;
      }
      (node._children ?? []).forEach(collapseDeep);
    };
    const expandDeep = (node: any) => {
      if (node._children) {
        node.children = node._children;
        node._children = undefined;
      }
      (node.children ?? []).forEach(expandDeep);
    };

    // Initial state: only root visible.
    collapseDeep(root);

    const linkGen = d3
      .linkHorizontal<any, any>()
      .x((d) => d.y)
      .y((d) => d.x);

    let i = 0;

    const centerOn = (node: any, animate: boolean) => {
      if (!svgRef.current) return;
      const current = d3.zoomTransform(svgRef.current);
      const k = current.k || 1;
      const tx = width / 2 - (node.y ?? 0) * k;
      const ty = height / 2 - (node.x ?? 0) * k;
      const next = d3.zoomIdentity.translate(tx, ty).scale(k);
      const sel = d3.select(svgRef.current);
      if (animate && duration > 0) sel.transition().duration(duration).call(zoom.transform as any, next);
      else sel.call(zoom.transform as any, next);
    };

    const update = (source: any, animate: boolean) => {
      const t = animate ? duration : 0;
      const layout = tree(root as any);
      const nodes = layout.descendants();
      const links = layout.links();

      const linkSel = g
        .selectAll<SVGPathElement, any>(".link")
        .data(links, (d: any) => d.target.id || (d.target.id = ++i));

      linkSel
        .exit()
        .transition()
        .duration(t)
        .attr("stroke-opacity", 0)
        .remove();

      linkSel
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "rgba(15, 23, 42, 0.18)")
        .attr("stroke-width", 1.4)
        .attr("stroke-linecap", "round")
        .attr("d", () => linkGen({ source, target: source }) as string)
        .merge(linkSel as any)
        .transition()
        .duration(t)
        .attr("d", (d) => linkGen(d) as string)
        .attr("stroke-opacity", 1);

      const nodeSel = g
        .selectAll<SVGGElement, any>(".node")
        .data(nodes, (d: any) => d.id || (d.id = ++i));

      nodeSel
        .exit()
        .transition()
        .duration(t)
        .attr("opacity", 0)
        .remove();

      const nodeEnter = nodeSel
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.y0 ?? source.y ?? 0},${source.x0 ?? source.x ?? 0})`)
        .attr("opacity", 0)
        .on("click", (_event, d: any) => {
          if (onSelectPath) {
            onSelectPath(d.data.path);
          }
          if (d.children) {
            d._children = d.children;
            d.children = undefined;
          } else if (d._children) {
            d.children = d._children;
            d._children = undefined;
          }
          update(d, true);
        });

      nodeEnter
        .append("circle")
        .attr("r", 0)
        .attr("fill", (d: any) => (d.data.path === selectedPath ? "#2563eb" : "#93c5fd"))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .on("mouseenter", (event, d: any) => {
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          tooltip.style.opacity = "1";
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY + 10}px`;
          const p = d.data.path ? `<div style=\"font-size:11px;opacity:.85\">${d.data.path}</div>` : "";
          tooltip.innerHTML = `<div style=\"font-weight:700\">${d.data.name}</div>${p}<div style=\"font-size:11px;opacity:.85\">${d.data.fileCount} files</div>`;
        })
        .on("mouseleave", () => {
          if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
        });

      nodeEnter
        .append("text")
        .attr("dy", ".31em")
        .attr("x", (d: any) => (d.children || d._children ? -14 : 14))
        .style("text-anchor", (d: any) => (d.children || d._children ? "end" : "start"))
        .style("font-size", "12px")
        .style("fill", "rgba(15, 23, 42, 0.92)")
        .text((d: any) => {
          const suffix = d.data.path ? ` (${d.data.fileCount})` : "";
          const label = `${d.data.name}${suffix}`;
          return label.length > 34 ? `${label.slice(0, 31)}...` : label;
        });

      const nodeUpdate = nodeEnter.merge(nodeSel as any);
      nodeUpdate
        .transition()
        .duration(t)
        .attr("opacity", 1)
        .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

      nodeUpdate
        .select("circle")
        .transition()
        .duration(t)
        .attr("r", 8)
        .attr("fill", (d: any) => (d.data.path === selectedPath ? "#2563eb" : "#93c5fd"));

      nodeUpdate
        .select("text")
        .attr("x", (d: any) => (d.children || d._children ? -14 : 14))
        .style("text-anchor", (d: any) => (d.children || d._children ? "end" : "start"));

      nodes.forEach((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };

    (root as any).x0 = height / 2;
    (root as any).y0 = 100;
    update(root as any, false);
    centerOn(root as any, false);

    controlsRef.current = {
      expandAll: () => {
        expandDeep(root);
        update(root, true);
      },
      collapseAll: () => {
        collapseDeep(root);
        update(root, true);
        centerOn(root, true);
      },
      center: () => centerOn(root, true),
    };

    return () => {
      controlsRef.current = null;
    };
  }, [treeData, onSelectPath, selectedPath]);

  return (
    <div className="panel">
      <header className="tree-header">
        <h3>Map (Folders Only)</h3>
        <div className="stats">
          <span className="stats-badge">📁 {stats.folders} Folders</span>
          <span className="stats-badge">📄 {stats.files} Files</span>
          <span className="stats-badge">📊 Depth: {stats.depth}</span>
        </div>
        <div className="tree-actions">
          {onToggleFullscreen ? (
            <button type="button" className="button outline small" onClick={onToggleFullscreen}>
              {fullscreen ? "Exit full page" : "Full page"}
            </button>
          ) : null}
          <button type="button" className="button outline small" onClick={() => controlsRef.current?.expandAll()}>
            Expand all
          </button>
          <button type="button" className="button outline small" onClick={() => controlsRef.current?.collapseAll()}>
            Collapse all
          </button>
          <button type="button" className="button outline small" onClick={() => controlsRef.current?.center()}>
            Center
          </button>
        </div>
      </header>
      <div className="mindmap">
        <svg ref={svgRef} className="mindmap-svg" />
        <div ref={tooltipRef} className="tooltip" />
      </div>
    </div>
  );
}
