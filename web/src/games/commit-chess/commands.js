/**
 * Command pattern — each git verb maps to a reduce action.
 * Invokers (buttons / terminal) call execute(commandId, payload).
 */

export const COMMANDS = [
  { id: 'add', label: 'git add', hint: 'Stage selected move (click target)' },
  { id: 'commit', label: 'git commit', hint: 'Confirm staged move with a message' },
  { id: 'push', label: 'git push', hint: 'Apply staged commit and end turn' },
  { id: 'rebase', label: 'git rebase', hint: 'Knight-hop from selected piece' },
  { id: 'merge', label: 'git merge', hint: 'Merge adjacent friendly into selected' },
  { id: 'cherry-pick', label: 'git cherry-pick', hint: 'Replay last enemy delta' },
  { id: 'revert', label: 'git revert', hint: 'Undo last capture once' },
  { id: 'reset-soft', label: 'git reset', hint: 'Clear staging area' },
];

export function commandToAction(commandId, payload = {}) {
  switch (commandId) {
    case 'commit':
      return { type: 'commit', message: payload.message };
    case 'push':
      return { type: 'push' };
    case 'rebase':
      return { type: 'rebase', r: payload.r, c: payload.c };
    case 'merge':
      return { type: 'merge', r: payload.r, c: payload.c };
    case 'cherry-pick':
      return { type: 'cherryPick' };
    case 'revert':
      return { type: 'revert' };
    case 'reset-soft':
      return { type: 'clearStage' };
    case 'add':
    default:
      return null;
  }
}
