"""
당첨번호 수집 - 3가지 방법 순차 시도
방법 1: 동행복권 JSON API (가장 빠름, 차단 가능)
방법 2: 다음 검색 스크래핑 (포털, 차단 가능성 낮음)
방법 3: 동행복권 HTML 페이지 스크래핑 (JSON API와 다른 엔드포인트)

GitHub Actions 및 로컬 모두 동작하도록 설계
"""

import requests
import json
import time
import os
import sys
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9',
}

OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'draws.json')
OUT_PATH = os.path.normpath(OUT_PATH)


# ── 방법 1: 동행복권 JSON API ──────────────────────────────
def fetch_method1(draw_no):
    try:
        url = f'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={draw_no}'
        r = requests.get(url, headers=HEADERS, timeout=8)
        data = r.json()
        if data.get('returnValue') == 'success':
            return {
                'draw_no': data['drwNo'],
                'date':    data['drwNoDate'],
                'n1': data['drwtNo1'], 'n2': data['drwtNo2'], 'n3': data['drwtNo3'],
                'n4': data['drwtNo4'], 'n5': data['drwtNo5'], 'n6': data['drwtNo6'],
                'bonus': data['bnusNo'],
                'prize_1st': data['firstWinamnt'],
                'winners_1st': data['firstPrzwnerCo'],
            }
    except Exception as e:
        pass
    return None


# ── 방법 2: 다음 검색 스크래핑 ────────────────────────────
def fetch_method2(draw_no):
    try:
        url = f'https://search.daum.net/search?w=tot&rtmaxcoll=LOT&DA=LOT&q={draw_no}회차+로또'
        r = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')

        # 번호 추출 시도 (여러 셀렉터)
        nums = []
        for sel in ['.lottonum .img_lotto', '.num_win span', '.lotto_num span', 'span.ball']:
            els = soup.select(sel)
            if els:
                nums = [int(e.text.strip()) for e in els if e.text.strip().isdigit()]
                if len(nums) >= 7:
                    break

        if len(nums) >= 7:
            # 날짜 추출
            date_el = soup.select_one('.date_info, .win_date, .desc')
            date_str = ''
            if date_el:
                import re
                m = re.search(r'(\d{4})[.\-년](\d{1,2})[.\-월](\d{1,2})', date_el.text)
                if m:
                    date_str = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"

            return {
                'draw_no': draw_no,
                'date': date_str,
                'n1': nums[0], 'n2': nums[1], 'n3': nums[2],
                'n4': nums[3], 'n5': nums[4], 'n6': nums[5],
                'bonus': nums[6],
                'prize_1st': 0, 'winners_1st': 0,
            }
    except Exception as e:
        pass
    return None


# ── 방법 3: 동행복권 HTML 페이지 ──────────────────────────
def fetch_method3(draw_no):
    try:
        url = f'https://www.dhlottery.co.kr/gameResult.do?method=byWin&drwNo={draw_no}'
        r = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')

        # 당첨번호
        win_div = soup.find('div', class_='num win')
        if not win_div:
            return None
        nums = [int(s.text.strip()) for s in win_div.select('span') if s.text.strip().isdigit()]

        # 보너스
        bonus_div = soup.find('div', class_='num bonus')
        bonus = int(bonus_div.find('p').text.strip()) if bonus_div else 0

        # 날짜
        import re
        date_str = ''
        desc = soup.find('p', class_='desc')
        if desc:
            m = re.search(r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일', desc.text)
            if m:
                date_str = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"

        if len(nums) >= 6:
            return {
                'draw_no': draw_no,
                'date': date_str,
                'n1': nums[0], 'n2': nums[1], 'n3': nums[2],
                'n4': nums[3], 'n5': nums[4], 'n6': nums[5],
                'bonus': bonus,
                'prize_1st': 0, 'winners_1st': 0,
            }
    except Exception as e:
        pass
    return None


# ── 방법 감지: 어떤 방법이 지금 환경에서 작동하는지 ─────────
def detect_working_method():
    print("사용 가능한 수집 방법 탐색 중...")
    test_no = 1215  # 알고 있는 정답: 13 15 19 21 44 45 +39

    for method_fn, name in [
        (fetch_method1, "방법1 (동행복권 JSON API)"),
        (fetch_method2, "방법2 (다음 검색)"),
        (fetch_method3, "방법3 (동행복권 HTML)"),
    ]:
        result = method_fn(test_no)
        if result and result['n1'] == 13 and result['bonus'] == 39:
            print(f"  ✅ {name} 작동 확인!")
            return method_fn, name
        else:
            print(f"  ❌ {name} 실패")

    return None, None


def main():
    # 기존 데이터 로드
    existing = []
    existing_nos = set()
    if os.path.exists(OUT_PATH):
        with open(OUT_PATH, encoding='utf-8') as f:
            existing = json.load(f)
        existing_nos = {d['draw_no'] for d in existing}
        print(f"기존 데이터: {len(existing)}회차")

    # 작동하는 방법 탐색
    fetch_fn, method_name = detect_working_method()
    if not fetch_fn:
        print("\n❌ 모든 방법 실패 — 네트워크 환경 확인 필요")
        sys.exit(1)

    print(f"\n{method_name}으로 수집 시작")

    # 최신 회차 탐색 (알려진 최대값부터 확인)
    latest = max(existing_nos) if existing_nos else 1215
    for no in range(latest + 20, latest - 1, -1):
        result = fetch_fn(no)
        if result:
            latest = no
            break
    print(f"최신 회차: {latest}")

    # 누락 회차 수집
    missing = [i for i in range(1, latest + 1) if i not in existing_nos]
    print(f"수집 필요: {len(missing)}회차")

    if not missing:
        print("이미 최신 상태")
        return

    results = list(existing)
    success = fail = 0

    for i, draw_no in enumerate(missing):
        draw = fetch_fn(draw_no)
        if draw:
            results.append(draw)
            success += 1
            if success % 100 == 0:
                print(f"  {draw_no}회차 완료 ({success}/{len(missing)})")
        else:
            fail += 1
            print(f"  ⚠️ {draw_no}회차 실패")
        time.sleep(0.2)

    results.sort(key=lambda x: x['draw_no'])
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n완료: 총 {len(results)}회차 (성공 {success} / 실패 {fail})")
    if fail > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
