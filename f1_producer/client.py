import grpc
import time
import fastf1
import pandas as pd

# 방금 생성된 gRPC 코드 임포트
import f1_pb2
import f1_pb2_grpc

# FastF1 캐시 폴더 설정 (없으면 현재 폴더에 생성됨)
fastf1.Cache.enable_cache('./cache')

def load_f1_data():
    """FastF1을 이용해 2024년 몬자 GP, 베르스타펜 데이터 로드"""
    print("🏎️  F1 데이터를 로딩 중입니다... (약간의 시간이 걸립니다)")
    session = fastf1.get_session(2024, 'Monza', 'Q')
    session.load()
    
    # 베르스타펜(VER)의 가장 빠른 랩 선택
    lap = session.laps.pick_driver('VER').pick_fastest()
    telemetry = lap.get_telemetry()
    
    # 필요한 컬럼만 뽑고 NaN 처리
    columns = ['Date', 'Speed', 'RPM', 'nGear', 'Throttle', 'Brake', 'DRS','X','Y','Z']
    df = telemetry[columns].fillna(0)
    print(f"✅ 데이터 로드 완료! 총 {len(df)}개의 데이터 포인트가 있습니다.")
    return df

def generate_telemetry(df):
    """데이터프레임을 순회하며 gRPC 메시지를 생성(Yield)하는 제너레이터"""
    for _, row in df.iterrows():
        # Proto 파일에 정의한 TelemetryData 메시지 생성
        msg = f1_pb2.TelemetryData(
            driver_id="VER",
            timestamp_ms=int(row['Date'].timestamp() * 1000),
            speed=float(row['Speed']),
            rpm=float(row['RPM']),
            gear=int(row['nGear']),
            throttle=float(row['Throttle']),
            brake=float(row['Brake']),
            drs=float(row['DRS']),
            x=float(row['X']),
            y=float(row['Y']),
            z=float(row['Z']),
        )
        
        # 실제 레이스처럼 보이게 0.05초 대기 (부하 테스트 시 주석 처리)
        # time.sleep(0.05)
        
        yield msg

def run():
    # Rust 서버 주소 연결 (localhost:50051)
    # [::1]은 IPv6 localhost, 안되면 '127.0.0.1:50051'로 변경
    target = 'localhost:50051' 
    
    print(f"🚀 Rust 서버({target})로 연결 시도 중...")
    
    with grpc.insecure_channel(target) as channel:
        stub = f1_pb2_grpc.F1TelemetryServiceStub(channel)
        
        try:
            # 1. 데이터 로드
            df = load_f1_data()
            
            # 2. 스트리밍 전송 시작
            print("📡 데이터 전송 시작!")
            response = stub.StreamTelemetry(generate_telemetry(df))
            
            # 3. 결과 수신
            print("🏁 전송 완료!")
            print(f"서버 응답: {response.status} (총 {response.total_packets}개 패킷 처리됨)")
            
        except grpc.RpcError as e:
            print(f"❌ 연결 실패: {e}")

if __name__ == '__main__':
    run()