/** ISO yyyy-mm-dd → "6月18日（木）"; empty → "未定". */
export function isoToJP(iso: string): string {
  if (!iso) return "未定";
  const [, m, d] = iso.split("-");
  const w = ["日", "月", "火", "水", "木", "金", "土"][new Date(iso + "T00:00:00").getDay()];
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日（${w}）`;
}
