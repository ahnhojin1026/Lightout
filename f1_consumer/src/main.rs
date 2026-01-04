use tonic::{transport::Server, Request, Response, Status, Streaming};
use f1::f1_telemetry_service_server::{F1TelemetryService, F1TelemetryServiceServer};
use f1::{TelemetryData, TransferSummary};

// build.rs가 생성한 모듈을 가져옵니다.
pub mod f1 {
    tonic::include_proto!("f1");
}

// 서비스 구현체 정의
#[derive(Debug, Default)]
pub struct MyF1Service;

#[tonic::async_trait]
impl F1TelemetryService for MyF1Service {
    // 클라이언트가 스트림으로 데이터를 보낼 때 호출되는 함수
    async fn stream_telemetry(
        &self,
        request: Request<Streaming<TelemetryData>>, // 스트리밍 요청을 받음
    ) -> Result<Response<TransferSummary>, Status> {
        println!("Got a request from: {:?}", request.remote_addr());

        let mut stream = request.into_inner();
        let mut count = 0;

        // 스트림으로 들어오는 메시지를 하나씩 꺼냄 (비동기)
        while let Some(telemetry) = stream.message().await? {
            // [기술 데모] 데이터가 잘 도착했는지 확인
            println!(
                "[RECV] Time: {}ms | Speed: {:.1} km/h | Gear: {}",
                telemetry.timestamp_ms, telemetry.speed, telemetry.gear
            );
            
            // 여기서 나중에 DB 저장이나 AI 추론 로직을 추가하면 됩니다.
            count += 1;
        }

        // 스트림이 끝나면 요약 정보를 반환
        let reply = TransferSummary {
            total_packets: count,
            status: "All telemetry data received successfully.".into(),
        };

        Ok(Response::new(reply))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50051".parse()?; // 로컬호스트 50051 포트
    let service = MyF1Service::default();

    println!("F1 Telemetry Consumer listening on {}", addr);

    Server::builder()
        .add_service(F1TelemetryServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}