const esbuild = require('esbuild');
const copyStaticFiles = require('esbuild-copy-static-files');
const path = require('path');
const fs = require('fs');

const envFiles = [
    {
        src: path.resolve('.env'),
        dest: path.resolve('dist/.env'),
    }

];

const copyEnvFiles = (files) => {
    files.forEach(({ src, dest }) => {
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        } else {
            console.warn(`No se encontró el archivo ${src}`);
        }
    });
};

// Opciones comunes para build
const buildOptions = {
    entryPoints: ['index.ts'],
    bundle: true,
    platform: 'node',
    outfile: './dist/index.js',
    sourcemap: true, // Generar source maps
    minify: process.env.NODE_ENV === 'production', // Minificar en producción
    plugins: [
        copyStaticFiles({
            src: './static',
            dest: './dist/static',
        }),
    ],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    external: ['ffmpeg-static'],
};

esbuild.build(buildOptions).then(() => {
    copyEnvFiles(envFiles);
    console.log('Build completado con éxito.');
}).catch(() => process.exit(1));