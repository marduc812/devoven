export function extractMarkdownStats(md: string): string {
  const lines = md.split('\n');
  const headings = lines.filter(l => /^#{1,6}\s/.test(l)).length;
  const links = (md.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
  const codeBlocks = (md.match(/```/g) || []).length / 2;
  const words = md.trim() ? md.trim().split(/\s+/).length : 0;
  const chars = md.length;
  return [
    `Lines:       ${lines.length}`,
    `Words:       ${words}`,
    `Characters:  ${chars}`,
    `Headings:    ${headings}`,
    `Links:       ${links}`,
    `Code blocks: ${Math.floor(codeBlocks)}`,
  ].join('\n');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
