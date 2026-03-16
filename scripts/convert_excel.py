"""
방법 2: 수동 엑셀 → draws.json 변환
방법 1(Playwright)이 실패할 경우 사용

사용법:
  1. https://dhlottery.co.kr → 당첨결과 → 회차별 당첨번호 → 엑셀 다운로드
  2. python3 scripts/convert_excel.py ~/Downloads/로또.xlsx

결과:
  public/draws.json 생성
  변환 전 검증: 회차 수, 첫/마지막 회차 확인 출력
"""

import sys
import json
import os

def main():
    if len(sys.argv) < 2:
        print("사용법: python3 scripts/convert_excel.py <엑셀파일경로>")
        sys.exit(1)

    xlsx_path = sys.argv[1]
    if not os.path.exists(xlsx_path):
        print(f"파일 없음: {xlsx_path}")
        sys.exit(1)

    try:
        import openpyxl
    except ImportError:
        print("openpyxl 설치 필요: pip3 install openpyxl")
        sys.exit(1)

    print(f"파일 로드: {xlsx_path}")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))

    # 헤더 행 찾기 (회차 컬럼 위치 탐색)
    header_row = None
    data_start = 0
    for i, row in enumerate(rows[:10]):
        row_str = [str(c).strip() if c else '' for c in row]
        if any('회차' in c or 'drwNo' in c.lower() for c in row_str):
            header_row = row_str
            data_start = i + 1
            break

    # 헤더 없으면 첫 행부터 숫자 데이터로 판단
    if header_row is None:
        data_start = 0
        print("헤더 행 없음 — 첫 행부터 데이터로 처리")

    results = []
    errors = []

    for i, row in enumerate(rows[data_start:], start=data_start + 1):
        if not row or not row[0]:
            continue
        try:
            vals = [int(v) if isinstance(v, (int, float)) else v for v in row]
            # 컬럼 순서: 회차, 추첨일, 1~6번, 보너스, 1등상금, 1등당첨자
            draw_no = int(vals[0])
            date    = str(vals[1]).strip() if vals[1] else ''
            # 날짜 포맷 정규화 (YYYY.MM.DD → YYYY-MM-DD)
            date = date.replace('.', '-').replace('/', '-')
            if len(date) == 8 and date.isdigit():
                date = f"{date[:4]}-{date[4:6]}-{date[6:]}"

            n = [int(vals[j]) for j in range(2, 8)]
            bonus       = int(vals[8])
            prize_1st   = int(vals[9]) if len(vals) > 9 and vals[9] else 0
            winners_1st = int(vals[10]) if len(vals) > 10 and vals[10] else 0

            results.append({
                'draw_no':     draw_no,
                'date':        date,
                'n1': n[0], 'n2': n[1], 'n3': n[2],
                'n4': n[3], 'n5': n[4], 'n6': n[5],
                'bonus':       bonus,
                'prize_1st':   prize_1st,
                'winners_1st': winners_1st,
            })
        except Exception as e:
            errors.append((i, str(e), row))

    results.sort(key=lambda x: x['draw_no'])

    # ── 검증 ──
    print(f"\n{'='*40}")
    print(f"총 레코드: {len(results)}개")
    if results:
        print(f"첫 회차:  {results[0]['draw_no']}회 ({results[0]['date']})")
        print(f"  번호: {results[0]['n1']} {results[0]['n2']} {results[0]['n3']} "
              f"{results[0]['n4']} {results[0]['n5']} {results[0]['n6']} +{results[0]['bonus']}")
        print(f"마지막:   {results[-1]['draw_no']}회 ({results[-1]['date']})")
        print(f"  번호: {results[-1]['n1']} {results[-1]['n2']} {results[-1]['n3']} "
              f"{results[-1]['n4']} {results[-1]['n5']} {results[-1]['n6']} +{results[-1]['bonus']}")

        # 연속성 체크
        nos = [r['draw_no'] for r in results]
        expected = list(range(nos[0], nos[-1]+1))
        missing = set(expected) - set(nos)
        if missing:
            print(f"\n⚠️  누락 회차: {sorted(missing)}")
        else:
            print(f"\n✅ 회차 연속성 OK (누락 없음)")

    if errors:
        print(f"\n⚠️  파싱 오류 {len(errors)}건:")
        for row_no, err, row in errors[:5]:
            print(f"  행 {row_no}: {err} | {row}")
    print('='*40)

    # 확인 후 저장
    answer = input("\ndraws.json으로 저장하시겠습니까? (y/N): ").strip().lower()
    if answer != 'y':
        print("저장 취소")
        sys.exit(0)

    out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'draws.json')
    out_path = os.path.normpath(out_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"저장 완료: {out_path}")

if __name__ == '__main__':
    main()
