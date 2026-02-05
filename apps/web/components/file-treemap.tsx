"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { buildFileHierarchy } from "../lib/file-hierarchy";
import type { FileHierarchyNode } from "../lib/file-hierarchy";

type Props = {
  files: string[];
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function parentPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

function findByPath(root: FileHierarchyNode, path: string): FileHierarchyNode | null {
  if (!path) return root;
  const parts = path.split("/").filter(Boolean);
  let current: FileHierarchyNode = root;
  for (const part of parts) {
    const next = (current.children ?? []).find((c) => c.name === part);
    if (!next) return null;
    current = next;
  }
  return current;
}

export function FileTreemap({ files, fullscreen = false, onToggleFullscreen }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const focusPathRef = useRef<string>("");
  const [focusPath, setFocusPath] = useState("");
  const controlsRef = useRef<{ reset: () => void; up: () => void } | null>(null);
  const [stats, setStats] = useState({ files: 0, folders: 0, depth: 0 });

  const data = useMemo(() => {
    const root = buildFileHierarchy(files);
    let folderCount = 0;
    let depth = 0;
    const walk = (n: FileHierarchyNode, d: number) => {
      if (n.type === "folder") folderCount += 1;
      depth = Math.max(depth, d);
      n.children?.forEach((c) => walk(c, d + 1));
    };
    walk(root, 0);
    setStats({ files: root.fileCount, folders: Math.max(0, folderCount - 1), depth });
    return root;
  }, [files]);

  useEffect(() => {
    focusPathRef.current = focusPath;
  }, [focusPath]);

  useEffect(() => {
    if (!svgRef.current) return;

    const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
    const parentHeight = svgRef.current.parentElement?.getBoundingClientRect().height;
    const width = Math.max(640, Math.floor(svgWidth));
    const height = Math.max(460, Math.floor(svgHeight || parentHeight || 700));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const duration = prefersReducedMotion ? 0 : 160;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", "100%").attr("height", height);

    const g = svg.append("g");

    const color = d3
      .scaleSequential()
      .domain([0, 10])
      .interpolator(d3.interpolateBlues);

    const render = (nextFocusPath: string, animate: boolean) => {
      const focusNode = findByPath(data, nextFocusPath) ?? data;

      // NOTE: `treemap()` returns a `HierarchyRectangularNode` with x0/x1/y0/y1.
      const root = d3
        .treemap()
        .size([width, height])
        .paddingInner(1)
        .paddingOuter(2)(
          d3
            .hierarchy(focusNode)
            .sum((d: any) => (d.type === "file" ? 1 : 0))
            .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0)),
        );

      const nodes = root.descendants();
      const t = animate ? g.transition().duration(duration) : g;

      const rect = g
        .selectAll("rect")
        .data(nodes, (d: any) => d.data.path || d.data.name);

      rect.exit().remove();

      const rectEnter = rect
        .enter()
        .append("rect")
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("stroke", "rgba(255,255,255,0.9)")
        .attr("stroke-width", 0.7)
        .on("mousemove", (event: any, d: any) => {
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          tooltip.style.opacity = "1";
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY + 10}px`;

          const name = escapeHtml(String(d.data.name ?? ""));
          const path = escapeHtml(String(d.data.path ?? ""));
          const pathLine = path ? `<div style="font-size:11px;opacity:.85">${path}</div>` : "";
          const filesLine = Number.isFinite(d.value)
            ? `<div style="font-size:11px;opacity:.85">${d.value} files</div>`
            : "";
          tooltip.innerHTML = `<div style="font-weight:700">${name}</div>${pathLine}${filesLine}`;
        })
        .on("mouseleave", () => {
          if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
        })
        .on("click", (_event: any, d: any) => {
          if (d.data.type !== "folder") return;
          if (!d.data.path) return;
          setFocusPath(d.data.path);
          render(d.data.path, true);
        });

      rectEnter
        .merge(rect as any)
        .attr("fill", (d: any) => color(d.depth))
        .transition(t as any)
        .attr("x", (d: any) => d.x0)
        .attr("y", (d: any) => d.y0)
        .attr("width", (d: any) => Math.max(0, d.x1 - d.x0))
        .attr("height", (d: any) => Math.max(0, d.y1 - d.y0));

      const labels = g
        .selectAll("text")
        .data(
          nodes.filter((d: any) => (d.x1 - d.x0) > 90 && (d.y1 - d.y0) > 18),
          (d: any) => d.data.path || d.data.name,
        );

      labels.exit().remove();

      labels
        .enter()
        .append("text")
        .attr("font-size", 11)
        .attr("fill", "rgba(15,23,42,0.88)")
        .attr("pointer-events", "none")
        .merge(labels as any)
        .transition(t as any)
        .attr("x", (d: any) => d.x0 + 6)
        .attr("y", (d: any) => d.y0 + 14)
        .text((d: any) => String(d.data.name ?? ""));
    };

    controlsRef.current = {
      reset: () => {
        setFocusPath("");
        render("", true);
      },
      up: () => {
        const current = focusPathRef.current;
        if (!current) return;
        const next = parentPath(current);
        setFocusPath(next);
        render(next, true);
      },
    };

    render(focusPathRef.current, false);

    return () => {
      controlsRef.current = null;
    };
  }, [data]);

  const breadcrumb = focusPath ? focusPath.split("/").filter(Boolean).join(" / ") : "root";

  return (
    <div className="panel">
      <header className="tree-header">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h3>Treemap</h3>
          <p style={{ margin: 0 }}>Focus: {breadcrumb}</p>
        </div>
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
          <button type="button" className="button outline small" onClick={() => controlsRef.current?.up()} disabled={!focusPath}>
            Up
          </button>
          <button type="button" className="button outline small" onClick={() => controlsRef.current?.reset()}>
            Reset
          </button>
        </div>
      </header>
      <div className="viz-surface">
        <svg ref={svgRef} className="viz-svg" />
        <div ref={tooltipRef} className="tooltip" />
      </div>
    </div>
  );
}
