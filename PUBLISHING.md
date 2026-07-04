# Publishing playbook

Pasos exactos para publicar Russell en GitHub y npm. Los paquetes son
**unscoped** (`russell-schema`, `russell-validator` — ambos verificados libres),
así que no hace falta org de npm: publicas directo desde tu cuenta personal.
Ya traen `prepublishOnly: build`, metadata de repo y LICENSE incluido.

## 1. GitHub (cuenta personal primero)

```bash
cd C:\Users\mdjes\dev\hyper\russell
gh repo create <tu-usuario>/russell --public --source . --push
```

Cuando lo transfieras a la org (`Settings → Transfer ownership → hyperlabs-ai`),
GitHub deja redirect automático del URL viejo. Las URLs de `repository` en los
package.json ya apuntan a `hyperlabs-ai/russell` (el destino final); hasta la
transferencia ese link estará "adelantado".

## 2. npm

Orden: schema primero (el validator depende de él):

```bash
npm login
npm publish -w russell-schema
npm publish -w russell-validator
```

`prepublishOnly` recompila antes de cada publish. Verifica:

```bash
npm view russell-schema
npx --package=russell-validator russell node-types
```

Para transferir los paquetes a la org npm más adelante (opcional; los unscoped
no necesitan org): en npmjs.com, package → Settings → invita a la org como
maintainer, o `npm owner add <org-user> russell-schema`.

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
- El nombre `russell` a secas está squatteado en npm (placeholder 0.0.1 de 2022).
  El CLI sí se llama `russell` (el bin no compite con el registry). Si algún día
  quieres el nombre, el proceso es la disputa de npm support — pero renombrar un
  paquete ya publicado rompe a los consumidores; hazlo solo antes de tener adopción.
- No publiques el runtime: vive en hyperflow-llm (privado) por diseño.
