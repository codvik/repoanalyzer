"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

export type MindMapNode = {
  name: string;
  type: "file" | "folder";
  children?: MindMapNode[];
  path?: string;
};

type Props = {
  files: string[];
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export function FileMindMap({ files, fullscreen = false, onToggleFullscreen }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<{
    expandAll: () => void;
    collapseAll: () => void;
    center: () => void;
  } | null>(null);
  const [stats, setStats] = useState({ files: 0, folders: 0, depth: 0 });
  const treeData = useMemo(() => buildTree(files, setStats), [files]);

  useEffect(() => {
    if (!svgRef.current || !treeData) return;

    const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
    const parentHeight = svgRef.current.parentElement?.getBoundingClientRect().height;
    const width = Math.max(320, Math.floor(svgWidth));
    const height = Math.max(420, Math.floor(svgHeight || parentHeight || 700));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const duration = prefersReducedMotion ? 0 : 200;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("width", "100%").attr("height", height);
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom as any);

    const tree = d3
      .tree<MindMapNode>()
      // x = vertical spacing, y = horizontal spacing
      .nodeSize([36, 360])
      .separation((a, b) => (a.parent === b.parent ? 1.35 : 1.7));
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

    // Initial state: everything collapsed (only the root node visible).
    collapseDeep(root);

    let i = 0;

    const update = (source: any, animate: boolean) => {
      const t = animate ? duration : 0;
      const treeData = tree(root as any);
      const nodes = treeData.descendants();
      const links = treeData.links();

      const link = g.selectAll(".link").data(links, (d: any) => d.target.id || (d.target.id = ++i));

      const orthogonalPath = (d: any) => `M${d.source.y},${d.source.x} L${d.source.y + 30},${d.source.x} L${d.source.y + 30},${d.target.x} L${d.target.y},${d.target.x}`;
      const collapsePath = (s: any) =>
        `M${s.y0 ?? s.y ?? 0},${s.x0 ?? s.x ?? 0} L${s.y0 ?? s.y ?? 0},${s.x0 ?? s.x ?? 0}`;

      link
        .exit()
        .transition()
        .duration(t)
        .attr("d", () => collapsePath(source))
        .remove();

      link.enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", (d: any) => colorFor(d.target.data.name))
        .attr("stroke-opacity", 0.65)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", () => collapsePath(source))
        .merge(link as any)
        .transition()
        .duration(t)
        .attr("d", orthogonalPath);

      const node = g.selectAll(".node").data(nodes, (d: any) => d.id || (d.id = ++i));
      const nodeExit = node
        .exit()
        .transition()
        .duration(t)
        .attr("transform", () => `translate(${source.y ?? 0},${source.x ?? 0})`);
      nodeExit.select("circle").attr("r", 0);
      nodeExit.remove();

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.y0 ?? source.y ?? 0},${source.x0 ?? source.x ?? 0})`)
        .on("click", (_event, d: any) => {
          if (d.children) {
            d._children = d.children;
            d.children = undefined;
          } else if (d._children) {
            d.children = d._children;
            d._children = undefined;
          }
          update(d, true);
        });

      nodeEnter.append("circle")
        .attr("r", 0)
        .attr("fill", (d: any) => colorFor(d.data.name, d.data.type))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .on("mouseenter", (event, d: any) => {
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          tooltip.style.opacity = "1";
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY + 10}px`;
          tooltip.innerHTML = `<div style="font-weight:600">${d.data.name}</div><div style="font-size:11px">${d.data.path ?? ""}</div>`;
        })
        .on("mouseleave", () => {
          if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
        });

      nodeEnter.append("text")
        .attr("dy", ".31em")
        .attr("x", (d: any) => d.children || d._children ? -15 : 15)
        .style("text-anchor", (d: any) => d.children || d._children ? "end" : "start")
        .style("font-size", "12px")
        .text((d: any) => d.data.name.length > 30 ? `${d.data.name.slice(0, 27)}...` : d.data.name);

      const nodeUpdate = nodeEnter.merge(node as any);
      nodeUpdate
        .transition()
        .duration(t)
        .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

      nodeUpdate
        .select("circle")
        .transition()
        .duration(t)
        .attr("r", (d: any) => (d.data.type === "folder" ? 8 : 6))
        .attr("fill", (d: any) => colorFor(d.data.name, d.data.type));

      nodeUpdate
        .select("text")
        .attr("x", (d: any) => (d.children || d._children ? -15 : 15))
        .style("text-anchor", (d: any) => (d.children || d._children ? "end" : "start"));

      nodes.forEach((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };

    (root as any).x0 = height / 2;
    (root as any).y0 = 100;

    update(root as any, false);

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

    // Center on root after initial render.
    centerOn(root, false);

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
  }, [treeData]);

  return (
    <div className="panel">
      <header className="tree-header">
        <h3>Mind Map</h3>
        <div className="stats">
          <span className="stats-badge">📁 {stats.folders} Folders</span>
          <span className="stats-badge">📄 {stats.files} Files</span>
          <span className="stats-badge">📊 Depth: {stats.depth}</span>
        </div>
        <div className="tree-actions">
          {onToggleFullscreen ? (
            <button
              type="button"
              className="button outline small"
              onClick={onToggleFullscreen}
            >
              {fullscreen ? "Exit full page" : "Full page"}
            </button>
          ) : null}
          <button
            type="button"
            className="button outline small"
            onClick={() => controlsRef.current?.expandAll()}
          >
            Expand all
          </button>
          <button
            type="button"
            className="button outline small"
            onClick={() => controlsRef.current?.collapseAll()}
          >
            Collapse all
          </button>
          <button
            type="button"
            className="button outline small"
            onClick={() => controlsRef.current?.center()}
          >
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

function buildTree(paths: string[], setStats: (v: any) => void): MindMapNode {
  const root: MindMapNode = { name: "root", type: "folder", children: [] };
  let files = 0;
  let folders = 0;
  let depth = 0;

  for (const line of paths) {
    const parts = line.split("/").filter(Boolean);
    let current = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1 && part.includes(".");
      if (!current.children) current.children = [];
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          type: isFile ? "file" : "folder",
          children: [],
          path: parts.slice(0, index + 1).join("/"),
        };
        current.children.push(child);
        if (isFile) files++; else folders++;
      }
      current = child;
      depth = Math.max(depth, index + 1);
    });
  }

  setStats({ files, folders, depth });
  return root;
}

function colorFor(name: string, type?: "file" | "folder") {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = {
    js: "#f7df1e",
    jsx: "#61dafb",
    ts: "#3178c6",
    tsx: "#3178c6",
    json: "#5a5a5a",
    md: "#083fa1",
    css: "#563d7c",
    html: "#e34c26",
    svg: "#ffb13b",
    png: "#8bc34a",
    jpg: "#8bc34a",
    gif: "#8bc34a",
    pdf: "#f44336",
    folder: "#90caf9",
  };
  if (type === "folder") return colors.folder;
  return colors[ext ?? "folder"] || "#9e9e9e";
}
