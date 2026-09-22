# Mapa do Maroto · edição 19 anos

Site feito para o aniversário de 19 anos da Jhullya Isabela — 21 de setembro.
Um Mapa do Maroto cor-de-rosa com carta, música, fotos e promessas.

**Online:** https://iuxyog.github.io/mapa-do-maroto/

## O que tem

1. **Portão** — "Juro solenemente que estou apaixonado por você" abre o mapa (e liga a música).
2. **Música** — *teenage dream* (Olivia Rodrigo). Usa o clipe oficial do YouTube, ou um MP3 local
   se existir `musica/teenage-dream.mp3` (veja `musica/LEIA-ME.txt`).
3. **Carta** — o texto de aniversário.
4. **Mapa** — pegadas ligando 7 lugares; cada pino abre uma foto com legenda.
5. **Fotos** — as mesmas 7 fotos em polaroids.
6. **19 coisas** — uma pra cada ano.
7. **Promessas + Malfeito feito** — selo de cera fecha o mapa.

## Rodar local

```bash
python -m http.server 5173
```

Abra http://localhost:5173. Use `?aberto` no fim da URL pra pular o portão.

## Editar

| O quê | Onde |
| --- | --- |
| Carta, 19 coisas, promessas | `index.html` |
| Legendas e posição dos pinos | `app.js` → `PHOTOS` (x/y no viewBox 1000×700) |
| Cômodos do mapa | `index.html` → `<g class="rooms">` |
| Cores e fontes | `styles.css` → `:root` |
| Vídeo da música | `app.js` → `YT_ID` |

Trocar fotos: substitua `fotos/foto-0N.jpg` e gere o thumb de novo (`fotos/thumb-0N.jpg`, 640px).

## Publicar

Push na branch `main` → GitHub Pages publica sozinho.
