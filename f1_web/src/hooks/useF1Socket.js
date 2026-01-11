import { useEffect, useRef, useState } from 'react';

// 이 훅(Hook)은 UI는 신경 안 쓰고, 오직 "데이터 연결"만 담당합니다.
export function useF1Socket(url) {
  const [telemetry, setTelemetry] = useState(null); // 실시간 데이터
  const [status, setStatus] = useState('DISCONNECTED'); // 연결 상태
  const [tps, setTps] = useState(0); // 초당 메시지 수 (TPS)
  
  const ws = useRef(null);
  const packetCount = useRef(0);

  useEffect(() => {
    // 연결 함수
    const connect = () => {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        setStatus('CONNECTED');
        console.log("F1 System Online");
      };
      
      ws.current.onclose = () => {
        setStatus('DISCONNECTED');
        console.log("Disconnected... Retrying in 3s");
        setTimeout(connect, 3000); // 끊기면 3초 뒤 재연결 (복구 능력)
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
          packetCount.current++;
        } catch (e) {
          console.error("Parse Error", e);
        }
      };
    };

    connect(); // 시작!

    // TPS 계산기 (1초마다)
    const interval = setInterval(() => {
      setTps(packetCount.current);
      packetCount.current = 0;
    }, 1000);

    // 청소 (컴포넌트 사라질 때 연결 종료)
    return () => {
      if (ws.current) ws.current.close();
      clearInterval(interval);
    };
  }, [url]);

  return { telemetry, status, tps };
}