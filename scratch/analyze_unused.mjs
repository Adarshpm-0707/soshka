import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const publicDir = path.join(rootDir, 'public');

// Recursively find files
function getFilesRec(dir, extensions) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRec(fullPath, extensions));
    } else {
      if (extensions.includes(path.extname(file).toLowerCase())) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const jsFiles = getFilesRec(srcDir, ['.js', '.jsx']);
const imageFiles = getFilesRec(rootDir, ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']).filter(p => !p.includes('node_modules') && !p.includes('.git'));

// Regexes to extract imports
function findImports(content) {
  const imports = [];
  
  // Static imports with from
  const staticImportRegex = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = staticImportRegex.exec(content)) !== null) {
    imports.push({
      statement: match[0],
      identifiers: match[1],
      target: match[2],
      type: 'static'
    });
  }
  
  // Side effect imports without from, e.g. import './index.css'
  // Try to avoid matching if it has "from" in the same line or is inside comments
  const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffectImportRegex.exec(content)) !== null) {
    // Check if there is a 'from' on the line of the match
    const line = content.substring(content.lastIndexOf('\n', match.index), content.indexOf('\n', match.index));
    if (!line.includes(' from ')) {
      imports.push({
        statement: match[0],
        identifiers: '',
        target: match[1],
        type: 'side-effect'
      });
    }
  }
  
  // Dynamic imports: import("...")
  const dynamicImportRegex = /import\((?:[^'"]*)['"]([^'"]+)['"]\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push({
      statement: match[0],
      identifiers: '',
      target: match[1],
      type: 'dynamic'
    });
  }
  
  return imports;
}

// Helper to resolve imports
function resolveImport(importerPath, target) {
  if (!target.startsWith('.')) {
    return { type: 'external', path: target };
  }
  
  const importerDir = path.dirname(importerPath);
  const resolvedBase = path.resolve(importerDir, target);
  
  const candidates = [
    resolvedBase,
    resolvedBase + '.js',
    resolvedBase + '.jsx',
    resolvedBase + '.css',
    path.join(resolvedBase, 'index.js'),
    path.join(resolvedBase, 'index.jsx')
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { type: 'local', path: candidate };
    }
  }
  
  return { type: 'missing', path: resolvedBase };
}

// Parse identifiers from import clause
function extractIdentifiers(importClause) {
  const ids = [];
  const clause = importClause.trim();
  if (!clause) return ids;
  
  const braceMatch = clause.match(/\{([\s\S]*?)\}/);
  let remaining = clause;
  if (braceMatch) {
    const insideBraces = braceMatch[1];
    insideBraces.split(',').forEach(part => {
      const p = part.trim();
      if (p) {
        const aliasMatch = p.match(/\s+as\s+(\w+)/);
        if (aliasMatch) {
          ids.push(aliasMatch[1]);
        } else {
          const name = p.replace(/\/\*[\s\S]*?\*\//g, '').trim();
          if (name) ids.push(name);
        }
      }
    });
    remaining = clause.replace(/\{[\s\S]*?\}/, '');
  }
  
  remaining.split(',').forEach(part => {
    const p = part.trim();
    if (p) {
      if (p.includes('* as')) {
        const aliasMatch = p.match(/\*\s+as\s+(\w+)/);
        if (aliasMatch) ids.push(aliasMatch[1]);
      } else {
        const name = p.replace(/\/\*[\s\S]*?\*\//g, '').trim();
        if (name) ids.push(name);
      }
    }
  });
  
  return ids;
}

// Clean comments from source
function removeComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

// Main logic
console.log('--- STARTING ANALYSIS ---');

// Build dependency graph
const graph = {}; // filePath -> array of local resolved filePaths
const externalDeps = {}; // package -> count of files importing it
const allImportsInFile = {}; // filePath -> raw imports array

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const cleanContent = removeComments(content);
  const rawImports = findImports(cleanContent);
  allImportsInFile[file] = rawImports;
  
  graph[file] = [];
  
  rawImports.forEach(imp => {
    const resolved = resolveImport(file, imp.target);
    if (resolved.type === 'local') {
      if (path.extname(resolved.path) !== '.css') {
        graph[file].push(resolved.path);
      }
    } else if (resolved.type === 'external') {
      externalDeps[resolved.path] = (externalDeps[resolved.path] || 0) + 1;
    }
  });
});

// Traverse from entry point (main.jsx)
const entryFile = path.resolve(srcDir, 'main.jsx');
const visited = new Set();

function traverse(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const neighbors = graph[file] || [];
  neighbors.forEach(n => {
    traverse(n);
  });
}

if (fs.existsSync(entryFile)) {
  traverse(entryFile);
} else {
  console.error('Entry file src/main.jsx not found!');
  process.exit(1);
}

// Find unused files
const unusedFiles = [];
jsFiles.forEach(file => {
  if (!visited.has(file)) {
    unusedFiles.push(file);
  }
});

console.log(`\nReachable files count: ${visited.size}`);
console.log(`Unused JS/JSX files count: ${unusedFiles.length}`);
console.log('\n--- UNUSED FILES ---');
unusedFiles.forEach(f => {
  console.log(path.relative(rootDir, f));
});

// Find unused code / unused imports in reachable files
console.log('\n--- UNUSED IMPORTS / CODE ---');
let totalUnusedImports = 0;
visited.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rawImports = allImportsInFile[file] || [];
  
  // Clean comments and imports from code to find usage
  let codeOnly = removeComments(content);
  rawImports.forEach(imp => {
    codeOnly = codeOnly.replace(imp.statement, '');
  });
  
  const unusedInThisFile = [];
  
  rawImports.forEach(imp => {
    if (imp.type === 'static' && imp.identifiers) {
      const ids = extractIdentifiers(imp.identifiers);
      ids.forEach(id => {
        // Special exclusions for React if we want to be safe, but let's check:
        if (id === 'React' && (content.includes('<') || content.includes('React.'))) {
          // React is used implicitly in JSX (React 17 does not need it, but let's keep it if JSX exists)
          return;
        }
        
        const wordRegex = new RegExp('\\b' + id + '\\b');
        if (!wordRegex.test(codeOnly)) {
          unusedInThisFile.push({ id, target: imp.target, statement: imp.statement });
        }
      });
    }
  });
  
  if (unusedInThisFile.length > 0) {
    console.log(`\nFile: ${path.relative(rootDir, file)}`);
    unusedInThisFile.forEach(u => {
      console.log(`  Unused Identifier "${u.id}" from "${u.target}"`);
      totalUnusedImports++;
    });
  }
});

// Find unused images
const unusedImages = [];
console.log('\n--- UNUSED IMAGES ---');
const reachableFileContents = Array.from(visited).map(file => {
  return fs.readFileSync(file, 'utf8');
});
// Add index.html content to searchable contents
if (fs.existsSync(path.join(rootDir, 'index.html'))) {
  reachableFileContents.push(fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8'));
}

imageFiles.forEach(img => {
  const base = path.basename(img);
  const relativePublic = path.relative(publicDir, img);
  const relativeRoot = path.relative(rootDir, img);
  
  // Check if image filename or relative path is mentioned anywhere
  let used = false;
  for (const content of reachableFileContents) {
    if (content.includes(base) || content.includes(relativePublic.replace(/\\/g, '/'))) {
      used = true;
      break;
    }
  }
  if (!used) {
    unusedImages.push(img);
    console.log(relativeRoot);
  }
});

console.log(`\nTotal unused images: ${unusedImages.length}`);
console.log(`Total unused import items: ${totalUnusedImports}`);
console.log('---------------------------');
