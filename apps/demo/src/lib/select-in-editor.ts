/** Focuses the editor, selects a range, and scrolls it into view. */
export function selectInEditor(el: HTMLTextAreaElement, offset: number, length: number) {
  el.focus();
  el.setSelectionRange(offset, offset + length);
  // Scroll the selection into view by measuring the line height.
  const line = el.value.slice(0, offset).split('\n').length - 1;
  const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
  el.scrollTop = Math.max(0, line * lineHeight - el.clientHeight / 2);
}
