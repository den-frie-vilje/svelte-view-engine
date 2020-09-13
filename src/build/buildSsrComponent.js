let fs = require("flowfs/mkdirp");
let rollup = require("rollup");
let svelte = require("rollup-plugin-svelte");
let resolve = require("rollup-plugin-node-resolve");
let commonjs = require("rollup-plugin-commonjs");
let sass = require("./sass");

module.exports = async function(path, config, cache) {
	let dev = config.env === "dev";
	let css;
	
	let inputOptions = {
		input: path,
		
		external(id, parentId, resolved) {
			if (!config.svelteDirs) {
				return false;
			}
			
			let file;
			let root = fs(__dirname).rel("../..");
			
			if (id.match(/^\./)) {
				file = fs(parentId).sibling(id);
			} else {
				file = root.child("node_modules").child(id);
			}
			
			return config.svelteDirs.every(function(dir) {
				return file.path !== dir.path && !file.within(dir);
			});
		},
		
		cache,
		
		plugins: [
			svelte({
				generate: "ssr",
				
				preprocess: {
					style: sass,
				},
				
				css(c) {
					css = c;
				},
				
				onwarn() {},
			
				dev,
			}),
	
			resolve({
				browser: true,
			}),
			
			commonjs(),
		],
		
		onwarn(warning, next) {
			if (warning.code !== "UNUSED_EXTERNAL_IMPORT") {
				next(warning);
			}
		},
	};
	
	let outputOptions = {
		format: "cjs",
	};
	
	let bundle = await rollup.rollup(inputOptions);
	
	//await bundle.write({
	//	dir: fs(path).parent.path,
	//});
	
	let {output} = await bundle.generate(outputOptions);
	
	return {
		cache: dev && bundle.cache,
		component: output[0].code,
		css,
	};
}
