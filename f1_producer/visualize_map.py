import fastf1
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D # 3D 그래프용

# 캐시 설정
fastf1.Cache.enable_cache('./cache')

def plot_3d_track():
    print("Loading Monza 2024 data...")
    session = fastf1.get_session(2024, 'Belgian', 'Q')
    session.load()
    
    # 베르스타펜 랩 데이터
    lap = session.laps.pick_driver('VER').pick_fastest()
    telemetry = lap.get_telemetry()
    
    # X, Y, Z 데이터 추출
    x = telemetry['X']
    y = telemetry['Y']
    z = telemetry['Z']

    print("Drawing 3D Map...")
    
    # 3D 캔버스 생성
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111, projection='3d')

    # 트랙 그리기 (색상은 'Red', 선 굵기는 2)
    ax.plot(x, y, z, color='red', linewidth=2, label='VER - Monza')

    # 스타일링 (Project Lights Out 느낌나게 어둡게)
    ax.set_facecolor('black')
    fig.patch.set_facecolor('black')
    
    # 축 라벨 및 색상 설정
    ax.set_xlabel('X Position', color='white')
    ax.set_ylabel('Y Position', color='white')
    ax.set_zlabel('Elevation (Z)', color='white')
    
    # 눈금 색상 변경
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    ax.tick_params(axis='z', colors='white')
    
    # 배경 그리드 색상 조정
    ax.xaxis.pane.fill = False
    ax.yaxis.pane.fill = False
    ax.zaxis.pane.fill = False
    
    # 비율 맞추기 (찌그러짐 방지)
    # X, Y, Z의 최대/최소 범위를 비슷하게 맞춰야 실제 트랙 모양이 나옵니다.
    max_range = max(x.max()-x.min(), y.max()-y.min(), z.max()-z.min()) / 2.0
    mid_x = (x.max()+x.min()) * 0.5
    mid_y = (y.max()+y.min()) * 0.5
    mid_z = (z.max()+z.min()) * 0.5
    ax.set_xlim(mid_x - max_range, mid_x + max_range)
    ax.set_ylim(mid_y - max_range, mid_y + max_range)
    ax.set_zlim(mid_z - max_range, mid_z + max_range)

    plt.title("F1 Monza GP - 3D Track Map", color='white')
    # plt.show()

    output_filename = 'f1_track_3d.png'
    plt.savefig(output_filename, dpi=100) # dpi=100은 해상도
    print(f"✅ 3D 지도가 '{output_filename}' 파일로 저장되었습니다! 파일 탐색기에서 확인해보세요.")

if __name__ == "__main__":
    plot_3d_track()