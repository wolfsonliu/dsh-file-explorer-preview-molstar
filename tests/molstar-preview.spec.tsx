// @vitest-environment jsdom
import { act } from 'react'
import { describe, expect, test } from 'vitest'
import { createRoot } from 'react-dom/client'
import type { PreviewProps } from '@dsh-external/dsh-file-explorer/client'
import { makeMolstarPreview } from '../src/client/MolstarPreview.tsx'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const t = ((key: string) => `T:${key}`) as PreviewProps['t']
const noopReadRaw = async () => new ArrayBuffer(0)

function render(element: React.ReactElement): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(element)
  })
  return container
}

describe('MolstarPreview', () => {
  test('returns null for a non-structure preview kind without mounting Mol*', () => {
    const Preview = makeMolstarPreview(noopReadRaw, t)
    const preview: PreviewProps['preview'] = {
      kind: 'image', name: 'x.png', mime: 'image/png', dataUrl: 'data:image/png;base64,', size: 1,
    }

    const container = render(<Preview preview={preview} filePath="x.png" activeView="preview" t={t} />)

    expect(container.querySelector('.dsh-ms')).toBeNull()
    expect(container.textContent).toBe('')
  })

  test('renders an unsupported message for a text file with no known structure extension', () => {
    const Preview = makeMolstarPreview(noopReadRaw, t)
    const preview: PreviewProps['preview'] = {
      kind: 'text', name: 'README', extension: '', content: 'hi', size: 2,
    }

    const container = render(<Preview preview={preview} filePath="README" activeView="preview" t={t} />)

    expect(container.querySelector('.dsh-ms')).not.toBeNull()
    expect(container.textContent).toContain('T:unsupported')
  })
})
