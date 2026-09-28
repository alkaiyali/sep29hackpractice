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
