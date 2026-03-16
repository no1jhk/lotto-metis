"""
동행복권 API 연결 테스트 (1회차 + 1215회차)
"""
import requests, json

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer': 'https://www.dhlottery.co.kr'
}

for draw_no in [1, 1214, 1215]:
    url = f'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={draw_no}'
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        data = r.json()
        if data.get('returnValue') == 'success':
            nums = [data[f'drwtNo{i}'] for i in range(1,7)]
            print(f'✅ {draw_no}회차 ({data["drwNoDate"]}): {nums} +{data["bnusNo"]}')
        else:
            print(f'❌ {draw_no}회차: returnValue={data.get("returnValue")}')
    except Exception as e:
        print(f'❌ {draw_no}회차 오류: {e}')
