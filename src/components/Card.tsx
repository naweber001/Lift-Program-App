import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}
