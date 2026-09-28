const fs = require('fs');
const path = require('path');

const pluginPath = path.resolve(__dirname, '../node_modules/react-native-worklets/plugin/index.js');

if (fs.existsSync(pluginPath)) {
  let content = fs.readFileSync(pluginPath, 'utf8');
  const faultyTarget = 'inputMap.sourcesContent.push(fs.readFileSync(sourceFile.replace(querySuffixRE, "")).toString("utf-8"));';

  if (content.includes(faultyTarget)) {
    const safeReplacement = [
      'const resolvedPath = fs.existsSync(sourceFile) ? sourceFile : (fs.existsSync(sourceFile.replace(querySuffixRE, "")) ? sourceFile.replace(querySuffixRE, "") : sourceFile);',
      '          try {',
      '            inputMap.sourcesContent.push(fs.readFileSync(resolvedPath).toString("utf-8"));',
      '          } catch {',
      '            inputMap.sourcesContent.push("");',
      '          }'
    ].join('\n');

    content = content.replace(faultyTarget, safeReplacement);
    fs.writeFileSync(pluginPath, content, 'utf8');
    console.log('[patch-worklets] Successfully patched react-native-worklets Babel plugin for special path characters (#).');
  } else {
    console.log('[patch-worklets] react-native-worklets Babel plugin is already patched or up-to-date.');
  }
}

// 2. Patch expo-router useScreens.js fromImport undefined check
const useScreensPath = path.resolve(__dirname, '../node_modules/expo-router/build/useScreens.js');

if (fs.existsSync(useScreensPath)) {
  let content = fs.readFileSync(useScreensPath, 'utf8');
  const targetFn = 'function fromImport(value, { ErrorBoundary, SuspenseFallback, unstable_settings, ...component }) {';
  const safeFn = [
    'function fromImport(value, rawImport) {',
    '    if (!rawImport) {',
    '        console.error(`[Expo Router Error] Route "${value?.contextKey || value?.route}" is undefined or failed to export a module!`);',
    '        return { default: EmptyRoute_1.EmptyRoute };',
    '    }',
    '    const { ErrorBoundary, SuspenseFallback, unstable_settings, ...component } = rawImport;'
  ].join('\n');

  if (content.includes(targetFn)) {
    content = content.replace(targetFn, safeFn);
    fs.writeFileSync(useScreensPath, content, 'utf8');
    console.log('[patch-worklets] Successfully patched expo-router useScreens.js fromImport guard.');
  } else {
    console.log('[patch-worklets] expo-router useScreens.js is already patched or up-to-date.');
  }
}
