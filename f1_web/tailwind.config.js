/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 프리텐다드 적용 완료
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Flighty 스타일 다크 테마
        bg: {
          main: '#000000',
          card: '#121212',
          sub: '#1E1E1E',
        },
        border: {
          DEFAULT: '#272727',
          hover: '#3F3F3F',
        },
        accent: {
          brand: '#4F46E5',     
          success: '#10B981',   
          warning: '#F59E0B',   
          danger: '#EF4444',    
        }
      }
    },
  },
  plugins: [],
}