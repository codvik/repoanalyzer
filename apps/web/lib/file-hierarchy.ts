export type FileHierarchyNode = {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileHierarchyNode[];
  // Total file count in this subtree (1 for files).
  fileCount: number;
  // Files directly under this folder (0 for files).
  directFileCount: number;
};

export function buildFileHierarchy(
  filePaths: string[],
  opts?: { rootName?: string },
): FileHierarchyNode {
  const root: FileHierarchyNode = {
    name: opts?.rootName ?? "root",
    type: "folder",
    path: "",
    children: [],
    fileCount: 0,
    directFileCount: 0,
  };

  for (const raw of filePaths) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      const type: "file" | "folder" = isLeaf ? "file" : "folder";

      if (!current.children) current.children = [];
      let child = current.children.find((c) => c.name === part && c.type === type);

      if (!child) {
        child = {
          name: part,
          type,
          path: current.path ? `${current.path}/${part}` : part,
          children: type === "folder" ? [] : undefined,
          fileCount: 0,
          directFileCount: 0,
        };
        current.children.push(child);
      }

      current = child;
    }
  }

  sortHierarchy(root);
  computeCounts(root);
  return root;
}

export function toFoldersOnlyHierarchy(
  root: FileHierarchyNode,
  opts?: { rootName?: string },
): FileHierarchyNode {
  const next: FileHierarchyNode = {
    name: opts?.rootName ?? root.name,
    type: "folder",
    path: root.path,
    children: [],
    fileCount: root.fileCount,
    directFileCount: root.directFileCount,
  };

  for (const child of root.children ?? []) {
    if (child.type !== "folder") continue;
    next.children!.push(toFoldersOnlyHierarchy(child));
  }

  return next;
}

function sortHierarchy(node: FileHierarchyNode) {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });
  node.children.forEach(sortHierarchy);
}

function computeCounts(node: FileHierarchyNode): number {
  if (node.type === "file") {
    node.fileCount = 1;
    node.directFileCount = 0;
    return 1;
  }

  let total = 0;
  let direct = 0;
  for (const child of node.children ?? []) {
    if (child.type === "file") direct += 1;
    total += computeCounts(child);
  }

  node.fileCount = total;
  node.directFileCount = direct;
  return total;
}

