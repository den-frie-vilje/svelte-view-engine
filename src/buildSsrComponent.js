let rollup = require("rollup");
let svelte = require("rollup-plugin-svelte");
let resolve = require("rollup-plugin-node-resolve");
let commonjs = require("rollup-plugin-commonjs");
let {terser} = require("rollup-plugin-terser");
let merge = require("lodash.merge");
let requireFromString = require("./utils/requireFromString");

/*
input: path to a .svelte file

output: the module.exports of the Svelte component compiled with generate: ssr
(server-side rendering).

The SSR module is an object with a render method, which takes props and returns

{
	head,
	html,
	css: {
		code,
		map
	}
}
*/

module.exports = async (path, options, cache) => {
	let inputOptions = {
		input: path,
		cache,
		plugins: [
			svelte(merge({
				generate: "ssr",
			}, options.svelte)),
	
			resolve({
				browser: true
			}),
			
			commonjs(),
	
			options.minify && terser()
		],
	};
	
	let outputOptions = {
		format: "cjs",
	};
	
	let bundle = await rollup.rollup(inputOptions);
	
	let {output} = await bundle.generate(outputOptions);
	
	return {
		cache: bundle.cache,
		component: await requireFromString(output[0].code),
	};
}
