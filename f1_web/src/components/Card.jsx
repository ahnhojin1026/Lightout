import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind 클래스 충돌 방지용 유틸리티
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 제목, 아이콘, 내용을 받아서 카드로 만들어주는 부품
export function Card({ title, icon: Icon, children, className, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        // 기본 스타일: 짙은 회색 배경, 둥근 모서리, 부드러운 테두리
        "bg-bg-card border border-border rounded-2xl p-5 flex flex-col relative overflow-hidden transition-all duration-200",
        // 클릭 가능하면 마우스 올렸을 때 효과 추가
        onClick && "cursor-pointer hover:border-accent-brand hover:bg-bg-sub active:scale-[0.98]",
        className
      )}
    >
      {/* 카드 헤더 (아이콘 + 제목) */}
      <div className="flex items-center gap-2 mb-3 text-gray-400">
        {Icon && <Icon size={14} strokeWidth={3} />}
        <span className="text-[11px] font-bold tracking-widest uppercase font-mono">{title}</span>
      </div>
      
      {/* 카드 내용이 들어갈 자리 */}
      <div className="flex-grow relative">
        {children}
      </div>
    </div>
  );
}