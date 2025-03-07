let cluster = require("cluster");
let fs = require("flowfs");

module.exports = async function(code, path) {
	let prefix = ".requireFromString-" + Math.random() + "-" + (cluster.isWorker ? cluster.worker.id + "-" : "");
	let file = fs(path.replace(/\.js$/, ".cjs"));
	let tmpFile = file.sibling(prefix + file.name);
	
	await tmpFile.write(code);
	
	delete require.cache[require.resolve(tmpFile.path)];
	
	let module;
	
	try {
		module = require(tmpFile.path);
	} finally {
		await tmpFile.delete();
	}
	
	return module;
}
