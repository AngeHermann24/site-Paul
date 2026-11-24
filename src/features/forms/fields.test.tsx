// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { click, mount } from '@/test/render';
import { ConsentField, Honeypot } from './fields';

describe('formulaires — Honeypot', () => {
  it('champ piège : invisible pour les humains, exclu de la navigation clavier', () => {
    const { el } = mount(<Honeypot name="website" />);
    const input = el.querySelector('input[name=website]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.closest('[aria-hidden]')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('formulaires — ConsentField', () => {
  it('checkbox + libellé légal traduit', () => {
    const { el } = mount(<ConsentField checked={false} onChange={() => {}} />);
    const box = el.querySelector('input[type=checkbox]') as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect((box.closest('label')?.textContent ?? '').length).toBeGreaterThan(10);
  });
  it('onChange remonte la valeur + erreur en role=alert', () => {
    const onChange = vi.fn();
    const { el } = mount(<ConsentField checked={false} onChange={onChange} error="Requis" />);
    expect(el.querySelector('[role=alert]')?.textContent).toBe('Requis');
    click(el.querySelector('input[type=checkbox]'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
