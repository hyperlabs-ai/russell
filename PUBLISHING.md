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

## 3. Publicación automática (GitHub Actions → npm)

`.github/workflows/release.yml` publica en cada push a `main` los paquetes cuya
versión local **no exista aún** en npm. Para activarla (una sola vez):

1. En npmjs.com → Access Tokens → **Generate New Token → Granular Access Token**:
   permiso *Read and write*, scope limitado a `russell-schema` y
   `russell-validator` (tras el primer publish manual; antes, scope "all packages"),
   expiración larga.
2. En el repo de GitHub → Settings → Secrets and variables → Actions →
   **New repository secret**: nombre `NPM_TOKEN`, valor el token.

Flujo de release a partir de ahí:

1. Cambios + bump de `version` en el package.json del paquete afectado
   (si cambia el schema, bump en ambos: el validator lo consume con versión exacta).
2. Actualiza CHANGELOG.md, push a `main` (o merge del PR).
3. El workflow corre build + tests + validate, detecta qué versiones son nuevas
   y publica solo esas. Sin bump de versión, el push no publica nada.

Cómo "detecta" el monorepo y las rutas no-raíz:

- `on.push.paths: packages/**` — el workflow ni corre si el push no toca paquetes.
- El check `npm view <pkg>@<version>` — de los paquetes tocados, solo publica
  los que tienen versión nueva (bumpear la versión ES el gatillo de release).
- `npm publish -w <pkg>` — publica el workspace correcto desde la raíz.
- `repository.directory` en cada package.json — le dice a npm/GitHub en qué
  subcarpeta vive cada paquete (los links de la página de npm apuntan bien).

Opcional más adelante (paquetes ya publicados + repo ya en su URL definitiva):
**provenance**. Agrega `id-token: write` a permissions y `--provenance` al
publish — npm verifica que `repository.url` coincida con el repo que buildea,
así que actívalo hasta después de transferir el repo a hyperlabs-ai.

## Notas

- El monorepo raíz es `private: true` — nunca se publica, solo los workspaces.
- `russellVersion` (versión del FORMATO) es independiente de las versiones npm:
  solo cambia con cambios incompatibles en qué es una definición válida.
- El nombre `russell` a secas está squatteado en npm (placeholder 0.0.1 de 2022).
  El CLI sí se llama `russell` (el bin no compite con el registry). Si algún día
  quieres el nombre, el proceso es la disputa de npm support — pero renombrar un
  paquete ya publicado rompe a los consumidores; hazlo solo antes de tener adopción.
- No publiques el runtime: vive en hyperflow-llm (privado) por diseño.
