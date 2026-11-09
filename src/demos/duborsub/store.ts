/**
 * Visitor state for the demo: kept only in this browser (SPEC F12). Every read is validated
 * by `parseVisitor`, and storage failures (private mode, blocked storage) degrade to in-memory.
 */
import { emptyVisitor, parseVisitor, type VisitorState } from './model';

const KEY = 'duborsub-demo:v1';
let memory: VisitorState = emptyVisitor();

export function loadVisitor(): VisitorState {
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? parseVisitor(JSON.parse(raw)) : emptyVisitor();
  } catch {
    /* storage blocked or corrupt: keep the in-memory copy */
  }
  return memory;
}

export function saveVisitor(state: VisitorState): void {
  memory = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or privacy mode: state still works for this visit */
  }
}

export function resetVisitor(): VisitorState {
  memory = emptyVisitor();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return memory;
}
