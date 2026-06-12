import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import type { Comment, ReactionKey } from "./types.js";

interface SeedSheet {
  id: string;
  nickname: string;
  fullname: string;
  avatar: number;
  avColor: number;
  deptIdx: number;
  catch: string;
  hobbies: string[];
  recent: string;
  resolution: string;
  wishlist: string;
  pin: string;
  lunchDate: string;
  reactions: Record<ReactionKey, number>;
  comments: Comment[];
}

// Ported verbatim from the design's data.jsx sample sheets.
const SEED_SHEETS: SeedSheet[] = [
  {
    id: "s1", nickname: "ぴょん", fullname: "高橋 美咲",
    avatar: 5, avColor: 0, deptIdx: 0,
    catch: "毎日にときめきを探してます♡",
    hobbies: ["カフェめぐり", "おかし作り", "韓国ドラマ"],
    recent: "近所に新しいカフェができて、いちごラテが最高だった♪",
    resolution: "おかし作りの腕を上げて、みんなに配ること！",
    wishlist: "京都の古民家カフェめぐりをしてみたい",
    pin: "1234", lunchDate: "2026-06-18",
    reactions: { heart: 12, star: 5, clap: 3, smile: 8 },
    comments: [
      { by: "らて", avatar: 2, avColor: 2, text: "カフェ情報おしえて〜！🍓" },
      { by: "そら", avatar: 1, avColor: 3, text: "よろしくね！おかし楽しみ♪" },
    ],
  },
  {
    id: "s2", nickname: "らて", fullname: "中村 一花",
    avatar: 2, avColor: 2, deptIdx: 3,
    catch: "ねこと音楽があれば生きていける",
    hobbies: ["ギター", "ねこカフェ", "二度寝"],
    recent: "保護ねこちゃんが3びき目の里親に決まってうれしかった",
    resolution: "ギターでオリジナル曲を1曲完成させる！",
    wishlist: "ねこ島（田代島）に行ってみたい",
    pin: "2580", lunchDate: "",
    reactions: { heart: 9, star: 11, clap: 2, smile: 4 },
    comments: [{ by: "ぴょん", avatar: 5, avColor: 0, text: "ねこちゃん見せて〜！🐱" }],
  },
  {
    id: "s3", nickname: "そら", fullname: "渡辺 蒼",
    avatar: 1, avColor: 3, deptIdx: 2,
    catch: "コードもおやつもバグらせない",
    hobbies: ["ゲーム", "ガジェット", "ラーメン"],
    recent: "ずっと欲しかったキーボードが届いてタイピングが快適になった",
    resolution: "個人開発のアプリをリリースまでやりきる",
    wishlist: "海外のゲーム開発カンファレンスに参加したい",
    pin: "0512", lunchDate: "2026-06-20",
    reactions: { heart: 6, star: 8, clap: 14, smile: 5 },
    comments: [],
  },
  {
    id: "s4", nickname: "もも", fullname: "小林 桃子",
    avatar: 0, avColor: 5, deptIdx: 1,
    catch: "笑顔とハイタッチ届けます！",
    hobbies: ["ヨガ", "旅行", "写真"],
    recent: "週末の登山で見た朝日がきれいで元気をもらえた",
    resolution: "47都道府県コンプリートを目指す！",
    wishlist: "オーロラを見にフィンランドへ行きたい",
    pin: "7777", lunchDate: "",
    reactions: { heart: 15, star: 6, clap: 7, smile: 12 },
    comments: [
      { by: "ぴょん", avatar: 5, avColor: 0, text: "旅行の写真みたいな♡" },
      { by: "きなこ", avatar: 7, avColor: 4, text: "ハイタッチしよ〜！✋" },
    ],
  },
  {
    id: "s5", nickname: "きなこ", fullname: "山本 結衣",
    avatar: 7, avColor: 4, deptIdx: 4,
    catch: "ばずる企画、考えるの大すき！",
    hobbies: ["SNS", "イラスト", "カラオケ"],
    recent: "企画したSNS投稿がプチばずりしてうれしかった🌟",
    resolution: "イラストでLINEスタンプを作って販売する",
    wishlist: "個展をひらいてイラストを展示してみたい",
    pin: "1111", lunchDate: "2026-06-25",
    reactions: { heart: 10, star: 9, clap: 4, smile: 6 },
    comments: [],
  },
  {
    id: "s6", nickname: "ふわり", fullname: "加藤 ひなた",
    avatar: 3, avColor: 1, deptIdx: 0,
    catch: "やさしい世界をデザインしたい",
    hobbies: ["絵を描く", "植物のせわ", "紅茶"],
    recent: "ベランダのミントが大きく育って料理に使えた🌿",
    resolution: "やさしい気もちでチームをサポートできる人になる",
    wishlist: "イングリッシュガーデンを巡る旅がしたい",
    pin: "0303", lunchDate: "",
    reactions: { heart: 8, star: 7, clap: 3, smile: 9 },
    comments: [{ by: "もも", avatar: 0, avColor: 5, text: "お花のおせわ尊敬です🌸" }],
  },
];

/** Seed the sample sheets once, on an empty database. Idempotent. */
export async function seedIfEmpty(): Promise<void> {
  const { rows } = await pool.query<{ n: string }>("SELECT COUNT(*)::text AS n FROM sheets");
  if (Number(rows[0].n) > 0) return;

  // eslint-disable-next-line no-console
  console.log("[seed] empty database — inserting sample sheets");
  for (let idx = 0; idx < SEED_SHEETS.length; idx++) {
    const s = SEED_SHEETS[idx];
    const pinHash = await bcrypt.hash(s.pin, 10);
    // Backdate by index so the feed (ordered created_at DESC) shows s1..s6 in
    // their authored order, while real new sheets created later still rank first.
    await pool.query(
      `INSERT INTO sheets
         (id, nickname, fullname, avatar, av_color, dept_idx, catch, hobbies, recent, resolution, wishlist, lunch_date, pin_hash, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13, now() - make_interval(secs => $14))`,
      [
        s.id, s.nickname, s.fullname, s.avatar, s.avColor, s.deptIdx, s.catch,
        JSON.stringify(s.hobbies), s.recent, s.resolution, s.wishlist,
        s.lunchDate === "" ? null : s.lunchDate, pinHash, idx,
      ],
    );

    // Synthesise reaction rows so seed counts render in the feed. Each gets a
    // distinct synthetic client id; real visitors toggle their own rows.
    for (const kind of Object.keys(s.reactions) as ReactionKey[]) {
      const count = s.reactions[kind];
      for (let i = 0; i < count; i++) {
        await pool.query(
          "INSERT INTO reactions (sheet_id, client_id, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [s.id, `seed-${s.id}-${kind}-${i}`, kind],
        );
      }
    }

    for (const c of s.comments) {
      await pool.query(
        "INSERT INTO comments (sheet_id, by, avatar, av_color, text) VALUES ($1,$2,$3,$4,$5)",
        [s.id, c.by, c.avatar, c.avColor, c.text],
      );
    }
  }
}
