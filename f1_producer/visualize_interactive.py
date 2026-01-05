import fastf1
import plotly.graph_objects as go # 인터랙티브 그래프용

# 캐시 설정
fastf1.Cache.enable_cache('./cache')

def plot_interactive_track():
    print("🏎️  Monza 데이터를 로딩 중입니다...")
    session = fastf1.get_session(2024, 'Belgian', 'Q')
    session.load()
    
    # 베르스타펜 랩 데이터
    lap = session.laps.pick_driver('VER').pick_fastest()
    telemetry = lap.get_telemetry()
    
    # X, Y, Z 데이터 추출
    x = telemetry['X']
    y = telemetry['Y']
    z = telemetry['Z']
    # 속도 데이터도 가져와서 색상으로 표현해봅시다!
    speed = telemetry['Speed']

    print("✨ 인터랙티브 3D 지도를 생성 중입니다...")
    
    # 3D 선 그래프 생성
    fig = go.Figure(data=[go.Scatter3d(
        x=x,
        y=y,
        z=z,
        mode='lines', # 선으로 그리기
        line=dict(
            color=speed,     # 속도에 따라 색깔이 변하게 설정!
            colorscale='Plasma', # 색상 테마 (Viridis, Plasma, Inferno 등)
            width=4          # 선 굵기
        ),
        hovertext=speed.apply(lambda s: f"Speed: {s:.1f} km/h"), # 마우스 올리면 속도 표시
    )])

    # 그래프 스타일 설정 (Project Lights Out 테마)
    fig.update_layout(
        title='F1 Monza GP - Interactive 3D Track (Color by Speed)',
        scene = dict(
            xaxis_title='X Position',
            yaxis_title='Y Position',
            zaxis_title='Elevation (Z)',

            aspectmode='data',

            # 배경색 어둡게
            xaxis=dict(backgroundcolor="rgb(20, 20, 20)", gridcolor="grey", showbackground=True),
            yaxis=dict(backgroundcolor="rgb(20, 20, 20)", gridcolor="grey", showbackground=True),
            zaxis=dict(backgroundcolor="rgb(20, 20, 20)", gridcolor="grey", showbackground=True),
            bgcolor='rgb(0,0,0)' # 전체 배경 검정
        ),
        paper_bgcolor='rgb(0,0,0)', # html 배경 검정
        font=dict(color="white") # 글자색 흰색
    )

    # HTML 파일로 저장
    output_filename = "f1_interactive.html"
    fig.write_html(output_filename)
    print(f"✅ 완성! '{output_filename}' 파일을 브라우저에서 열어보세요.")

if __name__ == "__main__":
    plot_interactive_track()