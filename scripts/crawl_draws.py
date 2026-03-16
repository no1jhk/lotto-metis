#!/usr/bin/env python3
import requests, json, time, os

DELAY = 0.6
TIMEOUT = 10
OUTPUT = "public/draws.json"
LATEST = 1215

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "https://www.dhlottery.co.kr/gameResult.do?method=byWin",
    "X-Requested-With": "XMLHttpRequest",
}

def fetch_draw(draw_no):
    url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={draw_no}"
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            d = r.json()
            if d.get("returnValue") != "success":
                return None
            return {"draw_no":d["drwNo"],"date":d["drwNoDate"],"n1":d["drwtNo1"],"n2":d["drwtNo2"],"n3":d["drwtNo3"],"n4":d["drwtNo4"],"n5":d["drwtNo5"],"n6":d["drwtNo6"],"bonus":d["bnusNo"],"prize_1st":d["firstWinamnt"],"winners_1st":d["firstPrzwnerCo"]}
        except requests.exceptions.Timeout:
            wait = (attempt+1)*3
            print(f"  {draw_no}회 타임아웃 {wait}초 대기")
            time.sleep(wait)
        except Exception as e:
            if "Expecting value" in str(e):
                return None
            time.sleep(2)
    return None

def main():
    os.makedirs("public", exist_ok=True)
    existing, existing_nos = [], set()
    if os.path.exists(OUTPUT):
        with open(OUTPUT) as f:
            existing = json.load(f)
            existing_nos = {d["draw_no"] for d in existing}
        print(f"기존: {len(existing)}회차")
    missing = [n for n in range(1, LATEST+1) if n not in existing_nos]
    if not missing:
        print("완료")
        return
    print(f"수집: {len(missing)}회차")
    new_draws = []
    for i, no in enumerate(missing):
        result = fetch_draw(no)
        if result:
            new_draws.append(result)
            nums = ",".join(str(result[f"n{j}"]) for j in range(1,7))
            print(f"  v {no}회 ({result['date']}) {nums} +{result['bonus']}")
        else:
            print(f"  - {no}회 없음")
        if (i+1) % 50 == 0:
            all_d = sorted(existing+new_draws, key=lambda d: d["draw_no"])
            with open(OUTPUT,"w",encoding="utf-8") as f:
                json.dump(all_d, f, ensure_ascii=False, indent=2)
            print(f"  저장 {len(all_d)}회차")
        time.sleep(DELAY)
    all_draws = sorted(existing+new_draws, key=lambda d: d["draw_no"])
    with open(OUTPUT,"w",encoding="utf-8") as f:
        json.dump(all_draws, f, ensure_ascii=False, indent=2)
    print(f"완료 {len(all_draws)}회차")

main()
