import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';

// Use ESLint's existing parser without importing or running application modules.
const { parse } = createRequire(import.meta.resolve('eslint'))('espree');
const project = resolve(process.argv[2] ?? '.');
const output = resolve(process.argv[3] ?? resolve(project, 'docs/navigation.d2'));
const source = ['src/commands', 'tgcloud/lib/views'].map((path) => resolve(project, path)).find(existsSync);

if (!source) {
  throw new Error('Expected src/commands or tgcloud/lib/views');
}

const files = new Map();
const modules = new Map();
const routes = [];
const buttons = [];

function walk(node, visit, owner) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (node.type === 'FunctionDeclaration') {
    owner = node.id.name;
  }

  if (node.type) {
    visit(node, owner);
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((child) => walk(child, visit, owner));
    } else if (value && typeof value === 'object') {
      walk(value, visit, owner);
    }
  }
}

function moduleFor(file) {
  const name = relative(source, file).split('/')[0].replace(/\.js$/, '');

  if (!modules.has(name)) {
    modules.set(name, { commands: new Set(), actions: new Set(), input: false });
  }

  return name;
}

function patterns(node) {
  if (node?.type === 'ArrayExpression') {
    return node.elements.flatMap(patterns);
  }

  if (node?.regex) {
    return [{ text: `/${node.regex.pattern}/${node.regex.flags}`, regex: new RegExp(node.regex.pattern, node.regex.flags) }];
  }

  if (typeof node?.value === 'string') {
    return [{ text: node.value }];
  }

  if (node?.type === 'TemplateLiteral') {
    return [{ text: node.quasis.map((part) => part.value.cooked).join('*'), template: true }];
  }

  return [];
}

function load(file) {
  if (files.has(file)) {
    return;
  }

  const ast = parse(readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
  const imports = new Map();

  files.set(file, { ast, imports });

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration' || !statement.source.value.startsWith('.')) {
      continue;
    }

    const target = resolve(dirname(file), statement.source.value);

    if (!target.startsWith(`${source}/`)) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      imports.set(specifier.local.name, target);
    }

    load(target);
  }
}

load(resolve(source, 'index.js'));

for (const [file, { ast, imports }] of files) {
  const from = moduleFor(file);

  walk(ast, (node, owner) => {
    const condition = node.test?.expression ?? node.test;

    if (node.type === 'IfStatement' && owner === 'handleCallback' && condition?.callee?.property?.name === 'startsWith') {
      const prefix = condition.arguments[0]?.value;

      if (typeof prefix === 'string') {
        walk(node.consequent, (child) => {
          const target = child.type === 'ReturnStatement' && imports.get(child.argument?.callee?.name);

          if (target) {
            routes.push({ text: `${prefix}*`, template: true, target: moduleFor(target), command: false });
          }
        });
      }
    }

    if (node.type === 'SwitchStatement' && ['handleMessage', 'handleCallback'].includes(owner)) {
      let pending = [];

      for (const branch of node.cases) {
        pending.push(...patterns(branch.test));

        if (!branch.consequent.length) {
          continue;
        }

        const returned = branch.consequent.find((statement) => statement.type === 'ReturnStatement')?.argument;
        const target = imports.get(returned?.callee?.name);

        if (target) {
          routes.push(...pending.map((pattern) => ({ ...pattern, target: moduleFor(target), command: owner === 'handleMessage' })));
        }

        pending = [];
      }
    }

    if (node.type !== 'CallExpression') {
      return;
    }

    const method = node.callee.property?.name;

    if (['command', 'callbackQuery'].includes(method)) {
      const selectors = patterns(node.arguments[0]);

      if (!selectors.length) {
        throw new Error(`Unsupported ${method} selector in ${relative(project, file)}`);
      }

      routes.push(...selectors.map((pattern) => ({ ...pattern, target: from, command: method === 'command' })));
    }

    if (method === 'text' && node.arguments.length >= 2) {
      const label = node.arguments[0]?.arguments?.[0]?.value;

      if (typeof label !== 'string' || !/^(menu\.)?back$/.test(label)) {
        const selectors = patterns(node.arguments[1]);

        if (!selectors.length) {
          throw new Error(`Unsupported button data in ${relative(project, file)}`);
        }

        buttons.push(...selectors.map((pattern) => ({ ...pattern, from })));
      }
    }

    if (method === 'waitFor') {
      modules.get(from).input = true;
    }
  });
}

const edges = new Set();
const unresolved = new Set();
const menu = routes.find((route) => route.command && route.text === 'menu')?.target;

for (const route of routes.filter((route) => route.command)) {
  modules.get(route.target).commands.add(`/${route.text}`);
}

for (const button of buttons) {
  const matches = routes.filter((route) => {
    if (route.command) {
      return false;
    }

    if (button.template) {
      const prefix = button.text.split('*')[0];
      const routePrefix = route.regex?.source.match(/^\^([a-zA-Z0-9_:-]+)/)?.[1];

      return prefix && (route.text.startsWith(prefix) || (routePrefix && prefix.startsWith(routePrefix)));
    }

    if (route.template) {
      const expression = route.text.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');

      return new RegExp(`^${expression}$`).test(button.text);
    }

    return route.regex ? new RegExp(route.regex).test(button.text) : route.text === button.text;
  });
  const targets = new Set(matches.map((route) => route.target));

  if (targets.size !== 1) {
    unresolved.add(`${button.from}: ${button.text}`);
    continue;
  }

  const [to] = targets;

  if (to === button.from) {
    modules.get(to).actions.add(button.text.split(':')[0]);
  } else if (to !== menu) {
    edges.add(`${button.from}\n${to}`);
  }
}

if (unresolved.size) {
  throw new Error(`Cannot resolve callback buttons unambiguously: ${[...unresolved].join(', ')}`);
}

const visible = [...modules].filter(([name]) => name !== 'index');
const ids = new Map(visible.map(([name], index) => [name, `module_${index}`]));
const quote = (value) => JSON.stringify(value).replaceAll('$', '\\$');
const lines = ['# Generated by scripts/navigation.js — do not edit', 'direction: right', 'vars: { d2-config: { pad: 24 } }', '*.style.font-size: 20'];

for (const [name, value] of visible) {
  const title = name.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase());
  const actions = [...value.actions].filter((action) => action !== name);
  const actionLabel = actions.length > 2 ? `${actions.length} internal actions` : actions.map((action) => action.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())).join('\n');
  const label = [title, [...value.commands].join(' '), actionLabel, value.input ? 'Wait for user input' : ''].filter(Boolean).join('\n');

  lines.push(`${ids.get(name)}: ${quote(label)}`);
}

for (const edge of edges) {
  const [from, to] = edge.split('\n');

  lines.push(`${ids.get(from)} -> ${ids.get(to)}`);
}

lines.push('# Modules are grouped; Back, returns to menu and internal callback edges are omitted');

for (const route of routes) {
  lines.push(`# ${route.command ? 'Command' : 'Callback'}: ${route.text} -> ${route.target}`);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${lines.join('\n')}\n`);
console.log(`Generated ${relative(project, output)}: ${visible.length} modules, ${routes.length} routes`);
