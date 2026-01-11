import { useF1Socket } from './hooks/useF1Socket';
import { Card } from './components/Card';
import { Activity, Map, Gauge, Cpu, Zap } from 'lucide-react'; // 아이콘들

// 1. 서버 주소 설정 (Codespaces 환경 자동 감지)
const WS_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:3000/ws' 
  : `wss://${window.location.hostname.replace('-5173', '-3000')}/ws`;

function App() {
  // 2. 엔진 가동 (데이터 받아오기)
  const { telemetry, status, tps } = useF1Socket(WS_URL);
  
  // 3. 데이터 안전장치 (데이터가 아직 안 왔을 때 0으로 표시)
  const d = telemetry || { speed: 0, gear: 'N', rpm: 0, throttle: 0, brake: 0, x: 0, y: 0 };

  return (
    <div className="min-h-screen bg-bg-main text-white p-4 md:p-8 flex flex-col items-center font-sans">
      
      {/* --- HEADER --- */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {/* 상태 표시등 (초록/빨강) */}
          <div className={`w-2 h-2 rounded-full shadow-[0_0_10px] transition-colors duration-300 ${status === 'CONNECTED' ? 'bg-accent-success shadow-accent-success' : 'bg-accent-danger'}`}></div>
          <h1 className="text-xl font-black tracking-tighter">
            PROJECT <span className="text-accent-brand">LIGHTS OUT</span>
          </h1>
        </div>
        <div className="font-mono text-xs text-gray-500 bg-bg-card px-3 py-1 rounded-full border border-border">
          {status} • {tps.toLocaleString()} TPS
        </div>
      </header>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
        
        {/* 1. 맵 카드 (2x2 크기) */}
        <Card title="Live Tracker" icon={Map} className="lg:col-span-2 lg:row-span-2 group">
          <div className="absolute inset-0 flex items-center justify-center bg-[#080808]">
             <div className="text-center space-y-2">
                <div className="text-4xl animate-pulse">🏎️</div>
                <div className="font-mono text-xs text-gray-500">
                  X: {d.x.toFixed(0)} <br/> Y: {d.y.toFixed(0)}
                </div>
             </div>
             <div className="absolute bottom-4 right-4 bg-black/80 border border-border px-3 py-1 rounded-lg text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-accent-brand">
                CLICK TO ANALYZE ↗
             </div>
          </div>
        </Card>

        {/* 2. 속도 카드 */}
        <Card title="Velocity" icon={Zap} className="lg:col-span-1 lg:row-span-1">
          <div className="flex flex-col items-center justify-center h-full">
            <span className="font-mono text-7xl font-bold tracking-tighter text-white">
              {d.speed.toFixed(0)}
            </span>
            <span className="text-xs text-gray-500 font-medium mt-1">KM/H</span>
          </div>
        </Card>

        {/* 3. 기어 & RPM */}
        <Card title="Powertrain" icon={Activity} className="lg:col-span-1 lg:row-span-1">
           <div className="flex justify-between items-end h-full px-2">
              <div className="text-center">
                 <div className="font-mono text-5xl font-bold text-accent-brand">{d.gear}</div>
                 <div className="text-[10px] text-gray-500 mt-1">GEAR</div>
              </div>
              <div className="text-right pb-1">
                 <div className="font-mono text-xl">{d.rpm.toLocaleString()}</div>
                 <div className="text-[10px] text-gray-500">RPM</div>
              </div>
           </div>
        </Card>

        {/* 4. 입력 (스로틀/브레이크) */}
        <Card title="Telemetry Inputs" icon={Gauge} className="lg:col-span-1 lg:row-span-1">
           <div className="flex h-full gap-4 items-end pb-2">
              {/* Throttle Bar */}
              <div className="flex-1 h-full bg-[#1a1a1a] rounded-md relative overflow-hidden group border border-[#333]">
                 <div 
                    className="absolute bottom-0 w-full bg-accent-success transition-all duration-75 ease-linear group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    style={{ height: `${d.throttle}%` }}
                 ></div>
                 <span className="absolute top-2 left-0 w-full text-center text-[10px] font-bold z-10 mix-blend-difference text-white">THR</span>
              </div>
              {/* Brake Bar */}
              <div className="flex-1 h-full bg-[#1a1a1a] rounded-md relative overflow-hidden group border border-[#333]">
                 <div 
                    className="absolute bottom-0 w-full bg-accent-danger transition-all duration-75 ease-linear group-hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    style={{ height: `${d.brake > 0 ? 100 : 0}%` }}
                 ></div>
                 <span className="absolute top-2 left-0 w-full text-center text-[10px] font-bold z-10 mix-blend-difference text-white">BRK</span>
              </div>
           </div>
        </Card>

        {/* 5. 시스템 상태 */}
        <Card title="System Health" icon={Cpu} className="lg:col-span-1 lg:row-span-1">
           <div className="space-y-3 mt-auto font-mono text-xs">
              <div className="flex justify-between border-b border-border pb-1">
                 <span className="text-gray-500">LATENCY</span>
                 <span className="text-white">0.02 ms</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1">
                 <span className="text-gray-500">MEMORY</span>
                 <span className="text-accent-brand">Zero-Copy</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-gray-500">BUFFER</span>
                 <span>Lock-Free</span>
              </div>
           </div>
        </Card>

      </div>
    </div>
  );
}

export default App;