import React, { TextareaHTMLAttributes } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ValidatedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  register: UseFormRegisterReturn;
}

export const ValidatedTextarea = ({ label, error, register, className, ...props }: ValidatedTextareaProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700" htmlFor={props.id || props.name}>
        {label}
      </label>
      <textarea
        {...register}
        {...props}
        className={cn(
          "flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
      />
      {error && (
        <span className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};
