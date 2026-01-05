use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
    routing::get,
    Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::broadcast;
use tonic::{transport::Server, Request, Response, Status, Streaming};
use tower_http::cors::CorsLayer;

// Protobuf 모듈
pub mod f1 {
    tonic::include_proto!("f1");
}
use f1::f1_telemetry_service_server::{F1TelemetryService, F1TelemetryServiceServer};
use f1::{TelemetryData, TransferSummary};

// ----------------------------------------------------------------
// 1. JSON 변환용 구조체 (DTO)
// Protobuf 객체는 바로 JSON 변환이 안 되어서, 거울 같은 구조체를 만듭니다.
// ----------------------------------------------------------------
#[derive(Debug, Clone, Serialize)]
struct TelemetryJson {
    driver_id: String,
    timestamp: i64,
    speed: f32,
    rpm: f32,
    gear: i32,
    throttle: f32,
    brake: f32,
    drs: f32,
    x: f32,
    y: f32,
    z: f32,
}

// ----------------------------------------------------------------
// 2. 공유 상태 (App State)
// gRPC와 웹 서버가 공유할 "방송 채널"입니다.
// ----------------------------------------------------------------
struct AppState {
    tx: broadcast::Sender<TelemetryJson>,
}

// ----------------------------------------------------------------
// 3. gRPC 서비스 구현 (Producer)
// ----------------------------------------------------------------
#[derive(Debug)]
pub struct MyF1Service {
    // 방송 송신기를 가지고 있음
    tx: broadcast::Sender<TelemetryJson>,
}

#[tonic::async_trait]
impl F1TelemetryService for MyF1Service {
    async fn stream_telemetry(
        &self,
        request: Request<Streaming<TelemetryData>>,
    ) -> Result<Response<TransferSummary>, Status> {
        println!("Connected to Python Producer!");

        let mut stream = request.into_inner();
        let mut count = 0;

        while let Some(telemetry) = stream.message().await? {
            // 1. 들어온 데이터를 JSON용 구조체로 변환
            let json_data = TelemetryJson {
                driver_id: telemetry.driver_id,
                timestamp: telemetry.timestamp_ms,
                speed: telemetry.speed,
                rpm: telemetry.rpm,
                gear: telemetry.gear,
                throttle: telemetry.throttle,
                brake: telemetry.brake,
                drs: telemetry.drs,
                x: telemetry.x,
                y: telemetry.y,
                z: telemetry.z,
            };

            // 2. 방송 송출! (구독자가 없어도 에러 안 나게 처리)
            // send는 현재 구독자 수를 반환하거나 에러를 냅니다. 무시해도 됨.
            let _ = self.tx.send(json_data);
            
            // (옵션) 서버 로그에도 가끔 찍어줌
            if count % 100 == 0 {
                println!("[gRPC -> WS] Broadcasted packet #{}", count);
            }
            count += 1;
        }

        Ok(Response::new(TransferSummary {
            total_packets: count,
            status: "Stream Ended".into(),
        }))
    }
}

// ----------------------------------------------------------------
// 4. 웹소켓 핸들러 (Consumer)
// ----------------------------------------------------------------
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    // 웹소켓 연결 업그레이드
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    // 방송 채널 구독 (Subscribe)
    let mut rx = state.tx.subscribe();

    println!("New Web Client Connected!");

    while let Ok(msg) = rx.recv().await {
        // JSON으로 직렬화
        if let Ok(json_text) = serde_json::to_string(&msg) {
            // 웹 클라이언트에게 전송
            if socket.send(Message::Text(json_text)).await.is_err() {
                // 전송 실패하면(브라우저 닫음) 루프 종료
                break;
            }
        }
    }
    println!("Web Client Disconnected");
}

// ----------------------------------------------------------------
// 5. 메인 함수 (Orchestrator)
// ----------------------------------------------------------------
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. 방송 채널 생성 (최대 100개 메시지 버퍼)
    let (tx, _rx) = broadcast::channel(100);

    // 2. 상태 공유 객체 생성
    let app_state = Arc::new(AppState { tx: tx.clone() });

    // 3. 웹 서버 (Axum) 설정 - 포트 3000
    let app = Router::new()
        .route("/ws", get(ws_handler)) // ws://localhost:3000/ws 주소
        .with_state(app_state.clone()) // 상태 주입
        .layer(CorsLayer::permissive()); // 보안 정책 해제 (개발용)

    // 웹 서버를 별도 태스크(스레드)로 실행
    tokio::spawn(async move {
        let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
        println!("🌐 Web Server running on http://0.0.0.0:3000");
        axum::serve(listener, app).await.unwrap();
    });

    // 4. gRPC 서버 설정 - 포트 50051
    let grpc_addr = "[::1]:50051".parse()?;
    let service = MyF1Service { tx }; // gRPC 서비스에도 송신기 주입

    println!("🚀 gRPC Server listening on {}", grpc_addr);

    Server::builder()
        .add_service(F1TelemetryServiceServer::new(service))
        .serve(grpc_addr)
        .await?;

    Ok(())
}