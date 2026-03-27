export const DASHBOARD_NAV_ITEMS = [
  { key: 'home', label: '홈', shortLabel: '홈', icon: '⌂' },
  { key: 'projects', label: '보관함', shortLabel: '보관함', icon: '▣' },
  { key: 'templates', label: '템플릿', shortLabel: '템플릿', icon: '◫' },
  { key: 'editor', label: '편집실', shortLabel: '편집실', icon: '✎' },
];

export const HOME_QUICK_ACTIONS = [
  { label: '빈 문서', hint: '직접 시작', icon: '＋' },
  { label: '포트폴리오', hint: '대표 이력 정리', icon: '▭' },
  { label: '프로젝트 요약', hint: '케이스 스터디', icon: '◫' },
  { label: 'PDF용 문서', hint: '출력 중심', icon: '⇩' },
  { label: '템플릿 적용', hint: '빠른 초안', icon: '⌘' },
  { label: '업로드 보드', hint: '이미지/파일', icon: '↥' },
];

export const HIGHLIGHT_CARDS = [
  {
    title: '프로젝트 중심 포트폴리오',
    description: '프로젝트 카드 흐름을 기준으로 정리해서 면접용 PDF까지 바로 이어갈 수 있습니다.',
    badge: 'Workflow',
    tone: 'ink',
  },
  {
    title: '심플한 이력형 템플릿',
    description: '기술 스택, 경력 요약, 수상과 자격증을 빠르게 채워 넣는 시작점입니다.',
    badge: 'Template',
    tone: 'sand',
  },
  {
    title: '발표용 포트폴리오 정리',
    description: 'PDF 분할과 프로젝트 구조를 기준으로 발표 자료 형태까지 한 번에 다듬습니다.',
    badge: 'Export',
    tone: 'blue',
  },
];

export const RECENT_PROJECTS = [
  {
    id: 'portfolio-v1',
    title: '포트폴리오 v1',
    subtitle: '1개월 전 편집됨',
    meta: '포트폴리오',
    kind: 'portfolio',
  },
  {
    id: 'blue-magazine',
    title: '페일 블루 매거진 스타일 포트폴리오',
    subtitle: '4개월 전 편집됨',
    meta: '템플릿 기반',
    kind: 'magazine',
  },
  {
    id: 'assignment-6',
    title: '과제 검수 발표 자료',
    subtitle: '9개월 전 편집됨',
    meta: '발표 자료',
    kind: 'slide',
  },
  {
    id: 'spring-study',
    title: '스프링 기초 스터디',
    subtitle: '11개월 전 편집됨',
    meta: '스터디',
    kind: 'study',
  },
];

export const PROJECT_FILTERS = ['유형', '카테고리', '소유자', '수정일'];

export const FOLDERS = [
  { id: 'uploads', title: '업로드 보드', caption: '파일 12개' },
  { id: 'spring', title: '스프링스터디', caption: '항목 4개' },
];

export const TEMPLATE_CATEGORIES = ['기본형', '미니멀', '프로젝트형', '브랜드형', '발표용', '크리에이티브'];

export const TEMPLATE_BROWSE_ROWS = [
  ['미니멀 포트폴리오', '케이스 스터디', '심플 이력형', '커버 + 내지', '프로젝트 쇼케이스', '원페이지'],
  ['발표 문서', '자기소개형', '작업 로그', '캠페인 브리프', '제안서형', 'SNS 확장형'],
];

export const INSPIRED_TEMPLATES = [
  {
    id: 'biz-pres',
    title: '비즈니스 프레젠테이션',
    author: 'Studio Larana',
    summary: '깔끔한 타이포와 넓은 여백을 중심으로 구성한 발표형 템플릿입니다.',
  },
  {
    id: 'simple-pres',
    title: '심플 포트폴리오 브리프',
    author: 'Plain Deck',
    summary: '프로젝트 개요와 핵심 기여를 짧고 선명하게 보여주는 포맷입니다.',
  },
  {
    id: 'portfolio-clean',
    title: '에디토리얼 포트폴리오',
    author: 'North Grid',
    summary: '표지, 본문, 프로젝트 설명 블록이 자연스럽게 이어지는 포맷입니다.',
  },
];
