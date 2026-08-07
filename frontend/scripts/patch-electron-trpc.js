const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/electron-trpc/dist/renderer.cjs',
  'node_modules/electron-trpc/dist/renderer.mjs',
  'node_modules/electron-trpc/dist/main.cjs',
  'node_modules/electron-trpc/dist/main.mjs',
  'node_modules/electron-trpc/dist/renderer.d.ts',
  'node_modules/electron-trpc/src/renderer/ipcLink.ts',
  'node_modules/electron-trpc/src/main/handleIPCMessage.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace renderer input
    content = content.replace(
      'e.input = r.transformer.serialize(e.input);',
      'e.input = (r.transformer ? r.transformer.serialize(e.input) : e.input);'
    );
    content = content.replace(
      'e.input=r.transformer.serialize(e.input);',
      'e.input=(r.transformer ? r.transformer.serialize(e.input) : e.input);'
    );
    content = content.replace(
      'op.input = runtime.transformer.serialize(op.input);',
      'op.input = (runtime.transformer ? runtime.transformer.serialize(op.input) : op.input);'
    );

    // Replace renderer output deserialize
    content = content.replace(
      'const s=n.transformer.deserialize(r.error)',
      'const s=(n.transformer ? n.transformer.deserialize(r.error) : r.error)'
    );
    content = content.replace(
      'const deserializedError = runtime.transformer.deserialize(response.error);',
      'const deserializedError = (runtime.transformer ? runtime.transformer.deserialize(response.error) : response.error);'
    );
    content = content.replace(
      'data:n.transformer.deserialize(r.result.data)',
      'data:(n.transformer ? n.transformer.deserialize(r.result.data) : r.result.data)'
    );
    content = content.replace(
      'data: n.transformer.deserialize(r.result.data)',
      'data: (n.transformer ? n.transformer.deserialize(r.result.data) : r.result.data)'
    );
    content = content.replace(
      'data: runtime.transformer.deserialize(response.result.data)',
      'data: (runtime.transformer ? runtime.transformer.deserialize(response.result.data) : response.result.data)'
    );

    // Replace main output error
    content = content.replace(
      'error: n.transformer.output.serialize(r.error)',
      'error: (n.transformer && n.transformer.output ? n.transformer.output.serialize(r.error) : r.error)'
    );
    content = content.replace(
      'error:n.transformer.output.serialize(r.error)',
      'error:(n.transformer && n.transformer.output ? n.transformer.output.serialize(r.error) : r.error)'
    );

    // Replace main output data
    content = content.replace(
      'data: n.transformer.output.serialize(r.result.data)',
      'data: (n.transformer && n.transformer.output ? n.transformer.output.serialize(r.result.data) : r.result.data)'
    );
    content = content.replace(
      'data:n.transformer.output.serialize(r.result.data)',
      'data:(n.transformer && n.transformer.output ? n.transformer.output.serialize(r.result.data) : r.result.data)'
    );

    // Replace main input deserialize
    content = content.replace(
      'n._def._config.transformer.input.deserialize(g)',
      '(n._def._config.transformer && n._def._config.transformer.input ? n._def._config.transformer.input.deserialize(g) : g)'
    );
    content = content.replace(
      'router._def._config.transformer.input.deserialize(serializedInput)',
      '(router._def._config.transformer && router._def._config.transformer.input ? router._def._config.transformer.input.deserialize(serializedInput) : serializedInput)'
    );

    // Replace getErrorShape missing method in tRPC v11
    content = content.replace(
      'n.getErrorShape({error:f,type:p,path:c,input:t,ctx:o})',
      '(n.getErrorShape ? n.getErrorShape({error:f,type:p,path:c,input:t,ctx:o}) : { message: f.message, code: f.code || -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } })'
    );
    content = content.replace(
      'n.getErrorShape({error:h,type:p,path:c,input:t,ctx:o})',
      '(n.getErrorShape ? n.getErrorShape({error:h,type:p,path:c,input:t,ctx:o}) : { message: h.message, code: h.code || -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } })'
    );
    content = content.replace(
      'router.getErrorShape({',
      '(router.getErrorShape ? router.getErrorShape({'
    );
    content = content.replace(
      'ctx,\n      })',
      'ctx,\n      }) : { message: trpcError.message, code: trpcError.code || -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } })'
    );

    // Replace te function procedure check for tRPC v11
    content = content.replace(
      /function te\(n\)\{[\s\S]*?return [a-zA-Z0-9_$]+\(n\)\}/,
      `async function te(n) { const { callTRPCProcedure } = require('@trpc/server'); return callTRPCProcedure({ router: n.router || n.procedures._def?.router || n.procedures, ctx: n.ctx, path: n.path, getRawInput: async () => n.rawInput, type: n.type }); }`
    );
    // Fix getRawInput for tRPC v11
    content = content.replace(
      'rawInput: n.rawInput, type: n.type }); }',
      'getRawInput: async () => n.rawInput, type: n.type }); }'
    );
    content = content.replace(
      'rawInput: opts.rawInput, type: opts.type }); }',
      'getRawInput: async () => opts.rawInput, type: opts.type }); }'
    );
    // Minified versions:
    content = content.replace(
      /async function [a-zA-Z0-9_$]+\(n\)\{return n.procedures\[n.path\]\(\{path:n.path,rawInput:n.rawInput,ctx:n.ctx,type:n.type\}\)\}/,
      `async function te(n) { const { callTRPCProcedure } = require('@trpc/server'); return callTRPCProcedure({ router: n.router || n.procedures._def?.router || n.procedures, ctx: n.ctx, path: n.path, getRawInput: async () => n.rawInput, type: n.type }); }`
    );

    // Some versions of electron-trpc might not use 'te', they might have the unminified version:
    content = content.replace(
      /async function callProcedure\(opts\).*?return proc\(opts\);/g,
      "async function callProcedure(opts) { const { callTRPCProcedure: trpcCall } = require('@trpc/server'); return trpcCall({ router: opts.router || opts.procedures, ctx: opts.ctx, path: opts.path, rawInput: opts.rawInput, type: opts.type }); }"
    );

    // Pass the router directly instead of procedures
    content = content.replace(
      'const d=await te({ctx:o,path:c,procedures:n._def.procedures,rawInput:t,type:p})',
      'const d=await te({ctx:o,path:c,router:n,rawInput:t,type:p})'
    );
    content = content.replace(
      'const data = await callProcedure({ ctx, path, procedures: router._def.procedures, rawInput, type });',
      'const data = await callProcedure({ ctx, path, router, rawInput, type });'
    );

    if (file.includes('renderer')) {
      content = content.replace(
        /function ipcLink\(\)\s*\{\s*return\s*\(?(.*?)\)?\s*=>\s*\{/g,
        'function ipcLink(opts = {}) { return $1 => { $1.transformer = opts.transformer || $1.transformer;'
      );
      // Minified/ESM versions with spaces:
      content = content.replace(
        /function ([a-zA-Z0-9_$]+)\(\)\s*\{\s*return\s*\(([a-zA-Z0-9_$]+)\)\s*=>\s*\{\s*const ([a-zA-Z0-9_$]+)\s*=\s*new ([a-zA-Z0-9_$]+)\(\);/g,
        (match, funcName, runtimeVar, classVar, className) => `function ${funcName}(opts = {}) { return (${runtimeVar}) => { ${runtimeVar}.transformer = opts.transformer || ${runtimeVar}.transformer; const ${classVar} = new ${className}();`
      );
      content = content.replace(
        /function ([a-zA-Z0-9_$]+)\(\)\{return ([a-zA-Z0-9_$]+)=>{const ([a-zA-Z0-9_$]+)=new [a-zA-Z0-9_$]+;/g,
        (match, funcName, runtimeVar, classVar) => `function ${funcName}(opts = {}){return ${runtimeVar}=>{${runtimeVar}.transformer = opts.transformer || ${runtimeVar}.transformer;const ${classVar}=new oe;`
      );
    }
    
    // Fix for typescript definitions
    if (file.endsWith('.d.ts')) {
      content = content.replace(
        /export declare function ipcLink<TRouter extends AnyRouter>\(\): TRPCLink<TRouter>;/g,
        'export declare function ipcLink<TRouter extends AnyRouter>(opts?: { transformer?: any }): TRPCLink<TRouter>;'
      );
    }

    fs.writeFileSync(filePath, content);
    console.log(`Patched ${file}`);
  }
}
