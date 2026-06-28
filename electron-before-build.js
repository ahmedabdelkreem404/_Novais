exports.default = async function beforeBuild() {
  // The packaged app loads a static CRA bundle plus Electron built-ins only.
  // Returning false tells electron-builder not to scan/copy runtime node_modules,
  // which otherwise stalls Windows packaging on this project.
  return false;
};
