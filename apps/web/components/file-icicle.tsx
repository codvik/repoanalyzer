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

export function FileIcicle({ files, fullscreen = false, onToggleFullscreen }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<{ reset: () => void } | null>(null);
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
    if (!svgRef.current) return;

    const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
    const parentHeight = svgRef.current.parentElement?.getBoundingClientRect().height;
    const width = Math.max(640, Math.floor(svgWidth));
    const height = Math.max(460, Math.floor(svgHeight || parentHeight || 700));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const duration = prefersReducedMotion ? 0 : 220;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", "100%").attr("height", height);

    // NOTE: `d3` is intentionally treated as untyped (see `apps/web/d3.d.ts`).
    // Avoid passing type arguments (e.g. `partition<T>()`) so CI builds don't fail.
    const root = d3
      .partition()
      .size([height, width])(
        d3
          .hierarchy(data)
          .sum((d: any) => (d.type === "file" ? 1 : 0))
          .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0)),
      );

    const x = d3.scaleLinear().domain([0, width]).range([0, width]);
    const y = d3.scaleLinear().domain([0, height]).range([0, height]);

    const color = d3
      .scaleSequential()
      .domain([0, Math.max(1, root.height)])
      .interpolator(d3.interpolateBlues);

    const g = svg.append("g");

    const render = () => {
      const nodes = root.descendants();

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
          const p = d.data.path ? `<div style=\"font-size:11px;opacity:.85\">${d.data.path}</div>` : "";
          const filesCount = d.value ? `<div style=\"font-size:11px;opacity:.85\">${d.value} files</div>` : "";
          tooltip.innerHTML = `<div style=\"font-weight:700\">${d.data.name}</div>${p}${filesCount}`;
        })
        .on("mouseleave", () => {
          if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
        })
        .on("click", (_event: any, d: any) => zoomTo(d));

      rectEnter.merge(rect as any).attr("fill", (d: any) => color(d.depth));

      rectEnter.merge(rect as any)
        .attr("x", (d: any) => x(d.y0))
        .attr("y", (d: any) => y(d.x0))
        .attr("width", (d: any) => Math.max(0, x(d.y1) - x(d.y0)))
        .attr("height", (d: any) => Math.max(0, y(d.x1) - y(d.x0)));

      const labels = g
        .selectAll("text")
        .data(nodes.filter((d: any) => (x(d.y1) - x(d.y0)) > 90 && (y(d.x1) - y(d.x0)) > 18), (d: any) => d.data.path || d.data.name);

      labels.exit().remove();

      labels
        .enter()
        .append("text")
        .attr("font-size", 11)
        .attr("fill", "rgba(15,23,42,0.88)")
        .attr("pointer-events", "none")
        .merge(labels as any)
        .attr("x", (d: any) => x(d.y0) + 6)
        .attr("y", (d: any) => y(d.x0) + 14)
        .text((d: any) => d.data.name);
    };

    const zoomTo = (focus: any) => {
      const nextX = d3
        .scaleLinear()
        .domain([focus.y0, width])
        .range([0, width]);
      const nextY = d3
        .scaleLinear()
        .domain([focus.x0, focus.x1])
        .range([0, height]);

      const t = g.transition().duration(duration);

      g.selectAll("rect")
        .transition(t as any)
        .attr("x", (d: any) => nextX(d.y0))
        .attr("y", (d: any) => nextY(d.x0))
        .attr("width", (d: any) => Math.max(0, nextX(d.y1) - nextX(d.y0)))
        .attr("height", (d: any) => Math.max(0, nextY(d.x1) - nextY(d.x0)));

      g.selectAll("text")
        .transition(t as any)
        .attr("x", (d: any) => nextX(d.y0) + 6)
        .attr("y", (d: any) => nextY(d.x0) + 14)
        .attr("opacity", (d: any) =>
          (nextX(d.y1) - nextX(d.y0)) > 90 && (nextY(d.x1) - nextY(d.x0)) > 18 ? 1 : 0,
        );

      x.domain(nextX.domain()).range(nextX.range());
      y.domain(nextY.domain()).range(nextY.range());
    };

    controlsRef.current = { reset: () => zoomTo(root) };

    render();
    zoomTo(root);

    return () => {
      controlsRef.current = null;
    };
  }, [data]);

  return (
    <div className="panel">
      <header className="tree-header">
        <h3>Icicle (Partition)</h3>
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
