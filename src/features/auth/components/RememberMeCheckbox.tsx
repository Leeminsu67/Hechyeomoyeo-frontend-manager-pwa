"use client";

import { useState } from "react";

interface RememberMeCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function RememberMeCheckbox({ checked, onCheckedChange }: RememberMeCheckboxProps) {
  const [checkCount, setCheckCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange(e.target.checked);
    if (e.target.checked) setCheckCount((c) => c + 1);
  };

  return (
    <>
      <style>{`
        @keyframes cb-bounce {
          0%   { transform: scale(1); }
          25%  { transform: scale(0.78); }
          55%  { transform: scale(1.22); }
          75%  { transform: scale(0.93); }
          90%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes cb-ripple {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes cb-shine {
          0%   { left: -80%; }
          100% { left: 140%; }
        }
        @keyframes cb-label-in {
          0%   { letter-spacing: 0em; }
          40%  { letter-spacing: 0.04em; }
          100% { letter-spacing: 0em; }
        }
      `}</style>

      <label
        htmlFor="remember-me"
        className="flex items-center gap-2.5 cursor-pointer w-fit select-none group"
      >
        <input
          id="remember-me"
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only"
        />

        {/* 커스텀 체크박스 박스 */}
        <span
          className="relative flex items-center justify-center w-[18px] h-[18px] rounded-[5px] overflow-hidden flex-shrink-0"
          style={{
            border: `2px solid ${checked ? "#A5D8FF" : "rgba(148,163,184,0.45)"}`,
            backgroundColor: checked ? "#A5D8FF" : "transparent",
            transition: "background-color 0.18s ease, border-color 0.18s ease",
            animation:
              checkCount > 0 && checked
                ? "cb-bounce 0.5s cubic-bezier(0.36,0.07,0.19,0.97)"
                : undefined,
          }}
        >
          {/* 리플 링 */}
          {checkCount > 0 && (
            <span
              key={`ripple-${checkCount}`}
              className="absolute inset-[-1px] rounded-[4px] pointer-events-none"
              style={{
                border: "2px solid #A5D8FF",
                animation: "cb-ripple 0.6s ease-out forwards",
              }}
            />
          )}

          {/* 광택 스위프 */}
          {checked && (
            <span
              key={`shine-${checkCount}`}
              className="absolute top-0 bottom-0 w-4 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                transform: "skewX(-15deg)",
                animation: "cb-shine 0.45s ease-out 0.08s forwards",
                left: "-80%",
              }}
            />
          )}

          {/* 체크마크 SVG */}
          <svg viewBox="0 0 12 10" className="w-[10px] h-[8px] relative z-10" aria-hidden="true">
            <polyline
              points="1.5,5.5 4.5,8.5 10.5,1.5"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 20,
                strokeDashoffset: checked ? 0 : 20,
                transition: checked
                  ? "stroke-dashoffset 0.24s ease 0.1s"
                  : "stroke-dashoffset 0.15s ease",
              }}
            />
          </svg>
        </span>

        {/* 라벨 텍스트 */}
        <span
          className="text-sm transition-colors duration-300"
          style={{
            color: checked ? "#5ba3cc" : "rgba(100,116,139,0.65)",
            animation:
              checkCount > 0 && checked ? "cb-label-in 0.35s ease" : undefined,
          }}
        >
          회사 코드 · 아이디 저장
        </span>
      </label>
    </>
  );
}
