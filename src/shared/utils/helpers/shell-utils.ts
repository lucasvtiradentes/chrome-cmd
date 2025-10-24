import { PathHelper } from './path.helper.js';

export function detectShell(): 'bash' | 'zsh' | 'powershell' | 'cmd' | null {
  if (PathHelper.isWindows()) {
    const comspec = process.env.COMSPEC?.toLowerCase() || '';
    if (comspec.includes('cmd.exe')) {
      return 'cmd';
    }

    const shell = process.env.SHELL?.toLowerCase() || '';
    if (shell.includes('powershell') || shell.includes('pwsh')) {
      return 'powershell';
    }

    return 'powershell';
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

export function getShellRestartCommand(shell: 'bash' | 'zsh' | 'powershell' | 'cmd' | null): string {
  if (shell === 'zsh') {
    return 'exec zsh';
  }
  if (shell === 'bash') {
    return 'exec bash';
  }
  if (shell === 'powershell') {
    return '. $PROFILE';
  }
  if (shell === 'cmd') {
    return 'Restart your command prompt';
  }
  return 'Restart your shell or terminal';
}
