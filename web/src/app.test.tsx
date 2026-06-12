import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileCard } from "./components/ProfileCard";
import { DEPTS } from "./data";
import { isoToJP } from "./screens/util";
import type { Sheet } from "./types";

describe("isoToJP", () => {
  it("formats an ISO date in Japanese with weekday", () => {
    // 2026-06-18 is a Thursday.
    expect(isoToJP("2026-06-18")).toBe("6月18日（木）");
  });
  it("returns 未定 for an empty date", () => {
    expect(isoToJP("")).toBe("未定");
  });
});

describe("ProfileCard", () => {
  const sheet: Sheet = {
    id: "s1", nickname: "ぴょん", fullname: "高橋 美咲", avatar: 5, avColor: 0,
    deptIdx: 0, catch: "毎日にときめきを探してます♡", hobbies: ["カフェめぐり", "おかし作り"],
    recent: "", resolution: "", wishlist: "", photo: null, lunchDate: "",
    reactions: { heart: 12, star: 5, clap: 3, smile: 8 }, comments: [], myReactions: [],
  };

  it("renders the nickname, catch copy, hobby tags and total reactions", () => {
    render(<ProfileCard sheet={sheet} depts={DEPTS} onClick={() => {}} />);
    expect(screen.getByText("ぴょん")).toBeDefined();
    expect(screen.getByText("毎日にときめきを探してます♡")).toBeDefined();
    expect(screen.getByText("カフェめぐり")).toBeDefined();
    expect(screen.getByText("28")).toBeDefined(); // 12+5+3+8
  });
});
