import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
	// UMD, minified
	{
		input: pkg.source,
		output: {
			file: pkg.main,
			format: 'umd',
			name: pkg.name,
			globals: {
				'symbol-tree': 'SymbolTree'
			}
		},
		external: Object.keys(pkg.dependencies),
		plugins: [buble({ objectAssign: 'Object.assign' }), terser()]
	},

	// ES6 modules
	{
		input: pkg.source,
		output: {
			file: pkg.module,
			format: 'es'
		},
		external: Object.keys(pkg.dependencies),
		plugins: [buble({ objectAssign: 'Object.assign' })]
	}
];
