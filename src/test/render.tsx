import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';

// @ts-expect-error — nécessaire pour React.act en environnement de test
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Monte un composant dans jsdom sans Testing Library. */
export function mount(node: ReactNode): { el: HTMLElement; unmount: () => Promise<void> } {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(node);
  });
  return {
    el,
    unmount: async () => {
      await act(async () => root.unmount());
      el.remove();
    },
  };
}

/** Simule un clic réel (propagation → React synthetic events), flushé via act(). */
export const click = (el: Element | null | undefined) =>
  act(() => {
    el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

export const keydown = (key: string, target: EventTarget = document) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });

/** Change la valeur d'un input/textarea/select puis déclenche l'événement natif (onChange React). */
export function setValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string | boolean) {
  const proto = el instanceof HTMLInputElement ? HTMLInputElement : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLSelectElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, el instanceof HTMLInputElement && el.type === 'checkbox' ? 'checked' : 'value')!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event(el instanceof HTMLInputElement && el.type === 'checkbox' ? 'click' : 'input', { bubbles: true }));
  });
}
