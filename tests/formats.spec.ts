import { describe, expect, test } from 'vitest'
import { extensionOf, formatFor, formatLabelFor } from '../src/client/formats.ts'

describe('extensionOf', () => {
  test('extracts a lowercase extension from a workspace-relative path', () => {
    expect(extensionOf('dir/2W72.pdb')).toBe('pdb')
    expect(extensionOf('2W72.PDB')).toBe('pdb')
    expect(extensionOf('a/b/c.mmCIF')).toBe('mmcif')
  })

  test('returns empty string when there is no extension', () => {
    expect(extensionOf('README')).toBe('')
    expect(extensionOf('dir/trailing.')).toBe('')
    expect(extensionOf('')).toBe('')
  })
})

describe('formatFor', () => {
  test('maps structure/small-molecule extensions to Mol* trajectory formats', () => {
    expect(formatFor('cif')).toBe('mmcif')
    expect(formatFor('mmcif')).toBe('mmcif')
    expect(formatFor('mcif')).toBe('mmcif')
    expect(formatFor('bcif')).toBe('mmcif')
    expect(formatFor('pdb')).toBe('pdb')
    expect(formatFor('ent')).toBe('pdb')
    expect(formatFor('pdbqt')).toBe('pdbqt')
    expect(formatFor('pqr')).toBe('pqr')
    expect(formatFor('sdf')).toBe('sdf')
    expect(formatFor('sd')).toBe('sdf')
    expect(formatFor('mol')).toBe('mol')
    expect(formatFor('mol2')).toBe('mol2')
    expect(formatFor('xyz')).toBe('xyz')
    expect(formatFor('gro')).toBe('gro')
  })

  test('returns null for unknown extensions', () => {
    expect(formatFor('')).toBeNull()
    expect(formatFor('txt')).toBeNull()
    expect(formatFor('zzz')).toBeNull()
  })
})

describe('formatLabelFor', () => {
  test('returns a human-readable label for known extensions', () => {
    expect(formatLabelFor('cif')).toBe('mmCIF')
    expect(formatLabelFor('bcif')).toBe('BinaryCIF')
    expect(formatLabelFor('pdb')).toBe('PDB')
  })

  test('returns null for unknown extensions', () => {
    expect(formatLabelFor('txt')).toBeNull()
  })
})
