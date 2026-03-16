"""
동행복권 공식 API에서 전체 당첨번호를 수집합니다.
출처: https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}

사용법:
    python3 scripts/fetch_draws.py

결과:
    public/draws.json 생성 (전체 회차)
"""

import requests
import json
import time
import os
from datetime import datetime

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer': 'https://www.dhlottery.co.kr'
}

def fetch_draw(draw_no):
    url = f'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={draw_no}'
    r = requests.get(url, headers=HEADERS, timeout=10)
    data = r.json()
    if data.get('returnValue') != 'success':
        return None
    return {
        'draw_no':      data['drwNo'],
        'date':         data['drwNoDate'],
        'n1':           data['drwtNo1'],
        'n2':           data['drwtNo2'],
        'n3':           data['drwtNo3'],
        'n4':           data['drwtNo4'],
        'n5':           data['drwtNo5'],
        'n6':           data['drwtNo6'],
        'bonus':        data['bnusNo'],
        'prize_1st':    data['firstWinamnt'],
        'winners_1st':  data['firstPrzwnerCo'],
    }

def get_latest_draw_no():
    """최신 회차 번호 자동 감지"""
    # 높은 번호부터 이진탐색
    lo, hi = 1, 2000
    while lo < hi:
        mid = (lo + hi + 1) // 2
        try:
            r = requests.get(
                f'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={mid}',
                headers=HEADERS, timeout=10
            )
            if r.json().get('returnValue') == 'success':
                lo = mid
            else:
                hi = mid - 1
        except:
            hi = mid - 1
    return lo

def main():
    out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'draws.json')
    out_path = os.path.normpath(out_path)

    # 기존 데이터 로드 (이어받기)
    existing = []
    existing_nos = set()
    if os.path.exists(out_path):
        with open(out_path) as f:
            existing = json.load(f)
        existing_nos = {d['draw_no'] for d in existing}
        print(f'기존 데이터: {len(existing)}회차 로드됨')

    # 최신 회차 확인
    print('최신 회차 확인 중...')
    latest = get_latest_draw_no()
    print(f'최신 회차: {latest}회')

    # 없는 회차만 수집
    missing = [i for i in range(1, latest + 1) if i not in existing_nos]
    print(f'수집 필요: {len(missing)}회차')

    if not missing:
        print('이미 최신 상태입니다.')
        return

    results = list(existing)
    errors = []

    for i, draw_no in enumerate(missing):
        try:
            draw = fetch_draw(draw_no)
            if draw:
                results.append(draw)
                if (i + 1) % 50 == 0 or draw_no == latest:
                    print(f'  [{i+1}/{len(missing)}] {draw_no}회차 완료 ({draw["date"]})')
            else:
                errors.append(draw_no)
        except Exception as e:
            errors.append(draw_no)
            print(f'  오류 {draw_no}회차: {e}')

        # 과부하 방지 딜레이
        time.sleep(0.15)

    # 정렬 후 저장
    results.sort(key=lambda x: x['draw_no'])

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f'\n완료: {len(results)}회차 → {out_path}')
    if errors:
        print(f'실패 회차: {errors}')

if __name__ == '__main__':
    main()
