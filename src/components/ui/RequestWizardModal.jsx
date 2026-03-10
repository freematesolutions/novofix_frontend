import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';
import MapPicker from './MapPicker.jsx';
import api from '@/state/apiClient';
import { useToast } from './Toast.jsx';
import { useNavigate } from 'react-router-dom';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from './UploadProgress.jsx';
import { getProblemsForCategory, categoryRequiresLocation } from '@/utils/categoryProblems.js';

// ============================================================================
// ICONS - Iconos SVG modernos inline
// ============================================================================
const Icons = {
  Close: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Send: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  Warning: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  Photo: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  Video: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  Play: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
    </svg>
  ),
  Upload: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  ),
  MapPin: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  Wrench: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437" />
    </svg>
  ),
  // Step icons - SVG silhouette style matching Home page
  StepProblem: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437" />
    </svg>
  ),
  StepMedia: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  ),
  StepLocation: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  StepDate: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  StepSummary: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  )
};

// ============================================================================
// PROBLEM ICONS - SVG outline icons matching Home page style (text-gray-400, strokeWidth 1.5)
// ============================================================================
const PROBLEM_ICON_SVGS = {
  bolt: ['M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'],
  wrench: ['M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z'],
  home: ['M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'],
  checkCircle: ['M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  plusCircle: ['M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'],
  droplet: ['M12 2.69c-.47.53-1.09 1.27-1.72 2.1C8.56 7.13 6 10.81 6 14a6 6 0 1012 0c0-3.19-2.56-6.87-4.28-9.21A29.4 29.4 0 0012 2.69z'],
  fire: ['M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z', 'M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z'],
  lightBulb: ['M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'],
  shield: ['M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z'],
  lock: ['M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'],
  key: ['M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z'],
  magnifier: ['M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'],
  box: ['M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'],
  sun: ['M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'],
  speaker: ['M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z'],
  phone: ['M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'],
  bug: ['M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.22-2.057-1.907-3.555-3.97-3.555h-6.17c-2.063 0-3.75 1.498-3.97 3.555a23.91 23.91 0 01-1.152 6.135c2.56-.932 5.324-1.44 8.207-1.44z'],
  beaker: ['M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5m9.25-11.396v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0c.251.023.501.05.75.082M5 14.5l-.44 1.1c-.593 1.48.157 3.168 1.697 3.351 1.596.19 3.22.3 4.866.33m0 0a48.4 48.4 0 001.754 0m-1.754 0c.585-.006 1.17-.02 1.754-.04m7.823-4.741l-.44 1.1c-.593 1.48.157 3.168 1.697 3.351A48.8 48.8 0 0112 21c-2.773 0-5.491-.235-8.135-.687'],
  building: ['M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21'],
  paint: ['M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42'],
  arrowPath: ['M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992'],
  sparkles: ['M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z'],
  clipboard: ['M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z'],
  trash: ['M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'],
  bell: ['M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'],
  cloud: ['M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z'],
  briefcase: ['M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0'],
  camera: ['M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z', 'M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z'],
  puzzle: ['M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z'],
  arrowUp: ['M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18'],
  squares: ['M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'],
  truck: ['M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-2.25 0h-2.25m0 0v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'],
  photo: ['M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z'],
  leaf: ['M12 21C7.03 21 3 16.97 3 12c0-4 4-9 7.5-11.25.5-.32 1-.32 1.5 0C15.5 3 20 8 20 12c0 4.97-3.58 9-8 9zm0-18c0 0-3 4-3 9m6-6c0 0-3 3.5-3 7.5'],
  music: ['M9 19.5v-15l10.5-3v15M9 19.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm10.5-3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z'],
  eye: ['M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  link: ['M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244'],
  plug: ['M5.636 5.636a9 9 0 1012.728 0M12 3v9'],
  window: ['M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M12 3.75v16.5m-9-8.25h18'],
  mapPin: ['M15 10.5a3 3 0 11-6 0 3 3 0 016 0z', 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'],
  calendar: ['M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'],
  cog: ['M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  swatch: ['M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z'],
  broom: ['M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776'],
  bed: ['M21 11.25v7.5M3 11.25v7.5M12 3v3.75m-3 0h6m-8.25 3h10.5a2.25 2.25 0 012.25 2.25v3H3.75v-3a2.25 2.25 0 012.25-2.25z'],
  map: ['M9 6.75V15m0-8.25a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V15m0 0l-3-3m3 3l3-3M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  fallback: ['M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z']
};

// Map emoji characters to SVG icon keys
const EMOJI_ICON_MAP = {
  '⚡': 'bolt', '🔧': 'wrench', '🛠️': 'wrench', '🧰': 'wrench', '🔩': 'cog',
  '⚙️': 'cog', '🔨': 'wrench', '🧩': 'puzzle', '🖼️': 'photo', '🧱': 'squares',
  '🪨': 'squares', '🚪': 'home', '🪑': 'box', '✅': 'checkCircle', '➕': 'plusCircle',
  '💧': 'droplet', '🌊': 'droplet', '🚿': 'droplet', '🚰': 'droplet', '🚽': 'droplet',
  '🏊': 'droplet', '🔥': 'fire', '🌀': 'arrowPath', '🔁': 'arrowPath', '💥': 'sparkles',
  '✨': 'sparkles', '🔌': 'plug', '💡': 'lightBulb', '🔘': 'lightBulb', '📦': 'box',
  '📭': 'box', '🗄️': 'box', '🔗': 'link', '🔍': 'magnifier', '❄️': 'cloud',
  '🌡️': 'sun', '🌬️': 'cloud', '🫧': 'beaker', '🔊': 'speaker', '🔐': 'lock',
  '🔒': 'lock', '🔑': 'key', '🛡️': 'shield', '📱': 'phone', '🚗': 'truck',
  '🚜': 'truck', '🐜': 'bug', '🐀': 'bug', '🪲': 'bug', '🪳': 'bug', '🦟': 'bug',
  '🛏️': 'bed', '🧴': 'beaker', '🌿': 'leaf', '🌱': 'leaf', '🍂': 'leaf',
  '🌳': 'leaf', '🌺': 'leaf', '🟩': 'leaf', '🏠': 'home', '🏗️': 'building',
  '🏢': 'building', '🧽': 'broom', '🧹': 'broom', '🪟': 'window', '🍳': 'swatch',
  '🎨': 'paint', '⬆️': 'arrowUp', '🪵': 'squares', '📐': 'clipboard', '📏': 'clipboard',
  '👔': 'briefcase', '🔲': 'squares', '⬜': 'squares', '🧪': 'beaker',
  '☀️': 'sun', '📋': 'clipboard', '📆': 'calendar', '🗂️': 'clipboard',
  '💼': 'briefcase', '🗑️': 'trash', '📹': 'camera', '🖥️': 'camera',
  '📡': 'bell', '🚨': 'bell', '🔔': 'bell', '🌧️': 'cloud', '⛈️': 'cloud',
  '⛱️': 'cloud', '🕶️': 'eye', '♻️': 'arrowPath', '🎹': 'music',
  '🛋️': 'box', '🗺️': 'map', '🗓️': 'calendar'
};

// ProblemIcon component - renders SVG silhouette matching Home page style
const ProblemIcon = ({ emoji, className = 'w-5 h-5 text-gray-400' }) => {
  const iconKey = EMOJI_ICON_MAP[emoji] || 'fallback';
  const paths = PROBLEM_ICON_SVGS[iconKey] || PROBLEM_ICON_SVGS.fallback;
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
};

// ============================================================================
// STEPS CONFIGURATION - Configuración de pasos con iconos y colores
// ============================================================================
const STEPS = [
  { 
    id: 'problems', 
    titleKey: 'problems', 
    shortTitleKey: 'problems',
    descriptionKey: 'problemsHint',
    iconComponent: 'StepProblem',
    color: 'from-dark-600 to-dark-700'
  },
  { 
    id: 'media', 
    titleKey: 'media', 
    shortTitleKey: 'photosVideos',
    descriptionKey: 'mediaHint',
    iconComponent: 'StepMedia',
    color: 'from-dark-600 to-dark-700'
  },
  { 
    id: 'location', 
    titleKey: 'location', 
    shortTitleKey: 'location',
    descriptionKey: 'locationHint',
    iconComponent: 'StepLocation',
    color: 'from-dark-600 to-dark-700'
  },
  { 
    id: 'date', 
    titleKey: 'date', 
    shortTitleKey: 'date',
    descriptionKey: 'dateHint',
    iconComponent: 'StepDate',
    color: 'from-dark-600 to-dark-700'
  },
  { 
    id: 'budget', 
    titleKey: 'summary', 
    shortTitleKey: 'summary',
    descriptionKey: 'summaryHint',
    iconComponent: 'StepSummary',
    color: 'from-dark-600 to-dark-700'
  }
];

// ============================================================================
// URGENCY OPTIONS - Opciones de urgencia con estilos
// ============================================================================
const URGENCY_OPTIONS = [
  { 
    value: 'scheduled', 
    labelKey: 'scheduled', 
    descriptionKey: 'scheduledDesc',
    icon: '🗓️',
    color: 'border-brand-200 bg-brand-50 hover:border-brand-400'
  },
  { 
    value: 'immediate', 
    labelKey: 'urgent', 
    descriptionKey: 'urgentDesc',
    icon: '⚡',
    color: 'border-red-200 bg-red-50 hover:border-red-400'
  }
];

// ============================================================================
// CURRENCY OPTIONS
// ============================================================================
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso MX' },
  { code: 'ARS', symbol: '$', name: 'Peso AR' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RequestWizardModal({ provider, isOpen, onClose, initialCategory = null, editRequest = null, onEditSuccess = null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!editRequest;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    progress: 0,
    fileName: '',
    message: 'Subiendo archivos...',
    totalFiles: 0,
    currentFile: 0,
    status: 'uploading'
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    selectedProblems: [], // IDs de problemas seleccionados
    additionalDetails: '', // Detalles adicionales opcionales
    urgency: 'scheduled',
    address: '',
    coordinates: null,
    preferredDate: '',
    budgetAmount: '',
    currency: 'USD',
    photos: [],
    videos: []
  });

  const [formErrors, setFormErrors] = useState({});

  // Obtener problemas disponibles según la categoría del proveedor
  const availableProblems = useMemo(() => {
    if (!formData.category) return [];
    return getProblemsForCategory(formData.category);
  }, [formData.category]);

  // Inicializar categoría: usa initialCategory si viene, o la primera del proveedor
  useEffect(() => {
    if (provider && isOpen && !isEditMode) {
      const providerCategories = provider.providerProfile?.services || [];
      
      // Si viene initialCategory y el proveedor la ofrece, usarla
      let categoryToUse = '';
      if (initialCategory) {
        const hasCategory = providerCategories.some(s => s.category === initialCategory);
        if (hasCategory) {
          categoryToUse = initialCategory;
        } else {
          // Fallback a la primera categoría del proveedor
          categoryToUse = providerCategories[0]?.category || '';
        }
      } else {
        categoryToUse = providerCategories[0]?.category || '';
      }
      
      setFormData(prev => ({
        ...prev,
        category: categoryToUse,
        selectedProblems: [] // Reset problemas al cambiar categoría
      }));
    }
  }, [provider, isOpen, initialCategory, isEditMode]);

  // Pre-populate form when editing an existing request
  useEffect(() => {
    if (isEditMode && isOpen && editRequest) {
      const r = editRequest;
      setFormData({
        title: r.basicInfo?.title || '',
        description: r.basicInfo?.description || '',
        category: r.basicInfo?.category || '',
        subcategory: r.basicInfo?.subcategory || '',
        selectedProblems: [],
        additionalDetails: r.basicInfo?.description || '',
        urgency: r.basicInfo?.urgency || 'scheduled',
        address: r.location?.address || '',
        coordinates: r.location?.coordinates || null,
        preferredDate: r.scheduling?.preferredDate ? r.scheduling.preferredDate.split('T')[0] : '',
        budgetAmount: r.budget?.amount || '',
        currency: r.budget?.currency || 'USD',
        photos: (r.media?.photos || []).map(p => typeof p === 'string' ? { url: p, cloudinaryId: '', caption: '' } : p),
        videos: (r.media?.videos || []).map(v => typeof v === 'string' ? { url: v, cloudinaryId: '', caption: '' } : v)
      });
      setFormErrors({});
      // Mark all steps as completed so user can navigate freely
      setCompletedSteps([0, 1, 2, 3, 4]);
      // Open directly at Summary (last step) so user can review and update
      setCurrentStep(4);
    }
  }, [isEditMode, isOpen, editRequest]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setCompletedSteps([]);
      setFormData({
        title: '',
        description: '',
        category: '',
        subcategory: '',
        selectedProblems: [],
        additionalDetails: '',
        urgency: 'scheduled',
        address: '',
        coordinates: null,
        preferredDate: '',
        budgetAmount: '',
        currency: 'USD',
        photos: [],
        videos: []
      });
      setFormErrors({});
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Auto-fill address from map coordinates using reverse geocoding
  const handleLocationSelect = async (coordinates) => {
    updateField('coordinates', coordinates);
    
    if (!coordinates || !coordinates.lat || !coordinates.lng) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const address = data.address;
          const parts = [];
          
          if (address.road) parts.push(address.road);
          if (address.house_number) parts.push(address.house_number);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
          if (address.state) parts.push(address.state);
          
          const formattedAddress = parts.join(', ');
          if (formattedAddress) {
            updateField('address', formattedAddress);
          }
        }
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
    }
  };

  // Función para toggle de selección de problema
  const toggleProblem = (problemId) => {
    setFormData(prev => {
      const isSelected = prev.selectedProblems.includes(problemId);
      const newSelected = isSelected
        ? prev.selectedProblems.filter(id => id !== problemId)
        : [...prev.selectedProblems, problemId];
      return { ...prev, selectedProblems: newSelected };
    });
    // Limpiar error si se selecciona algo
    if (formErrors.selectedProblems) {
      setFormErrors(prev => ({ ...prev, selectedProblems: undefined }));
    }
  };

  // Generar descripción automática basada en problemas seleccionados
  const generateAutoDescription = () => {
    if (formData.selectedProblems.length === 0) {
      // In edit mode, use the existing additional details as description
      return formData.additionalDetails?.trim() || '';
    }
    
    const problemNames = formData.selectedProblems.map(problemId => {
      const key = `ui.categoryProblems.${formData.category}.${problemId}.name`;
      return t(key, { defaultValue: problemId });
    });
    
    let description = problemNames.join(', ');
    if (formData.additionalDetails?.trim()) {
      description += `. ${formData.additionalDetails.trim()}`;
    }
    return description;
  };

  // La ubicación es siempre opcional para todas las categorías
  const locationRequired = false;

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Paso de selección de problemas
        // In edit mode, allow proceeding without problem selection if there's already a description
        if (!isEditMode) {
          if (!formData.selectedProblems || formData.selectedProblems.length === 0) {
            errors.selectedProblems = t('ui.categoryProblems.noProblemsSelected');
          }
        } else {
          // In edit mode, require either problems or existing description/additionalDetails
          if ((!formData.selectedProblems || formData.selectedProblems.length === 0) && !formData.additionalDetails?.trim()) {
            errors.selectedProblems = t('ui.categoryProblems.noProblemsSelected');
          }
        }
        if (!formData.urgency) {
          errors.urgency = t('ui.requestWizard.selectUrgency');
        }
        break;
      case 1: // Media - opcional, siempre válido
        break;
      case 2: // Location - condicional según categoría
        // Solo validar si la categoría requiere ubicación O si el usuario ingresó datos parciales
        if (locationRequired) {
          if (!formData.address || formData.address.trim().length < 3) {
            errors.address = t('ui.requestWizard.addressRequired');
          }
          if (!formData.coordinates || !Number.isFinite(formData.coordinates.lat) || !Number.isFinite(formData.coordinates.lng)) {
            errors.coordinates = t('ui.requestWizard.selectLocationOnMap');
          }
        } else {
          // Para categorías remotas: si puso dirección, debe ser válida
          if (formData.address && formData.address.trim().length > 0 && formData.address.trim().length < 3) {
            errors.address = t('ui.requestWizard.addressTooShort');
          }
        }
        break;
      case 3: // Date - opcional, siempre válido
        break;
      case 4: // Summary
        // El paso de resumen no requiere validación adicional
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para omitir paso opcional
  const handleSkipStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (targetIndex) => {
    if (targetIndex === currentStep) return;
    const canAccess = targetIndex === 0 || completedSteps.includes(targetIndex - 1);

    if (canAccess) {
      setCurrentStep(targetIndex);
    } else {
      toast.warning(t('ui.requestWizard.completePreviousStep'));
    }
  };

  const handleCloseAttempt = () => {
    // In edit mode, close directly — data is already saved, nothing to lose
    if (isEditMode) {
      onClose();
      return;
    }
    const hasData = 
      formData.title || 
      formData.description || 
      formData.address ||
      formData.photos.length > 0 || 
      formData.videos.length > 0;

    if (hasData) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  const handleMediaUpload = async (files, type) => {
    if (!files || files.length === 0) return;
    
    const allowedTypes = type === 'photos' 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/webm'];

    const validation = validateFiles(files, {
      maxFiles: 10,
      maxSizeMB: 200,
      allowedTypes
    });

    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    const localPreviews = [];
    for (const file of validation.validFiles) {
      const preview = URL.createObjectURL(file);
      localPreviews.push({
        url: preview,
        cloudinaryId: 'uploading',
        caption: '',
        isLocal: true,
        fileName: file.name
      });
    }
    
    updateField(type, [...formData[type], ...localPreviews]);
    setUploadingMedia(true);
    
    try {
      let processedFiles = validation.validFiles;

      if (type === 'photos') {
        setUploadProgress({
          show: true,
          progress: 0,
          fileName: '',
          message: t('ui.requestWizard.compressingImages'),
          totalFiles: validation.validFiles.length,
          currentFile: 0,
          status: 'compressing'
        });

        try {
          processedFiles = await compressImages(validation.validFiles, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85
          }, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              progress: progress.percentage * 0.3,
              currentFile: progress.current
            }));
          });
        } catch (compressError) {
          console.warn('Compression failed, using original files:', compressError);
        }
      } else {
        setUploadProgress({
          show: true,
          progress: 0,
          fileName: processedFiles[0]?.name || '',
          message: t('ui.requestWizard.preparingVideoUpload'),
          totalFiles: validation.validFiles.length,
          currentFile: 0,
          status: 'uploading'
        });
      }

      const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      setUploadProgress(prev => ({
        ...prev,
        progress: type === 'photos' ? 30 : 0,
        message: t('ui.requestWizard.uploadingMedia', { type: type === 'photos' ? t('ui.requestWizard.photos') : t('ui.requestWizard.videos'), size: totalSizeMB }),
        status: 'uploading',
        fileName: processedFiles[0]?.name || ''
      }));

      const fd = new FormData();
      processedFiles.forEach((f) => fd.append('files', f));
      fd.append('type', type);

      const res = await api.post('/uploads/service-request/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const baseProgress = type === 'photos' ? 30 : 0;
          const progressRange = type === 'photos' ? 60 : 90;
          const adjustedProgress = baseProgress + Math.round((percentCompleted * progressRange) / 100);
          
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.min(adjustedProgress, 90),
            message: t('ui.requestWizard.uploadingMedia', { type: type === 'photos' ? t('ui.requestWizard.photos') : t('ui.requestWizard.videos'), size: totalSizeMB })
          }));
        }
      });

      setUploadProgress(prev => ({
        ...prev,
        progress: 95,
        message: t('ui.requestWizard.processingCloudinary'),
        status: 'processing'
      }));

      const uploaded = Array.isArray(res?.data?.data?.[type]) ? res.data.data[type] : [];
      if (uploaded.length) {
        const nonLocalFiles = formData[type].filter(item => !item.isLocal);
        updateField(type, [...nonLocalFiles, ...uploaded]);
        
        localPreviews.forEach(preview => {
          if (preview.isLocal) {
            URL.revokeObjectURL(preview.url);
          }
        });
        
        setUploadProgress({
          show: true,
          progress: 100,
          fileName: '',
          message: t('ui.requestWizard.filesUploadedSuccess'),
          totalFiles: validation.validFiles.length,
          currentFile: validation.validFiles.length,
          status: 'success'
        });

        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, show: false }));
        }, 2000);

        toast.success(t('ui.requestWizard.filesUploaded', { count: uploaded.length, type: type === 'photos' ? t('ui.requestWizard.photoPlural') : t('ui.requestWizard.videoPlural') }));
      }
    } catch (e) {
      console.error('Upload error:', e);
      
      const nonLocalFiles = formData[type].filter(item => !item.isLocal);
      updateField(type, nonLocalFiles);
      
      localPreviews.forEach(preview => {
        if (preview.isLocal) {
          URL.revokeObjectURL(preview.url);
        }
      });
      
      let errorMsg = t('ui.requestWizard.uploadFailed', { type: type === 'photos' ? t('ui.requestWizard.photos') : t('ui.requestWizard.videos') });
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        errorMsg = t('ui.requestWizard.fileTooLarge');
      } else if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      }
      
      setUploadProgress({
        show: true,
        progress: 0,
        fileName: '',
        message: t('ui.requestWizard.uploadError'),
        totalFiles: validation.validFiles.length,
        currentFile: 0,
        status: 'error'
      });

      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, show: false }));
      }, 3000);

      toast.error(errorMsg);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (type, index) => {
    updateField(type, formData[type].filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    if (!formData.category) {
      toast.error(t('ui.requestWizard.categoryNotDetermined'));
      return;
    }

    setLoading(true);
    let data;
    try {
      // Generate description from selected problems + additional details
      const generatedDescription = generateAutoDescription();
      const autoTitle = generatedDescription.substring(0, 50) + 
                       (generatedDescription.length > 50 ? '...' : '');
      
      // Construir payload - ubicación solo si está completa
      const hasValidLocation = formData.address?.trim() && 
                               formData.coordinates?.lat && 
                               formData.coordinates?.lng;
      
      const payload = {
        title: isEditMode ? (formData.title || autoTitle) : autoTitle,
        description: isEditMode ? (formData.additionalDetails || generatedDescription) : generatedDescription,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        urgency: formData.urgency,
        // Solo incluir ubicación si está completa
        address: hasValidLocation ? formData.address.trim() : undefined,
        coordinates: hasValidLocation ? formData.coordinates : undefined,
        preferredDate: formData.preferredDate || undefined,
        budget: formData.budgetAmount ? {
          amount: Number(formData.budgetAmount),
          currency: formData.currency
        } : undefined,
        photos: formData.photos,
        videos: formData.videos,
        visibility: 'auto',
        targetProviders: provider ? [provider._id] : undefined
      };

      if (isEditMode) {
        data = await api.put(`/client/requests/${editRequest._id}`, payload);
      } else {
        data = await api.post('/client/requests', payload);
      }
    } catch (err) {
      // Si es timeout pero la solicitud se creó, intentar fallback
      if (err.code === 'ECONNABORTED' && err.message?.includes('timeout')) {
        toast.info(isEditMode ? t('ui.requestWizard.updateSuccess') : t('ui.requestWizard.requestMayBeCreated'));
        onClose();
        if (!isEditMode) navigate('/mis-solicitudes');
        return;
      } else {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} request:`, err);
        const msg = err?.response?.data?.message || (isEditMode ? t('ui.requestWizard.updateError') : t('ui.requestWizard.createError'));
        toast.error(msg);
        return;
      }
    } finally {
      setLoading(false);
    }

    if (data?.data?.success) {
      if (isEditMode) {
        toast.success(t('ui.requestWizard.updateSuccess'));
        onEditSuccess?.(data.data.data?.request || editRequest);
      } else {
        const pName = provider?.providerProfile?.businessName || provider?.profile?.firstName || t('ui.requestWizard.theProvider');
        toast.success(t('ui.requestWizard.requestSent', { provider: pName }));
      }
      onClose();
      if (!isEditMode) navigate('/mis-solicitudes');
    } else {
      toast.warning(data?.data?.message || (isEditMode ? t('ui.requestWizard.updateError') : t('ui.requestWizard.couldNotCreate')));
    }
  };

  if (!isOpen || (!provider && !isEditMode)) return null;

  const providerName = isEditMode 
    ? (editRequest?.basicInfo?.category || t('ui.requestWizard.service'))
    : (provider?.providerProfile?.businessName || provider?.profile?.firstName || t('ui.requestWizard.thisProfessional'));
  const providerAvatar = isEditMode ? null : (provider?.providerProfile?.avatar || provider?.profile?.avatar);
  const step = STEPS[currentStep];

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      {/* Indicador de progreso de subida */}
      <UploadProgress {...uploadProgress} />

      {/* Modal de confirmación de cierre */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-10004 flex items-center justify-center p-4 animate-modal-enter">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-zoom-in">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Warning className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('ui.requestWizard.cancelRequest')}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('ui.requestWizard.dataWillBeLost')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {t('ui.requestWizard.continue')}
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                {t('ui.requestWizard.yesCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal principal */}
      <div className="fixed inset-0 z-10002 flex items-center justify-center pt-20 pb-4 px-2 sm:pt-24 sm:pb-6 sm:px-4 lg:pt-20 lg:pb-8 lg:px-8">
        {/* Backdrop con blur */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10002 animate-modal-enter"
          onClick={handleCloseAttempt}
        />
        {/* Modal content */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden animate-zoom-in z-10003"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ============================================================ */}
          {/* COMPACT HEADER - Encabezado compacto con gradiente */}
          {/* ============================================================ */}
          <div className={`relative bg-linear-to-r ${step.color} p-4`}>
            {/* Botón cerrar */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-3 right-3 z-30 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center transition-all"
              title={t('common.close')}
            >
              <Icons.Close className="w-5 h-5 text-white" />
            </button>

            {/* Provider info mini */}
            <div className="flex items-center gap-3">
              {/* Avatar pequeño */}
              <div className="relative shrink-0">
                {providerAvatar ? (
                  <img 
                    src={providerAvatar} 
                    alt={providerName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-lg font-bold">
                    {providerName.charAt(0).toUpperCase()}
                  </div>
                )}
                {(() => {
                  const StepIcon = Icons[step.iconComponent];
                  return StepIcon ? (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <StepIcon className="w-3.5 h-3.5 text-white" />
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-white">
                <h2 className="text-base sm:text-lg font-bold truncate pr-8">
                  {isEditMode 
                    ? t('ui.requestWizard.editRequestTitle', { category: formData.category || t('ui.requestWizard.service') })
                    : t('ui.requestWizard.requestForCategory', { 
                        provider: providerName, 
                        category: formData.category || t('ui.requestWizard.service') 
                      })
                  }
                </h2>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span>{t('ui.requestWizard.stepOf', { current: currentStep + 1, total: STEPS.length })}</span>
                  <span>•</span>
                  <span>{t(`ui.requestWizard.steps.${step.titleKey}`)}</span>
                </div>
              </div>
            </div>

            {/* Progress bar inline */}
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* STEP NAVIGATION - Navegación horizontal de pasos */}
          {/* ============================================================ */}
          <div className="bg-gray-50 border-b px-2 py-2">
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((s, idx) => {
                const isCompleted = completedSteps.includes(idx);
                const isCurrent = idx === currentStep;
                const canNavigate = idx === 0 || completedSteps.includes(idx - 1);
                const isClickable = !isCurrent && (isCompleted || canNavigate);
                
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    disabled={!isClickable && !isCurrent}
                    className={`
                      flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all
                      ${isCurrent ? 'bg-white shadow-sm' : ''}
                      ${isClickable ? 'hover:bg-white/70 cursor-pointer' : ''}
                      ${!isClickable && !isCurrent ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={s.title}
                  >
                    <div className="w-8 h-8 flex items-center justify-center transition-all">
                      {isCompleted ? (
                        <Icons.Check className="w-5 h-5 text-green-500" />
                      ) : (() => {
                        const StepIcon = Icons[s.iconComponent];
                        return StepIcon ? (
                          <StepIcon className={`w-5 h-5 ${isCurrent ? 'text-brand-600' : 'text-gray-400'}`} />
                        ) : null;
                      })()}
                    </div>
                    <span className={`text-[10px] sm:text-xs text-center truncate w-full ${
                      isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {t(`ui.requestWizard.steps.${s.shortTitleKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SCROLLABLE CONTENT - Contenido del paso actual */}
          {/* ============================================================ */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Step header */}
              <div className="mb-5">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {(() => {
                    const StepIcon = Icons[step.iconComponent];
                    return StepIcon ? <StepIcon className="w-6 h-6 text-gray-400" /> : null;
                  })()}
                  {t(`ui.requestWizard.steps.${step.titleKey}`)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{t(`ui.requestWizard.steps.${step.descriptionKey}`)}</p>
              </div>

              {/* ==================== STEP 0: PROJECT SETUP ==================== */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  {/* ── Urgency Toggle - Minimal pill selector ── */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700 mr-1">{t('ui.requestWizard.urgencyTitle')}</span>
                    <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
                      {URGENCY_OPTIONS.map((option) => {
                        const isSelected = formData.urgency === option.value;
                        const isUrgent = option.value === 'immediate';
                        
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('urgency', option.value)}
                            className={`
                              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                              ${isSelected
                                ? isUrgent
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : 'bg-brand-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'}
                            `}
                          >
                            <span className="text-base leading-none">{isUrgent ? '⚡' : '🗓️'}</span>
                            {t(`ui.requestWizard.urgency.${option.labelKey}`)}
                          </button>
                        );
                      })}
                    </div>
                    {formErrors.urgency && (
                      <p className="text-xs text-red-600 w-full">{formErrors.urgency}</p>
                    )}
                  </div>

                  {/* ── Info banner ── */}
                  <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4">
                    <Icons.Wrench className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-brand-800">{t('ui.categoryProblems.selectTitle')}</p>
                      <p className="text-sm text-brand-700">{t('ui.categoryProblems.selectSubtitle')}</p>
                    </div>
                  </div>

                  {/* ── Problem Grid Selection ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        {t('ui.requestWizard.whatProblemHave')} *
                      </label>
                      {formData.selectedProblems.length > 0 && (
                        <span className="text-xs font-medium text-brand-600 bg-brand-100 px-2 py-1 rounded-full">
                          {t('ui.requestWizard.problemsSelectedSummary', { count: formData.selectedProblems.length })}
                        </span>
                      )}
                    </div>
                    
                    {/* Problems Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {availableProblems.map((problem) => {
                        const isSelected = formData.selectedProblems.includes(problem.id);
                        const problemName = t(`ui.categoryProblems.${formData.category}.${problem.id}.name`);
                        const problemDesc = t(`ui.categoryProblems.${formData.category}.${problem.id}.desc`);
                        // Cards with long text (name > 20 chars or desc > 40 chars) go full width on mobile
                        const isLongText = problemName.length > 20 || problemDesc.length > 40;
                        const isOther = problem.id === 'other';
                        
                        return (
                          <button
                            key={problem.id}
                            type="button"
                            onClick={() => toggleProblem(problem.id)}
                            className={`
                              relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all group
                              ${isSelected 
                                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' 
                                : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'}
                              ${(isOther || isLongText) ? 'col-span-1 xs:col-span-2 sm:col-span-1' : ''}
                            `}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <ProblemIcon emoji={problem.icon} className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium text-sm sm:text-base leading-snug ${isSelected ? 'text-brand-800' : 'text-gray-900'}`}>
                                  {problemName}
                                </p>
                                <p className="text-xs text-gray-500 leading-snug mt-0.5 line-clamp-2">
                                  {problemDesc}
                                </p>
                              </div>
                            </div>
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                                <Icons.Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {formErrors.selectedProblems && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.selectedProblems}
                      </p>
                    )}
                  </div>

                  {/* Additional Details - Optional textarea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.categoryProblems.additionalDetails')}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.additionalDetails}
                      onChange={(e) => updateField('additionalDetails', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 
                        placeholder:text-gray-400 resize-none transition-colors
                        focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder={t('ui.categoryProblems.additionalDetailsPlaceholder')}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t('ui.requestWizard.characters', { count: formData.additionalDetails.length })}
                    </p>
                  </div>

                </div>
              )}

              {/* ==================== STEP 1: MEDIA ==================== */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Tip banner */}
                  <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4">
                    <Icons.Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-brand-800">{t('ui.requestWizard.tip')}</p>
                      <p className="text-sm text-brand-700">{t('ui.requestWizard.compressionTip')}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Photos upload */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icons.Photo className="w-5 h-5 text-brand-600" />
                        <label className="text-sm font-semibold text-gray-700">{t('ui.requestWizard.photos')}</label>
                        <span className="text-xs text-gray-400">({t('ui.requestWizard.optional')})</span>
                      </div>
                      
                      <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/50'}
                      `}>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center">
                          {t('ui.requestWizard.clickOrDragImages')}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e.target.files, 'photos')}
                          className="hidden"
                          disabled={uploadingMedia}
                        />
                      </label>

                      {formData.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {formData.photos.map((photo, idx) => (
                            <div key={idx} className="relative group aspect-square">
                              <img
                                src={photo.url}
                                alt={t('ui.requestWizard.photoAlt', { number: idx + 1 })}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {photo.isLocal && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              {!photo.isLocal && (
                                <button
                                  type="button"
                                  onClick={() => removeMedia('photos', idx)}
                                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Icons.Close className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos upload */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icons.Video className="w-5 h-5 text-pink-600" />
                        <label className="text-sm font-semibold text-gray-700">{t('ui.requestWizard.videos')}</label>
                        <span className="text-xs text-gray-400">({t('ui.requestWizard.maxSize', { size: '200MB' })})</span>
                      </div>
                      
                      <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50/50'}
                      `}>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center">
                          {t('ui.requestWizard.clickOrDragVideos')}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, WebM</span>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleMediaUpload(e.target.files, 'videos')}
                          className="hidden"
                          disabled={uploadingMedia}
                        />
                      </label>

                      {formData.videos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {formData.videos.map((video, idx) => (
                            <div key={idx} className="relative group aspect-video">
                              <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
                                <video
                                  src={video.url}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                    <Icons.Play className="w-4 h-4 text-gray-800 ml-0.5" />
                                  </div>
                                </div>
                                {video.isLocal && (
                                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                                    <span className="text-xs text-white">{t('ui.requestWizard.uploading')}</span>
                                  </div>
                                )}
                              </div>
                              {!video.isLocal && (
                                <button
                                  type="button"
                                  onClick={() => removeMedia('videos', idx)}
                                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Icons.Close className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: LOCATION ==================== */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Banner informativo según si es obligatorio u opcional */}
                  {!locationRequired && (
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-xl">💻</span>
                      <div>
                        <p className="text-sm font-medium text-brand-800">
                          {t('ui.requestWizard.locationOptionalTitle')}
                        </p>
                        <p className="text-sm text-brand-700">
                          {t('ui.requestWizard.locationOptionalDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Map */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.requestWizard.selectOnMap')} {locationRequired && '*'}
                    </label>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                      <MapPicker
                        value={formData.coordinates}
                        onChange={handleLocationSelect}
                      />
                    </div>
                    {formErrors.coordinates && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.coordinates}
                      </p>
                    )}
                  </div>

                  {/* Address input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.requestWizard.serviceAddress')} {locationRequired && '*'}
                    </label>
                    <div className="relative">
                      <Icons.MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className={`
                          w-full border-2 rounded-xl pl-10 pr-4 py-3 text-gray-900 
                          placeholder:text-gray-400 transition-colors
                          focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                          ${formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                        `}
                        placeholder={t('ui.requestWizard.addressAutoComplete')}
                      />
                    </div>
                    {formErrors.address ? (
                      <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        💡 {t('ui.requestWizard.canEditAddress')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: DATE ==================== */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-sm text-amber-800">
                      {t('ui.requestWizard.stepOptional')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.requestWizard.whenNeeded')}
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => updateField('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  {/* Quick date options */}
                  <div>
                    <p className="text-sm text-gray-500 mb-3">{t('ui.requestWizard.orSelectQuickOption')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { labelKey: 'today', days: 0 },
                        { labelKey: 'tomorrow', days: 1 },
                        { labelKey: 'thisWeek', days: 7 },
                        { labelKey: 'nextWeek', days: 14 }
                      ].map((opt) => {
                        const date = new Date();
                        date.setDate(date.getDate() + opt.days);
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = formData.preferredDate === dateStr;
                        
                        return (
                          <button
                            key={opt.labelKey}
                            type="button"
                            onClick={() => updateField('preferredDate', dateStr)}
                            className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all
                              ${isSelected 
                                ? 'bg-brand-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                          >
                            {t(`ui.requestWizard.dateOptions.${opt.labelKey}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 4: RESUMEN ==================== */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  {/* Request completeness indicator */}
                  {(() => {
                    const hasLocation = formData.address?.trim() && formData.coordinates?.lat;
                    const hasDate = !!formData.preferredDate;
                    const hasMedia = formData.photos.length > 0 || formData.videos.length > 0;
                    const isComplete = hasLocation && hasDate && hasMedia;
                    
                    return (
                      <div className={`rounded-xl p-4 flex items-start gap-3 ${
                        isComplete 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-amber-50 border border-amber-200'
                      }`}>
                        {isComplete 
                          ? <Icons.Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          : <ProblemIcon emoji="💡" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        }
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>
                            {isComplete 
                              ? t('ui.requestWizard.requestComplete')
                              : t('ui.requestWizard.requestIncomplete')
                            }
                          </p>
                          {!isComplete && (
                            <p className="text-sm text-amber-700 mt-1">
                              {t('ui.requestWizard.incompleteHint')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary card */}
                  <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Icons.StepSummary className="w-5 h-5 text-gray-400" />
                      {t('ui.requestWizard.requestSummary')}
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Selected Problems */}
                      <div className="flex items-start gap-3">
                        <Icons.StepProblem className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{t('ui.requestWizard.steps.problems')}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {formData.selectedProblems.map((problemId) => {
                              const problem = availableProblems.find(p => p.id === problemId);
                              return problem ? (
                                <span 
                                  key={problemId}
                                  className="inline-flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full"
                                >
                                  <ProblemIcon emoji={problem.icon} className="w-3.5 h-3.5 text-brand-600" />
                                  {t(`ui.categoryProblems.${formData.category}.${problemId}.name`)}
                                </span>
                              ) : null;
                            })}
                          </div>
                          {formData.additionalDetails && (
                            <p className="text-xs text-gray-600 mt-2 italic">
                              "{formData.additionalDetails.substring(0, 80)}{formData.additionalDetails.length > 80 ? '...' : ''}"
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(0)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {t('ui.requestWizard.edit')}
                        </button>
                      </div>
                      
                      {/* Location - con indicador de opcional */}
                      <div className="flex items-start gap-3">
                        <Icons.StepLocation className={`w-5 h-5 shrink-0 mt-0.5 ${formData.address ? 'text-gray-400' : 'text-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">
                            {t('ui.requestWizard.steps.location')}
                            {!locationRequired && <span className="text-gray-400 ml-1">({t('ui.requestWizard.optional')})</span>}
                          </p>
                          <p className={`text-sm truncate ${formData.address ? 'text-gray-900' : 'text-amber-600 italic'}`}>
                            {formData.address || t('ui.requestWizard.notSpecified')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {formData.address ? t('ui.requestWizard.edit') : t('ui.requestWizard.add')}
                        </button>
                      </div>
                      
                      {/* Date - con indicador de opcional */}
                      <div className="flex items-start gap-3">
                        <Icons.StepDate className={`w-5 h-5 shrink-0 mt-0.5 ${formData.preferredDate ? 'text-gray-400' : 'text-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">
                            {t('ui.requestWizard.steps.date')}
                            <span className="text-gray-400 ml-1">({t('ui.requestWizard.optional')})</span>
                          </p>
                          <p className={`text-sm ${formData.preferredDate ? 'text-gray-900' : 'text-amber-600 italic'}`}>
                            {formData.preferredDate || t('ui.requestWizard.notSpecified')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {formData.preferredDate ? t('ui.requestWizard.edit') : t('ui.requestWizard.add')}
                        </button>
                      </div>
                      
                      {/* Urgency */}
                      <div className="flex items-start gap-3">
                        <ProblemIcon emoji="⚡" className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{t('ui.requestWizard.urgencyLabel')}</p>
                          <p className="text-sm text-gray-900 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${formData.urgency === 'immediate' ? 'bg-red-500' : 'bg-blue-500'}`} />
                            {formData.urgency === 'immediate' ? t('ui.requestWizard.urgency.urgent') : t('ui.requestWizard.urgency.scheduled')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(0)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {t('ui.requestWizard.edit')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Archivos adjuntos con miniaturas */}
                  {(formData.photos.length > 0 || formData.videos.length > 0) && (
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <Icons.StepMedia className="w-5 h-5 text-gray-400" />
                          {t('ui.requestWizard.attachedFiles', { count: formData.photos.length + formData.videos.length })}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          {t('ui.requestWizard.editFiles')}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {/* Miniaturas de fotos */}
                        {formData.photos.map((photo, index) => (
                          <div 
                            key={`photo-${index}`} 
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group"
                          >
                            <img
                              src={photo.url || photo.preview || URL.createObjectURL(photo)}
                              alt={t('ui.requestWizard.photoAlt', { number: index + 1 })}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newPhotos = formData.photos.filter((_, i) => i !== index);
                                  updateField('photos', newPhotos);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                title={t('ui.requestWizard.deletePhoto')}
                              >
                                <Icons.Close className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {t('ui.requestWizard.photoLabel')}
                            </div>
                          </div>
                        ))}
                        
                        {/* Miniaturas de videos */}
                        {formData.videos.map((video, index) => (
                          <div 
                            key={`video-${index}`} 
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-200 group"
                          >
                            <video
                              src={video.url || video.preview || URL.createObjectURL(video)}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 rounded-full p-2">
                                <Icons.Play className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVideos = formData.videos.filter((_, i) => i !== index);
                                  updateField('videos', newVideos);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                title={t('ui.requestWizard.deleteVideo')}
                              >
                                <Icons.Close className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {t('ui.requestWizard.videoLabel')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay archivos */}
                  {formData.photos.length === 0 && formData.videos.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-300 text-center">
                      <Icons.StepMedia className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                      <p className="text-sm text-gray-500 mb-2">{t('ui.requestWizard.noFilesAttached')}</p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        + {t('ui.requestWizard.addPhotosOrVideos')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* FOOTER - Botones de navegación */}
          {/* ============================================================ */}
          <div className="bg-gray-50 border-t px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Botón Cancelar */}
              <button
                type="button"
                onClick={handleCloseAttempt}
                disabled={loading}
                className="flex items-center gap-1 px-2 sm:px-4 py-2 sm:py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all text-sm"
              >
                <Icons.Close className="w-4 h-4" />
                <span className="hidden sm:inline">{t('ui.requestWizard.cancel')}</span>
              </button>
              
              {/* Botón Anterior */}
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
                className={`
                  flex items-center gap-1 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm
                  ${currentStep === 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-200'}
                `}
              >
                <Icons.ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('ui.requestWizard.previous')}</span>
              </button>
            </div>

            <div className="hidden xs:flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep ? 'bg-brand-600 w-4' : 
                    completedSteps.includes(idx) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Botón Omitir - visible en pasos opcionales (Media, Ubicación, Fecha) */}
                {(currentStep === 1 || currentStep === 2 || currentStep === 3) && (
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="flex items-center gap-1 px-2 sm:px-4 py-2 sm:py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all text-xs sm:text-sm"
                  >
                    <span>{t('ui.requestWizard.skip')}</span>
                    <Icons.ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={uploadingMedia}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                >
                  <span>{t('ui.requestWizard.continue')}</span>
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={handleSubmit} 
                loading={loading} 
                disabled={uploadingMedia}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm sm:text-base whitespace-nowrap"
              >
                <Icons.Send className="w-4 h-4 shrink-0" />
                <span>{isEditMode ? t('ui.requestWizard.saveChanges') : t('ui.requestWizard.sendRequest')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

RequestWizardModal.propTypes = {
  provider: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialCategory: PropTypes.string,
  editRequest: PropTypes.object,
  onEditSuccess: PropTypes.func
};

export default RequestWizardModal;
