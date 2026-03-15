#!/usr/bin/env python3
import requests, json, time, os

DELAY = 0.5
TIMEOUT = 8
OUTPUT = "public/draws.json"
LATEST = 1177  # 현재 최신 회차 (매주 +1)

def fetch_draw(draw_no):
    url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={draw_no}"
    for attempt in range(3):
        try:
            res = requests.get(url, timeout=TIMEOUT, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            })
            data = res.json()
            if data.get('returnValue') != 'success':
                return None
            return {
                "draw_no": data["drwNo"], "date": data["drwNoDate"],
                "n1": data["drwtNo1"], "n2": data["drwtNo2"],
                "n3": data["drwtNo3"], "n4": data["drwtNo4"],
                "n5": data["drwtNo5"], "n6": data["drwtNo6"],
                "bonus": data["bnusNo"],
                "prize_1st": data["firstWinamnt"],
                "winners_1st": data["firstPrzwnerCo"],
            }
        except requests.exceptions.Timeout:
            wait = (attempt + 1) * 3
            print(f"  ⏳ {draw_no}회 타임아웃 → {wait}초 대기 후 재시도")
            time.sleep(wait)
        except Exception as e:
            if "Expecting value" in str(e):
                return None
            print(f"  ✗ {draw_no}회 오류: {e}")
            time.sleep(2)
    return None

def main():
    os.makedirs("public", exist_ok=True)
    existing, existing_nos = [], set()
    if os.path.exists(OUTPUT):
        with open(OUTPUT) as f:
            existing = json.load(f)
            existing_nos = {d["draw_no"] for d in existing}
        print(f"기존: {len(existing)}회차 로드됨")

    missing = [n for n in range(1, LATEST + 1) if n not in existing_nos]
    if not missing:
        print(f"✅ 이미 완료 ({len(existing)}회차)")
        return

    print(f"수집 대상: {len(missing)}회차 / 예상 시간: 약 {len(missing)*DELAY/60:.0f}분\n")
    new_draws = []

    for i, no in enumerate(missing):
        result = fetch_draw(no)
        if result:
            new_draws.append(result)
            nums = ",".join(str(result[f"n{j}"]) for j in range(1,7))
            print(f"  ✓ {no}회 ({result['date']}) — {nums} +{result['bonus']}")
        else:
            print(f"  - {no}회 없음")

        if (i + 1) % 50 == 0:
            all_d = sorted(existing + new_draws, key=lambda d: d["draw_no"])
            with open(OUTPUT, 'w', encoding='utf-8') as f:
                json.dump(all_d, f, ensure_ascii=False, indent=2)
            print(f"\n  💾 중간저장 {len(all_d)}회차\n")

        time.sleep(DELAY)

    all_draws = sorted(existing + new_draws, key=lambda d: d["draw_no"])
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(all_draws, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 완료! 총 {len(all_draws)}회차 → {OUTPUT}")

print("=" * 40)
print("  Lotto Metis 크롤러 v2")
print("=" * 40)
main()
