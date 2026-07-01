# Como funciona a manipulação de imagem no photo-saviour

## 1. O que é uma imagem na memória

Toda imagem no browser pode ser representada como um `ImageData` — um array flat de bytes RGBA:

```
pixel 0    pixel 1    pixel 2   ...
[R G B A]  [R G B A]  [R G B A]
```

Cada canal é um número de 0 a 255. Para uma imagem de 100×100px, o array tem
`100 × 100 × 4 = 40.000 bytes`.

Para acessar o pixel na coluna `x`, linha `y`:

```ts
const idx = (y * imageWidth + x) * 4;
const r = data[idx];
const g = data[idx + 1];
const b = data[idx + 2];
const a = data[idx + 3]; // transparência: 0 = invisível, 255 = opaco
```

O tipo concreto é `Uint8ClampedArray` — "clamped" significa que qualquer valor fora
de 0–255 é automaticamente truncado, sem overflow.

---

## 2. Como a imagem entra no editor

```
File (disco)
  └─ URL.createObjectURL()      → URL temporária em memória
       └─ new Image().src = url → HTMLImageElement (decodificado pelo browser)
            └─ OffscreenCanvas.drawImage(img)
                 └─ ctx.getImageData()  → ImageData (array de bytes acessível no JS)
```

O `ImageData` extraído aqui é o que fica guardado em `layer.imageData` no Zustand.
A partir desse ponto o arquivo original não é mais necessário.

---

## 3. Pipeline de filtros (não-destrutivo)

### O problema que o design resolve

Se cada filtro modificasse o `layer.imageData` diretamente:
- Aplicar brilho +50 → salvo nos pixels
- Aplicar brilho -50 para corrigir → matematicamente você perde informação (arredondamentos)
- Undo precisaria guardar uma cópia completa do ImageData a cada ajuste

### A solução: guardar o original, renderizar o resultado

```
layer.imageData   (NUNCA modificado pelos filtros)
layer.filters     { brightness: 30, contrast: 0, saturation: -20 }
        │
        └── applyFilters(imageData, filters)
                │
                └── novo ImageData com pixels modificados
                         │
                         └── OffscreenCanvas  →  Konva renderiza esse canvas
```

O `ImageData` original permanece intacto. Mudar os sliders só altera `layer.filters`
(três números), que é barato de guardar no histórico de undo. Undo de filtro = restaurar
três números, não 48MB de pixels.

### Implementação dos filtros (`src/filters/filterPipeline.ts`)

**Brilho** — soma um offset a cada canal RGB:

```ts
const offset = (value / 100) * 255; // value em [-100, 100]
data[i]     = clamp(data[i]     + offset);
data[i + 1] = clamp(data[i + 1] + offset);
data[i + 2] = clamp(data[i + 2] + offset);
```

`value = 100` → offset = 255 → tudo branco. `value = -100` → offset = -255 → tudo preto.

**Contraste** — afasta cada canal do ponto médio (128):

```ts
const factor = (259 * (value + 255)) / (255 * (259 - value));
data[i] = clamp(factor * (data[i] - 128) + 128);
```

`factor > 1` → pixels claros ficam mais claros, escuros mais escuros (mais contraste).
`factor < 1` → tudo converge para cinza médio (menos contraste).
A fórmula específica `(259 * ...)` é uma convenção histórica que escala o parâmetro
de [-255, 255] para o fator correto.

**Saturação** — mistura o pixel com sua versão em escala de cinza:

```ts
const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b; // luminância percebida
const factor = 1 + value / 100;
data[i]     = clamp(gray + factor * (r - gray)); // puxa de volta pro valor original
data[i + 1] = clamp(gray + factor * (g - gray));
data[i + 2] = clamp(gray + factor * (b - gray));
```

`factor = 0` → só gray → imagem preto e branco.
`factor = 1` → original (sem mudança).
`factor = 2` → cores exageradas.

Os pesos `0.2126 / 0.7152 / 0.0722` refletem a sensibilidade do olho humano: vemos
muito mais verde que azul, então o verde pesa mais na luminância.

---

## 4. A borracha

### O problema de performance

Ingenuamente, a borracha modificaria `layer.imageData` a cada `mousemove`,
jogaria o resultado no Zustand, que trigaria um re-render React, que recalcularia
o `useMemo` dos filtros, que redesenharia o Konva. A 60fps com uma imagem de 48MB:

```
48MB de cópia × 60fps = ~2.8GB/s de alocação → GC não aguentou → 9GB em memória
```

### A solução: sair completamente do ciclo React durante o stroke

**`pointerdown`** — começa o stroke:
1. Copia o buffer de pixels uma única vez: `new Uint8ClampedArray(imageData.data.buffer.slice(0))`
2. Aplica os filtros uma única vez em um `OffscreenCanvas` (esse é o canvas de preview)
3. Guarda tudo em `strokeRef.current` (uma ref, não state — sem re-render)

**`pointermove`** — apaga pixels:

```
mouse → coordenada de tela
      → coordenada do Stage (desconta zoom e pan)
      → coordenada do ImageData (desconta posição e rotação da layer)
               │
               ├── eraseRawBuffer: zera canal alpha (byte[idx+3] = 0)
               │   num círculo de raio `r` ao redor do ponto
               │
               └── destination-out no OffscreenCanvas de preview:
                   ctx.globalCompositeOperation = "destination-out"
                   ctx.arc(x, y, r, 0, 2π)
                   ctx.fill()
```

`destination-out` é um modo de composição do Canvas 2D onde pintar apaga pixels
em vez de adicioná-los. Só toca os pixels dentro do círculo — O(r²) em vez de O(w×h).

O Konva é atualizado **diretamente via ref**, sem passar pelo React:

```ts
previewRef.current?.image(offscreenCanvas);
previewRef.current?.getLayer()?.batchDraw();
```

Zero re-renders. Zero alocações novas. A layer original fica escondida (`visible={false}`)
e o preview aparece no lugar.

**`pointerup`** — finaliza o stroke:
1. Cria um `ImageData` do buffer modificado: `new ImageData(rawBuffer, w, h)`
2. Chama `updateLayerImageData` no Zustand — **uma única vez**
3. O React re-renderiza normalmente, o preview some, a layer original volta visível

### Por que dois buffers separados?

`rawBuffer` (`Uint8ClampedArray`) — armazena os pixels sem filtros. É o que vai para
o `layer.imageData` no final. Se fosse apagar no canvas já com filtros e depois
extrair o ImageData, você estaria salvando uma imagem com os filtros "queimados" —
não-destrutivo quebraria.

`previewCanvas` (`OffscreenCanvas`) — tem os filtros aplicados e serve só para
renderização durante o stroke. Descartado no `pointerup`.

### Transformação de coordenadas

O mouse está em coordenadas de tela. A layer pode estar rotacionada e redimensionada.
Para saber qual pixel do ImageData apagar:

```
ponto no Stage (já descontado zoom/pan pelo toLocal())
  └── stageToImageCoords()
        1. Translada para o centro da layer (origin do Konva é top-left, da rotação é center)
        2. Rotaciona de volta pelo ângulo inverso da layer
        3. Translada de volta ao espaço local da layer (0,0 = top-left)
        4. Escala de pixel-de-layer para pixel-de-imageData (layer.width vs imageData.width)
```

---

## 5. Crop

O crop usa coordenadas do Stage (onde o retângulo foi desenhado) e precisa encontrar
a interseção com a layer:

```
cropImageData(source, sourceX, sourceY, bounds):
  1. Calcula a interseção retangular entre o ImageData e o crop bounds
  2. Cria um OffscreenCanvas do tamanho da interseção
  3. drawImage da fonte, ajustando o offset para que o canto do crop fique em (0,0)
  4. Retorna o getImageData() desse canvas — um novo ImageData menor
```

O store então atualiza `x`, `y`, `width`, `height` e `imageData` da layer para os
valores do crop. O `HTMLImageElement` também é regenerado (necessário para o Konva).

---

## 6. Export

Para gerar o arquivo final:

```
OffscreenCanvas(stageWidth, stageHeight)
  └── para cada layer visível (ordem por zIndex):
        1. applyFilters(layer.imageData, layer.filters) → ImageData com filtros
        2. OffscreenCanvas temporário com esse ImageData
        3. ctx.save()
           ctx.globalAlpha = layer.opacity
           ctx.translate(layer.x + w/2, layer.y + h/2)  // centro da layer
           ctx.rotate(angulo)
           ctx.drawImage(src, -w/2, -h/2, w, h)          // desenha centrado
           ctx.restore()
  └── canvas.convertToBlob({ type: "image/png" | "image/jpeg" })
  └── download via <a href=objectURL download>
```

A rotação é feita em torno do centro porque é assim que o Konva trata transformações.
`translate` para o centro, `rotate`, `drawImage` com offset negativo de metade das
dimensões.

---

## Resumo do fluxo de dados

```
File
 └─ HTMLImageElement
      └─ ImageData (layer.imageData) ← nunca modificado pelos filtros
           ├─ applyFilters() → ImageData filtrado → OffscreenCanvas → Konva (renderização normal)
           ├─ eraser rawBuffer → apaga pixels → updateLayerImageData (substitui layer.imageData)
           ├─ cropImageData() → ImageData menor → substitui layer.imageData
           └─ compositeToBlob() → Blob → download
```
