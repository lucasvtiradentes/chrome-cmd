export async function ping(): Promise<{ status: string; message: string }> {
  return { status: 'ok', message: 'pong' };
}
