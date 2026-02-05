"use client";

import { useMemo, useState } from "react";

export type FileTreeNode = {
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  expanded?: boolean;
  path?: string;
};

type Props = {
  files: string[];
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export function FileTreeView({ files, fullscreen = false, onToggleFullscreen }: Props) {
  const [search, setSearch] = useState("");
  const [, forceUpdate] = useState(0);

  const tree = useMemo(() => buildTree(files), [files]);
  const roots = tree.children ?? [];
  const searchLower = search.trim().toLowerCase();
  const matchMap = useMemo(
    () => buildMatchMap(tree, searchLower),
    [tree, searchLower],
  );

  const expandAll = () => {
    walk(tree, (node) => {
      if (node.type === "folder") node.expanded = true;
    });
    forceUpdate((v) => v + 1);
  };

  const collapseAll = () => {
    walk(tree, (node) => {
      if (node.type === "folder") node.expanded = false;
    });
    forceUpdate((v) => v + 1);
  };

  const toggle = (node: FileTreeNode) => {
    node.expanded = !node.expanded;
    forceUpdate((v) => v + 1);
  };

  const render = (node: FileTreeNode, depth = 0, parentExpanded = true) => {
    if (!parentExpanded) return null;
    const hasChildren = Boolean(node.children?.length);
    const match = matchMap.get(node);
    const subtreeMatches = Boolean(match?.subtree);
    const selfMatches = Boolean(match?.self);

    // When searching, only render nodes that match or contain matches.
    if (searchLower && !subtreeMatches) return null;

    const shouldExpand = searchLower ? subtreeMatches : Boolean(node.expanded);
    const id = `${depth}-${node.path ?? node.name}`;

    return (
      <div key={id}>
        <div
          className={`tree-row ${searchLower && selfMatches ? "match" : ""}`}
          onClick={() => hasChildren && toggle(node)}
        >
          <div className="tree-indent" style={{ width: `${depth * 20}px` }} />
          <div className="tree-expand-icon">{hasChildren ? (shouldExpand ? "▼" : "▶") : ""}</div>
          <div className="tree-file-icon">{iconFor(node.name, node.type, hasChildren, shouldExpand)}</div>
          <div className={`tree-label ${node.type === "folder" ? "folder" : ""}`}>{node.name}</div>
        </div>
        {hasChildren && shouldExpand && node.children!.map((child) => render(child, depth + 1, true))}
      </div>
    );
  };

  return (
    <div className="panel">
      <header className="tree-header">
        <h3>File Structure</h3>
        <div className="tree-actions">
          {onToggleFullscreen ? (
            <button type="button" className="button outline small" onClick={onToggleFullscreen}>
              {fullscreen ? "Exit full page" : "Full page"}
            </button>
          ) : null}
          <button type="button" className="button outline small" onClick={expandAll}>
            Expand all
          </button>
          <button type="button" className="button outline small" onClick={collapseAll}>
            Collapse all
          </button>
        </div>
        <input
          className="search-input"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>
      <div className="tree-container">{roots.map((child) => render(child, 0, true))}</div>
    </div>
  );
}

function buildTree(paths: string[]): FileTreeNode {
  const root: FileTreeNode = { name: "root", type: "folder", children: [], expanded: true };

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
          expanded: index === 0,
          path: parts.slice(0, index + 1).join("/"),
        };
        current.children.push(child);
      }
      current = child;
    });
  }

  sortTree(root);
  return root;
}

function sortTree(node: FileTreeNode) {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });
  node.children.forEach(sortTree);
}

function iconFor(name: string, type: string, hasChildren: boolean, expanded: boolean) {
  if (type === "folder") return hasChildren ? (expanded ? "📂" : "📁") : "📁";
  const ext = name.toLowerCase();
  if (ext.endsWith(".js") || ext.endsWith(".jsx")) return "📜";
  if (ext.endsWith(".ts") || ext.endsWith(".tsx")) return "📘";
  if (ext.endsWith(".json")) return "📋";
  if (ext.endsWith(".css") || ext.endsWith(".scss")) return "🎨";
  if (ext.endsWith(".html")) return "🌐";
  if (ext.endsWith(".md")) return "📝";
  if (ext.endsWith(".png") || ext.endsWith(".jpg") || ext.endsWith(".svg")) return "🖼️";
  if (ext.endsWith(".pdf")) return "📕";
  if (ext.endsWith(".yaml") || ext.endsWith(".yml")) return "⚙️";
  if (ext.endsWith(".xml")) return "📰";
  if (ext.endsWith(".env")) return "🔐";
  return "📄";
}

type MatchInfo = { self: boolean; subtree: boolean };

function buildMatchMap(root: FileTreeNode, termLower: string): Map<FileTreeNode, MatchInfo> {
  const map = new Map<FileTreeNode, MatchInfo>();
  if (!termLower) {
    // Avoid work when search is empty.
    return map;
  }

  const matchesSelf = (node: FileTreeNode): boolean => {
    const nameLower = node.name.toLowerCase();
    const pathLower = (node.path ?? "").toLowerCase();

    // If user includes a slash, treat it as a path query.
    if (termLower.includes("/")) {
      return pathLower.includes(termLower);
    }

    // Otherwise behave like a typical file explorer: match by segment prefix.
    // This makes typing "inde" highlight/index all "index.*" files anywhere.
    if (nameLower.startsWith(termLower)) return true;
    if (!pathLower) return false;
    return pathLower.split("/").some((segment) => segment.startsWith(termLower));
  };

  const visit = (node: FileTreeNode): boolean => {
    const self = matchesSelf(node);
    // Important: we must visit *all* children so every node gets a matchMap entry.
    // Using `some(visit)` would short-circuit and leave large parts of the tree unvisited.
    let childMatches = false;
    for (const child of node.children ?? []) {
      childMatches = visit(child) || childMatches;
    }
    const subtree = self || childMatches;
    map.set(node, { self, subtree });
    return subtree;
  };

  visit(root);
  return map;
}

function walk(root: FileTreeNode, visitor: (node: FileTreeNode) => void) {
  visitor(root);
  root.children?.forEach((child) => walk(child, visitor));
}
