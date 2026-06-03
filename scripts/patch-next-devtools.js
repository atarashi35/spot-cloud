const fs = require("fs");
const path = require("path");

const root = process.cwd();

const updates = [
  {
    file: "node_modules/next/dist/server/app-render/entry-base.js",
    from: `if (process.env.NODE_ENV === 'development') {
    const mod = require('../../next-devtools/userspace/app/segment-explorer-node');
    SegmentViewNode = mod.SegmentViewNode;
    SegmentViewStateNode = mod.SegmentViewStateNode;
}
`,
    to: ""
  },
  {
    file: "node_modules/next/dist/esm/server/app-render/entry-base.js",
    from: `if (process.env.NODE_ENV === 'development') {
    const mod = require('../../next-devtools/userspace/app/segment-explorer-node');
    SegmentViewNode = mod.SegmentViewNode;
    SegmentViewStateNode = mod.SegmentViewStateNode;
}
`,
    to: ""
  },
  {
    file: "node_modules/next/dist/client/components/layout-router.js",
    from: "if (process.env.NODE_ENV !== 'production') {",
    to: "if (process.env.NODE_ENV !== 'production' && process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER) {"
  },
  {
    file: "node_modules/next/dist/esm/client/components/layout-router.js",
    from: "if (process.env.NODE_ENV !== 'production') {",
    to: "if (process.env.NODE_ENV !== 'production' && process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER) {"
  }
];

for (const update of updates) {
  const target = path.join(root, update.file);

  if (!fs.existsSync(target)) {
    continue;
  }

  const current = fs.readFileSync(target, "utf8");

  if (current.includes(update.to) && !current.includes(update.from)) {
    continue;
  }

  if (!current.includes(update.from)) {
    throw new Error(`Patch target not found: ${update.file}`);
  }

  fs.writeFileSync(target, current.replace(update.from, update.to));
}

console.log("Patched Next devtools segment explorer workaround.");
