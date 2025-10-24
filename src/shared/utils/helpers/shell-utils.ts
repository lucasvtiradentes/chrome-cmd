import { PathHelper } from './path.helper.js';

export function detectShell(): 'bash' | 'zsh' | null {
  if (PathHelper.isWindows()) {
    return null;
  }

  const currentShell = process.env.SHELL || '';

  if (currentShell.includes('zsh')) {
    return 'zsh';
  }

  if (currentShell.includes('bash')) {
    return 'bash';
  }

  return null;
}

export function getShellRestartCommand(shell: 'bash' | 'zsh' | null): string {
  if (shell === 'zsh') {
    return 'exec zsh';
  }
  if (shell === 'bash') {
    return 'exec bash';
  }
  return 'Restart your shell or terminal';
}
