# Publishing playbook

Pasos exactos para publicar Russell en GitHub y npm. Los paquetes ya traen
`publishConfig.access: public`, `prepublishOnly: build`, metadata de repo y LICENSE.

## 1. GitHub (cuenta personal primero)

```bash
cd C:\Users\mdjes\dev\hyper\russell
git push -u origin main        # el remoto se crea con: gh repo create <tu-usuario>/russell --public --source . --push
```

Cuando lo transfieras a la org (`Settings → Transfer ownership → hyperlabs-ai`),
GitHub deja redirect automático del URL viejo. Las URLs de `repository` en los
package.json ya apuntan a `hyperlabs-ai/russell` (el destino final); si publicas
primero bajo tu usuario, npm mostrará el link roto solo hasta la transferencia.

## 2. npm

Los paquetes usan el scope `@hyperlabs-ai`. Para publicarlos necesitas que el
scope exista y seas miembro:

1. Crea la org en npm (gratis para paquetes públicos): https://www.npmjs.com/org/create → nombre `hyperlabs-ai`. Se crea desde tu cuenta personal y tú quedas de owner — no hay "vincular después": los paquetes scoped nacen en el scope de la org.
2. Login y publica (orden: schema primero, el validator depende de él):

```bash
npm login
npm publish -w @hyperlabs-ai/russell-schema
npm publish -w @hyperlabs-ai/russell-validator
```

`prepublishOnly` recompila antes de cada publish. Verifica con:

```bash
npm view @hyperlabs-ai/russell-schema
npx --package=@hyperlabs-ai/russell-validator russell node-types
```

## 3. Releases siguientes

1. Cambios + `npm test` en verde.
2. Bump de versión en el/los package.json afectados (si cambia el schema, bump
   en ambos: el validator lo consume con versión exacta).
3. Actualiza CHANGELOG.md.
4. `npm publish -w <paquete>` y tag de git (`git tag v0.2.0 && git push --tags`).

## Notas

- El monorepo raíz es `private: true` — nunca se publica, solo los workspaces.
- `russellVersion` (versión del FORMATO) es independiente de las versiones npm:
  solo cambia con cambios incompatibles en qué es una definición válida.
- No publiques el runtime: vive en hyperflow-llm (privado) por diseño.
