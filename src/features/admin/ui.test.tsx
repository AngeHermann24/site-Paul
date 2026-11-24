// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { click, keydown, mount } from '@/test/render';
import { AdminDrawer, AdminTable, ConfirmButton, StatusBadge } from './ui';

const text = (el: HTMLElement) => el.textContent ?? '';

describe('admin UI — StatusBadge', () => {
  it('affiche le libellé traduit du statut', () => {
    const { el } = mount(<StatusBadge value="published" />);
    expect(text(el)).toContain('Publié');
  });
  it('statut demande « new » → libellé + ton accent', () => {
    const { el } = mount(<StatusBadge value="new" />);
    expect(text(el)).toContain('Nouveau');
    expect(el.querySelector('[class*=badgeAccent]')).toBeTruthy();
  });
  it('statut inconnu → valeur brute', () => {
    const { el } = mount(<StatusBadge value="weird_status" />);
    expect(text(el)).toContain('weird_status');
  });
});

describe('admin UI — AdminTable', () => {
  const rows = [
    { id: '1', name: 'Alpha', status: 'published' },
    { id: '2', name: 'Beta', status: 'draft' },
  ];
  it('rend lignes + badges de statut', () => {
    const { el } = mount(<AdminTable columns={['name', 'status']} rows={rows} title={(r, c) => String(r[c])} />);
    expect(text(el)).toContain('Alpha');
    expect(text(el)).toContain('Publié');
    expect(text(el)).toContain('Brouillon');
  });
  it('clic + Entrée déclenchent onRowClick', () => {
    const onRow = vi.fn();
    const { el } = mount(<AdminTable columns={['name']} rows={rows} title={(r) => String(r.name)} onRowClick={onRow} />);
    const tr = el.querySelector('tbody tr')!;
    click(tr);
    tr.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onRow).toHaveBeenCalledTimes(2);
    expect(onRow.mock.calls[0]![0]).toMatchObject({ id: '1' });
  });
});

describe('admin UI — ConfirmButton', () => {
  it('demande confirmation avant d’exécuter', () => {
    const onConfirm = vi.fn();
    const { el } = mount(<ConfirmButton label="Supprimer" confirmLabel="Confirmer ?" onConfirm={onConfirm} />);
    const btn = el.querySelector('button')!;
    click(btn);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(text(btn)).toContain('Confirmer ?');
    click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('admin UI — AdminDrawer', () => {
  it('Échap ferme le panneau', () => {
    const onClose = vi.fn();
    mount(
      <AdminDrawer open onClose={onClose} title="Détail">
        <p>contenu</p>
      </AdminDrawer>,
    );
    expect(document.querySelector('[role=dialog]')).toBeTruthy();
    keydown('Escape');
    expect(onClose).toHaveBeenCalled();
  });
  it('fermé → rien rendu', () => {
    const { el } = mount(
      <AdminDrawer open={false} onClose={() => {}} title="x">
        x
      </AdminDrawer>,
    );
    expect(text(el)).toBe('');
  });
});
